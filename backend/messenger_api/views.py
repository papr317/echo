# backend/messenger_api/views.py (ФИНАЛЬНЫЙ ИСПРАВЛЕННЫЙ КОД)

from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.shortcuts import get_object_or_404
# Добавлен импорт для обработки ошибок MongoDB

from builtins import ConnectionError # Используем стандартное исключение

from .models import Chat
from backend.users_api.models import CustomUser 
from .serializers import ChatSerializer, MessageSerializer 
# Импорт сервиса для работы с MongoDB
from .mongo_models import MongoMessage 


# -------------------------------------------------------------
# 1. VIEWS ДЛЯ ЧАТОВ И СООБЩЕНИЙ
# -------------------------------------------------------------

class ChatListView(generics.ListCreateAPIView):
    """API для получения списка чатов и создания нового чата."""
    # Убираем заглушку, используем ваш готовый ChatSerializer
    serializer_class = ChatSerializer 
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Возвращаем чаты, в которых состоит текущий пользователь, отсортированные по дате
        return Chat.objects.filter(participants=self.request.user).order_by('-last_message_date')
    
    def get_serializer_context(self):
        # Передаем request в сериализатор для логики определения партнера/создания
        return {'request': self.request}


class MessageListView(generics.ListCreateAPIView): 
    # ListCreateAPIView для возможности GET (список) и POST (создание)
    """API для получения списка сообщений в конкретном чате (GET) и отправки нового (POST)."""
    serializer_class = MessageSerializer 
    permission_classes = [IsAuthenticated]
    
    def get_serializer_context(self):
        # Передаем request и chat_id в сериализатор для создания/получения сообщений
        return {'request': self.request, 'chat_id': self.kwargs['chat_id']}
        
    def get_chat(self, chat_id, user):
        """Проверяет существование чата и участие в нем пользователя."""
        # Используем Integer PK
        return get_object_or_404(Chat.objects.filter(participants=user), pk=chat_id)

    # *** МЕТОД GET (Список сообщений) ***
    def list(self, request, *args, **kwargs):
        chat_id = self.kwargs['chat_id'] 
        current_user = self.request.user
        
        # Проверка доступа
        chat = self.get_chat(chat_id, current_user)
        
        # Получаем параметры пагинации
        try: limit = int(request.query_params.get('limit', 50))
        except ValueError: limit = 50
        before_id = request.query_params.get('before_id') 
        
        # Получаем список сообщений из MongoDB
        try:
            # chat.pk - это Integer ID, который MongoMessage корректно обрабатывает
            messages = MongoMessage.get_messages_for_chat(chat_id=chat.pk, limit=limit, before_id=before_id)
        except ConnectionError:
             return Response({"detail": "Ошибка подключения к базе данных сообщений."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Сериализуем и отправляем ответ
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # *** МЕТОД POST (Создание сообщения) ***
    def create(self, request, *args, **kwargs):
        chat_id = self.kwargs['chat_id']
        current_user = self.request.user
        
        # Проверка доступа: чат должен существовать и пользователь должен быть участником
        self.get_chat(chat_id, current_user) 
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Сериализатор вызывает MongoMessage.save()
            message_data = serializer.save() 
            
            # Если нужно, можно добавить логику отправки сообщения через Channels здесь
            
            headers = self.get_success_headers(serializer.data)
            return Response(message_data, status=status.HTTP_201_CREATED, headers=headers)
        except ConnectionError:
             return Response({"detail": "Ошибка подключения к базе данных сообщений. Сообщение не отправлено."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# -------------------------------------------------------------
# 2. VIEWSET ДЛЯ УПРАВЛЕНИЯ УЧАСТНИКАМИ И АДМИНАМИ (ВАШ КОД, НЕ ТРЕБУЕТ ИЗМЕНЕНИЙ)
# -------------------------------------------------------------

class MemberManagementViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    # ... Ваш полный и корректный код методов add_member, remove_member, set_admin, remove_admin ...
    
    @action(detail=True, methods=['post'], url_path='members/add')
    def add_member(self, request, pk=None):
        chat = get_object_or_404(Chat, pk=pk)
        user_to_add_id = request.data.get('user_id')
        
        if not chat.is_admin(request.user):
            return Response({"detail": "У вас нет прав администратора для добавления участников."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            user_to_add = CustomUser.objects.get(pk=user_to_add_id)
        except CustomUser.DoesNotExist:
            return Response({"detail": "Пользователь не найден."}, status=status.HTTP_404_NOT_FOUND)

        if chat.participants.filter(pk=user_to_add_id).exists():
            return Response({"detail": "Пользователь уже является участником чата."}, status=status.HTTP_400_BAD_REQUEST)

        chat.participants.add(user_to_add)
        return Response({"detail": f"Пользователь {user_to_add.username} добавлен в чат."}, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'], url_path='members/remove')
    def remove_member(self, request, pk=None):
        chat = get_object_or_404(Chat, pk=pk)
        user_to_remove_id = request.data.get('user_id')
        
        if not chat.is_admin(request.user):
            return Response({"detail": "У вас нет прав администратора для удаления участников."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            user_to_remove = CustomUser.objects.get(pk=user_to_remove_id)
        except CustomUser.DoesNotExist:
            return Response({"detail": "Пользователь не найден."}, status=status.HTTP_404_NOT_FOUND)

        if (chat.is_owner(user_to_remove) or chat.is_admin(user_to_remove)) and not chat.is_owner(request.user):
            return Response({"detail": "Администратор не может удалить владельца или другого администратора."}, status=status.HTTP_403_FORBIDDEN)

        if user_to_remove == request.user:
            return Response({"detail": "Для выхода используйте /leave/ эндпоинт."}, status=status.HTTP_400_BAD_REQUEST)
            
        if chat.participants.filter(pk=user_to_remove_id).exists():
            chat.participants.remove(user_to_remove)
            if chat.administrators.filter(pk=user_to_remove_id).exists():
                chat.administrators.remove(user_to_remove)
                
            return Response({"detail": f"Пользователь {user_to_remove.username} удален из чата."}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Пользователь не является участником чата."}, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=True, methods=['post'], url_path='admin/set')
    def set_admin(self, request, pk=None):
        chat = get_object_or_404(Chat, pk=pk)
        user_to_set_id = request.data.get('user_id')
        
        if not chat.is_owner(request.user):
            return Response({"detail": "Только владелец чата может назначать администраторов."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            user_to_set = CustomUser.objects.get(pk=user_to_set_id)
        except CustomUser.DoesNotExist:
            return Response({"detail": "Пользователь не найден."}, status=status.HTTP_404_NOT_FOUND)

        if not chat.participants.filter(pk=user_to_set_id).exists():
            return Response({"detail": "Нельзя назначить администратором того, кто не является участником чата."}, status=status.HTTP_400_BAD_REQUEST)
            
        if chat.is_owner(user_to_set):
            return Response({"detail": "Этот пользователь уже является владельцем."}, status=status.HTTP_400_BAD_REQUEST)

        chat.administrators.add(user_to_set)
        return Response({"detail": f"Пользователь {user_to_set.username} назначен администратором."}, status=status.HTTP_200_OK)
        
        
    @action(detail=True, methods=['post'], url_path='admin/remove')
    def remove_admin(self, request, pk=None):
        chat = get_object_or_404(Chat, pk=pk)
        user_to_remove_id = request.data.get('user_id')
        
        if not chat.is_owner(request.user):
            return Response({"detail": "Только владелец чата может снимать администраторов."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            user_to_remove = CustomUser.objects.get(pk=user_to_remove_id)
        except CustomUser.DoesNotExist:
            return Response({"detail": "Пользователь не найден."}, status=status.HTTP_404_NOT_FOUND)

        if chat.is_owner(user_to_remove):
            return Response({"detail": "Нельзя снять владельца чата с должности администратора."}, status=status.HTTP_400_BAD_REQUEST)

        if chat.administrators.filter(pk=user_to_remove_id).exists():
            chat.administrators.remove(user_to_remove)
            return Response({"detail": f"Пользователь {user_to_remove.username} снят с должности администратора."}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Пользователь не является администратором."}, status=status.HTTP_400_BAD_REQUEST)
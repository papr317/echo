# messenger_api/views.py (ИСПРАВЛЕННЫЙ И ПОЛНЫЙ КОД)

from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.shortcuts import get_object_or_404
from .models import Chat
# Предполагаем, что CustomUser импортируется из users_api.models
from backend.users_api.models import CustomUser 
from .serializers import ChatSerializer, MessageSerializer 



class ChatListView(generics.ListCreateAPIView):
    """API для получения списка чатов и создания нового чата."""
    # Укажите ваш реальный ChatSerializer
    # serializer_class = ChatSerializer 
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Возвращаем чаты, в которых состоит текущий пользователь
        return Chat.objects.filter(participants=self.request.user).order_by('-last_message_date')
    
    def list(self, request, *args, **kwargs):
        # Временная заглушка, пока нет сериализатора
        return Response({"detail": "Chat list endpoint is working."}, status=status.HTTP_200_OK)


class MessageListView(generics.ListAPIView):
    """API для получения списка сообщений в конкретном чате."""
    serializer_class = MessageSerializer 
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        chat_id = self.kwargs['chat_id']
        get_object_or_404(Chat, pk=chat_id, participants=self.request.user)
        
        return Chat.objects.none() 

    def list(self, request, *args, **kwargs):
        return Response([], status=status.HTTP_200_OK)

# -------------------------------------------------------------
# 2. VIEWSET ДЛЯ УПРАВЛЕНИЯ УЧАСТНИКАМИ И АДМИНАМИ
# -------------------------------------------------------------

class MemberManagementViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    # POST /chats/{chat_id}/members/add/ (Добавление участника)
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


    # POST /chats/{chat_id}/members/remove/ (Удаление участника)
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


    # POST /chats/{chat_id}/admin/set/ (Назначение администратора)
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
        
        
    # POST /chats/{chat_id}/admin/remove/ (Снятие администратора)
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
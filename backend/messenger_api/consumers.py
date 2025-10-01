import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from django.db.models import Q # Для более чистой проверки доступа

# Импорты для сохранения
from .serializers import MessageSerializer 
from .models import Chat 

User = get_user_model()


# 1. Синхронная функция для сохранения сообщения
@database_sync_to_async
def save_message_and_get_data(chat_id, text, user):
    """
    Выполняет синхронное сохранение сообщения в MongoDB 
    через MessageSerializer и возвращает сериализованные данные.
    """
    
    # 1. Создаем фиктивный объект запроса для контекста Serializer
    class MockRequest:
        def __init__(self, user):
            self.user = user
            self.method = 'POST' 
            
    mock_request = MockRequest(user)
    
    # 2. Подготовка данных и контекста
    data = {'text': text}
    context = {
        'chat_id': chat_id, # Значение для MessageSerializer.create из context
        'request': mock_request, # Значение для получения sender_id из context['request']
    }
    
    # 3. Валидация и сохранение
    serializer = MessageSerializer(data=data, context=context)
    
    if serializer.is_valid(raise_exception=True):
        # 🚨 ИСПРАВЛЕНИЕ: Вызываем .save() БЕЗ ДОПОЛНИТЕЛЬНЫХ АРГУМЕНТОВ.
        # Serializer сам возьмет chat_id и sender_id из context.
        serializer.save() 
        
        # 4. Возвращаем сериализованные данные для рассылки
        return serializer.data
    
    return None

# 2. Синхронная функция для проверки доступа к чату
@database_sync_to_async
def get_chat_and_check_access(chat_id, user):
    """Проверяет, существует ли чат и является ли пользователь его участником."""
    if user.is_anonymous:
        return False
    try:
        # Ищем чат, в котором пользователь является участником
        chat = Chat.objects.filter(
            Q(pk=chat_id) & Q(participants__pk=user.pk)
        ).first()
        
        return chat is not None
        
    except Exception:
        return False


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("--- CONSUMER: Attempting connection ---")
        
        # Аутентификация
        self.user = self.scope.get("user", AnonymousUser())
        if not self.user.is_authenticated:
            await self.authenticate_via_token()
        
        # Получаем ID чата из URL
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.chat_group_name = f'chat_{self.chat_id}'
        
        if not self.user.is_authenticated:
            print("--- CONSUMER: User not authenticated, closing connection ---")
            await self.close(code=4003)
            return

        try:
            # Проверка доступа к чату
            chat_can_access = await get_chat_and_check_access(self.chat_id, self.user)
            
            if not chat_can_access:
                print("--- CONSUMER: Chat access denied or chat does not exist ---")
                await self.close(code=4003)
                return
                
            await self.accept() 
            print(f"--- CONSUMER: Accepted. Joining group: {self.chat_group_name} ---")

            await self.channel_layer.group_add(
                self.chat_group_name,
                self.channel_name
            )
            print(f"--- CONSUMER: Successfully added to group {self.chat_group_name} ---")
            
        except Exception as e:
            print(f"--- CONSUMER ERROR IN CONNECT: {e} ---")
            await self.close(code=4999)
    
    async def authenticate_via_token(self):
        """Аутентификация через JWT токен из query string"""
        try:
            query_string = self.scope.get('query_string', b'').decode('utf-8')
            params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            token = params.get('token')
            
            if token:
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                self.user = await self.get_user(user_id)
                print(f"--- CONSUMER: Authenticated user: {self.user} ---")
            else:
                self.user = AnonymousUser()
        except Exception as e:
            print(f"--- CONSUMER: Token authentication failed: {e} ---")
            self.user = AnonymousUser()
    
    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()
            
    async def disconnect(self, close_code):
        if hasattr(self, 'chat_group_name'):
            await self.channel_layer.group_discard(
                self.chat_group_name,
                self.channel_name
            )
        print(f"--- CONSUMER: Disconnected with code: {close_code} ---")
    
    # 3. Обновленный метод receive
    async def receive(self, text_data):
        """Обрабатывает сообщения от клиента: сохраняет в БД, затем рассылает."""
        if not self.user.is_authenticated:
            return 
            
        try:
            text_data_json = json.loads(text_data)
            message_text = text_data_json.get('text', '').strip()
            
            if not message_text:
                return
                
            print(f"--- CONSUMER: Attempting to save message from user {self.user.id}: {message_text} ---")
            
            # Главный шаг: Сохранение сообщения в MongoDB
            response_data = await save_message_and_get_data(
                chat_id=self.chat_id, 
                text=message_text, 
                user=self.user
            )
            
            if response_data:
                print(f"--- CONSUMER: Message saved. Sending to group... ---")
                
                # Отправляем сериализованные данные в группу
                await self.channel_layer.group_send(
                    self.chat_group_name,
                    {
                        'type': 'chat_message',
                        'message': response_data
                    }
                )
                
        except Exception as e:
            # Обязательно выводим ошибку, чтобы увидеть, что произошло
            print(f"--- CONSUMER FATAL ERROR IN RECEIVE (Saving failed): {e} ---")
    
    async def chat_message(self, event):
        """Обрабатывает сообщения из группы и отправляет клиенту"""
        message = event['message']
        # Отправляем сообщение обратно клиенту
        await self.send(text_data=json.dumps(message))
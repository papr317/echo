import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("--- CONSUMER: Attempting connection ---")
        
        # Получаем пользователя из scope
        self.user = self.scope.get("user", AnonymousUser())
        print(f"--- CONSUMER: User: {self.user}, Authenticated: {self.user.is_authenticated} ---")
        
        # Если пользователь не аутентифицирован, пробуем аутентифицировать через токен
        if not self.user.is_authenticated:
            await self.authenticate_via_token()
        
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.chat_group_name = f'chat_{self.chat_id}'
        
        if not self.user.is_authenticated:
            print("--- CONSUMER: User not authenticated, closing connection ---")
            await self.close(code=4003)
            return

        try:
            chat_exists = await self.check_chat_access(self.chat_id)
            if not chat_exists:
                print("--- CONSUMER: Chat access denied ---")
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
            print(f"--- CONSUMER ERROR IN CONNECT (Post-Accept): {e} ---")
            await self.close(code=4999)
    
    async def authenticate_via_token(self):
        """Аутентификация через JWT токен из query string"""
        try:
            # Получаем токен из query parameters
            query_string = self.scope.get('query_string', b'').decode('utf-8')
            print(f"--- CONSUMER: Query string: {query_string} ---")
            
            # Парсим query string
            params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            token = params.get('token')
            
            if token:
                print(f"--- CONSUMER: Found token: {token[:20]}... ---")
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                self.user = await self.get_user(user_id)
                print(f"--- CONSUMER: Authenticated user: {self.user} ---")
            else:
                print("--- CONSUMER: No token found ---")
                
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
    
    async def receive(self, text_data):
        """Обрабатывает сообщения от клиента"""
        try:
            text_data_json = json.loads(text_data)
            message_text = text_data_json.get('text', '').strip()
            
            if not message_text:
                return
                
            print(f"--- CONSUMER: Received message from user {self.user.id}: {message_text} ---")
            
            # Создаем объект сообщения
            message_data = {
                'text': message_text,
                'sender_id': self.user.id,
                'sender_username': self.user.username,
                'timestamp': str(timezone.now()),
                'type': 'chat_message'
            }
            
            # Отправляем сообщение в группу
            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'chat_message',
                    'message': message_data
                }
            )
            
        except json.JSONDecodeError:
            print("--- CONSUMER: Invalid JSON received ---")
        except Exception as e:
            print(f"--- CONSUMER ERROR IN RECEIVE: {e} ---")
    
    async def chat_message(self, event):
        """Обрабатывает сообщения из группы и отправляет клиенту"""
        message = event['message']
        print(f"--- CONSUMER: Sending message to client: {message} ---")
        
        # Отправляем сообщение обратно клиенту
        await self.send(text_data=json.dumps(message))
    
    async def check_chat_access(self, chat_id):
        # TODO: Реализуй реальную проверку доступа
        print(f"--- CONSUMER: Checking chat access for chat {chat_id} ---")
        return True
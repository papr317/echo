
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
# from .models import Chat
# Убедитесь, что .mongo_service.Message существует и MessageSerializer импортируется корректно
from .serializers import MessageSerializer 

class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        # Получаем данные пользователя из Channels Auth Middleware
        self.user = self.scope["user"] 
        if not self.user.is_authenticated:
            await self.close()
            return
            
        # Получаем ID чата из URL-маршрута
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        # Формируем уникальное имя для группы Redis (каждый чат - отдельная группа)
        self.chat_group_name = f'chat_{self.chat_id}'
        
        # 1. Проверка доступа к чату (синхронная операция с PostgreSQL)
        chat_exists = await self.check_chat_access(self.chat_id)
        if not chat_exists:
            await self.close()
            return

        # 2. Присоединение к группе канала Redis
        await self.channel_layer.group_add(
            self.chat_group_name,
            self.channel_name # Имя текущего WebSocket соединения
        )
        
        # 3. Принятие соединения
        await self.accept()

    async def disconnect(self, close_code):
        # Выход из группы Redis при отключении клиента
        await self.channel_layer.group_discard(
            self.chat_group_name,
            self.channel_name
        )

    # Прием сообщения от фронтенда (отправка сообщения в чат)
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_text = data.get('text')
            
            if not message_text:
                 return 
                 
        except json.JSONDecodeError:
            return

        # 1. Сохраняем сообщение в БД (MongoDB + обновление Chat в PostgreSQL)
        message_data = await self.save_message_and_update_chat(self.chat_id, self.user.id, message_text)
        
        if message_data:
            # 2. Отправка сообщения всем в группе через Redis
            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'chat_message',  # Указывает на метод-обработчик ниже
                    'message': message_data, # Сериализованные данные для отправки клиентам
                }
            )

    # Метод, который вызывается через group_send и отправляет данные в WebSocket
    async def chat_message(self, event):
        message = event['message']

        # Отправляем JSON-строку обратно клиенту
        await self.send(text_data=json.dumps(message))

    # --- Хелперы для безопасного доступа к синхронным БД (PostgreSQL/Mongo) ---
    
    @database_sync_to_async
    def check_chat_access(self, chat_id):
        """Проверяет, является ли пользователь участником чата."""
        # Chat - это модель в PostgreSQL
        from .models import Chat
        return Chat.objects.filter(participants=self.user, pk=chat_id).exists()

    @database_sync_to_async
    def save_message_and_update_chat(self, chat_id, sender_id, text):
        """Сохраняет сообщение, используя MessageSerializer."""
        data = {'text': text}
        # Передаем контекст, который MessageSerializer ожидает (chat_id и user)
        serializer = MessageSerializer(data=data, context={'chat_id': chat_id, 'request': {'user': self.user}})
        
        if serializer.is_valid():
            # Метод .save() в MessageSerializer должен содержать логику сохранения в MongoDB и обновления Chat
            return serializer.save() 
        
        return None
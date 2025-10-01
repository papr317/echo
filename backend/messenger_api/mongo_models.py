# mongo_models.py
from pymongo import MongoClient, ASCENDING, DESCENDING
from django.conf import settings
from datetime import datetime
import logging
from bson.objectid import ObjectId
from builtins import ConnectionError

logger = logging.getLogger(__name__)


class MongoConnection:
    """Управление подключением к MongoDB."""
    _client = None
    _collection = None
    
    @classmethod
    def get_collection(cls):
        """Ленивая инициализация: подключается при первом запросе."""
        if cls._collection is not None:
            return cls._collection

        mongo_config = settings.MONGODB_DATABASE
        
        try:
            # Парсинг настроек из settings.py (host, port, username, password, name)
            username = mongo_config.get('username') or None
            password = mongo_config.get('password') or None
            
            cls._client = MongoClient(
                host=mongo_config['host'], 
                port=mongo_config['port'], 
                username=username, 
                password=password,
                serverSelectionTimeoutMS=5000 
            )
            
            # Проверка соединения
            cls._client.admin.command('ping') 
            
            cls._db = cls._client[mongo_config['name']]
            cls._collection = cls._db['messages']
            
            # Создание индекса для быстрого поиска по чату и дате
            cls._collection.create_index([
                ('chat_id', ASCENDING), 
                ('timestamp', DESCENDING)
            ], background=True)
            
            return cls._collection
            
        except Exception as e:
            logger.error(f"Ошибка подключения к MongoDB: {e}")
            cls._collection = None
            # Выбрасываем Django-исключение, которое поймает View
            raise ConnectionError(f"Не удалось подключиться к MongoDB: {e}") 

class MongoMessage: 
    """Класс-структура для работы с сообщениями в коллекции MongoDB."""
    def __init__(self, chat_id, sender_id, text, attachments=None, timestamp=None):
        # Преобразуем Integer ID чата в строку для хранения в MongoDB
        self.chat_id = str(chat_id) 
        self.sender_id = sender_id
        self.text = text
        self.attachments = attachments if attachments is not None else []
        self.timestamp = timestamp if timestamp is not None else datetime.utcnow()
        
    def save(self):
        """Сохраняет сообщение и обновляет модель Chat в PostgreSQL."""
        messages_collection = MongoConnection.get_collection()
        
        data = {
            'chat_id': self.chat_id,
            'sender_id': self.sender_id,
            'text': self.text,
            'attachments': self.attachments,
            'timestamp': self.timestamp,
        }
        
        result = messages_collection.insert_one(data)
        return str(result.inserted_id) 

    @staticmethod
    def get_messages_for_chat(chat_id, limit=50, before_id=None):
        """Получает сообщения для данного чата с пагинацией."""
        try:
            messages_collection = MongoConnection.get_collection()
        except ConnectionError:
            return []

        # chat_id - это строка, т.к. в Mongo он так хранится
        query = {'chat_id': str(chat_id)} 
        
        # Логика пагинации: ищем сообщения, созданные "до" (less than - $lt) данного ID
        if before_id:
            try:
                query['_id'] = {'$lt': ObjectId(before_id)}
            except Exception:
                pass
                
        cursor = messages_collection.find(query).sort('timestamp', DESCENDING).limit(limit)
        
        messages_list = list(cursor)
        
        # Форматируем ObjectId в строку 'id' для удобства DRF
        for msg in messages_list:
             msg['id'] = str(msg.pop('_id'))
             
        return messages_list
# messenger_api/mongo_service.py
from pymongo import MongoClient, ASCENDING, DESCENDING
from django.conf import settings
from datetime import datetime
import logging
from bson.objectid import ObjectId

logger = logging.getLogger(__name__)


class MongoConnection:
    """Класс для управления подключением и коллекцией MongoDB."""
    _client = None
    _db = None
    _collection = None
    
    @classmethod
    def get_collection(cls):
        """
        Ленивая инициализация: подключается только при первом вызове.
        Возвращает объект коллекции 'messages'.
        """
        if cls._collection is not None:
            return cls._collection

        mongo_config = settings.MONGODB_DATABASE
        
        try:
            cls._client = MongoClient(
                host=mongo_config['host'], 
                port=mongo_config['port'], 
                username=mongo_config['username'] or None, 
                password=mongo_config['password'] or None,
                serverSelectionTimeoutMS=5000 
            )
            
            cls._client.admin.command('ping') 
            
            cls._db = cls._client[mongo_config['name']]
            cls._collection = cls._db['messages']
            
            cls._collection.create_index([
                ('chat_id', ASCENDING), 
                ('timestamp', DESCENDING)
            ], background=True)
            
            logger.info("Успешное подключение к MongoDB.")
            return cls._collection
            
        except Exception as e:
            logger.error(f"Ошибка подключения к MongoDB ({mongo_config['name']}): {e}")
            cls._collection = None # Устанавливаем в None на случай ошибки
            return None


class Message:
    """
    Класс-структура для работы с сообщениями в коллекции MongoDB.
    """
    def __init__(self, chat_id, sender_id, text, attachments=None, timestamp=None):
        self.chat_id = chat_id 
        self.sender_id = sender_id
        self.text = text
        self.attachments = attachments if attachments is not None else []
        self.timestamp = timestamp if timestamp is not None else datetime.utcnow()
        
    def save(self):
        """Сохраняет сообщение в коллекцию 'messages'."""
        messages_collection = MongoConnection.get_collection()
        if messages_collection is None:
            # Возвращаем None или вызываем исключение, если подключение не удалось
            raise ConnectionError("Не удалось подключиться к MongoDB.") 

        data = {
            'chat_id': self.chat_id,
            'sender_id': self.sender_id,
            'text': self.text,
            'attachments': self.attachments,
            'timestamp': self.timestamp,
        }
        
        result = messages_collection.insert_one(data)
        # Возвращаем строковое представление ID документа MongoDB
        return str(result.inserted_id) 

    @staticmethod
    def get_messages_for_chat(chat_id, limit=50, before_id=None):
        """
        Получает сообщения для данного чата.
        :param chat_id: ID чата из PostgreSQL.
        :param limit: Максимальное количество сообщений.
        :param before_id: ID сообщения MongoDB, с которого начать (для пагинации).
        """
        messages_collection = MongoConnection.get_collection()
        if messages_collection is None:
            return []

        query = {'chat_id': chat_id}
        
        # Добавляем логику пагинации: получить сообщения, созданные до определенного ID
        if before_id:
            try:
                # В MongoDB ObjectId - это уникальный ID документа
                query['_id'] = {'$lt': ObjectId(before_id)}
            except:
                logger.warning(f"Неверный формат ObjectId: {before_id}")
                pass
                
        # Сортировка по времени (DESCENDING = -1, самые новые сверху)
        cursor = messages_collection.find(query).sort('timestamp', DESCENDING).limit(limit)
        
        # Преобразование Cursor в список Python
        messages_list = list(cursor)
        
        # Добавляем 'id' в виде строки для удобства DRF
        for msg in messages_list:
             msg['id'] = str(msg.pop('_id'))
             
        return messages_list
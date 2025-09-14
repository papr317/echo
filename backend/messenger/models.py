from mongoengine import Document, fields
from datetime import datetime

class Dialog(Document):
    user1_id = fields.IntField(required=True)
    user2_id = fields.IntField(required=True)
    created_at = fields.DateTimeField(default=datetime.now)
    updated_at = fields.DateTimeField(default=datetime.now)
    
    meta = {
        'collection': 'dialogs',
        'indexes': [
            ('user1_id', 'user2_id'),
            'updated_at'
        ]
    }

class Message(Document):
    dialog_id = fields.StringField(required=True)
    sender_id = fields.IntField(required=True)
    receiver_id = fields.IntField(required=True)
    text = fields.StringField(required=True, max_length=1000)
    timestamp = fields.DateTimeField(default=datetime.now)
    is_read = fields.BooleanField(default=False)
    
    meta = {
        'collection': 'messages',
        'indexes': [
            'dialog_id',
            'timestamp',
            ('dialog_id', 'timestamp'),
            ('sender_id', 'timestamp')
        ]
    }
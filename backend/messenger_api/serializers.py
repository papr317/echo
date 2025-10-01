# backend/messenger_api/serializers.py
from rest_framework import serializers
from django.db.models import Count, Max
from django.conf import settings
from datetime import datetime

from .models import Chat 
# -------------------------

from .mongo_models import Message as MongoMessage
from backend.users_api.serializers import UserSerializer

# --- ChatSerializer (Оставлен для полноты, без изменений) ---

class ChatSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Chat (PostgreSQL).
    Используется для отображения списка чатов и создания новых.
    """
    participants = UserSerializer(many=True, read_only=True)
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=True,
        min_length=1
    )
    partner_id = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    participants_count = serializers.SerializerMethodField()

    class Meta:
        model = Chat 
        fields = (
            'id', 'is_group', 'name', 'avatar', 'owner',
            'last_message_text', 'last_message_date',
            'participants', 'participant_ids',
            'partner_id', 'display_name', 'participants_count', 
            'created_at',
        )
        read_only_fields = ('owner',) 
        
    def get_participants_count(self, obj):
        return obj.participants.count()

    def get_partner_id(self, obj):
        if obj.is_group or obj.participants.count() != 2:
            return None
        
        current_user = self.context['request'].user
        partner = obj.participants.exclude(id=current_user.id).first()
        return partner.id if partner else None

    def get_display_name(self, obj):
        if obj.is_group and obj.name:
            return obj.name
            
        partner_id = self.get_partner_id(obj)
        if partner_id:
            return f"Диалог с пользователем {partner_id}"
            
        return f"Чат ID {obj.id}"
        
    
    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids')
        current_user = self.context['request'].user
        
        user_ids = list(set(participant_ids + [current_user.id]))
        is_group = len(user_ids) > 2
        
        if not is_group and len(user_ids) == 2:
            existing_chat = Chat.objects.annotate(
                num_participants=Count('participants')
            ).filter(
                is_group=False,
                num_participants=2,
                participants__id__in=user_ids
            ).distinct().first()
            
            if existing_chat:
                return existing_chat
        
        chat = Chat.objects.create(
            is_group=is_group,
            name=validated_data.get('name') if is_group else None,
            owner=current_user if is_group else None, 
            **validated_data
        )
        chat.participants.set(user_ids)
        return chat

# --- MessageSerializer (Здесь были изменения) ---

class MessageSerializer(serializers.Serializer):
    """
    Сериализатор для документов сообщений MongoDB.
    """
    id = serializers.CharField(read_only=True) 
    chat_id = serializers.IntegerField(read_only=True) 
    sender_id = serializers.IntegerField(read_only=True)
    timestamp = serializers.DateTimeField(read_only=True)
    
    text = serializers.CharField(max_length=5000)
    attachments = serializers.ListField(
        child=serializers.CharField(), 
        required=False, 
        default=list
    )
    
    # ----------------------------------------------------
    # Здесь должен быть метод to_representation для встраивания данных о пользователе
    # ----------------------------------------------------

    def create(self, validated_data):
        """
        Сохраняет новое сообщение в MongoDB.
        """
        chat_id = self.context.get('chat_id')
        if not chat_id:
            raise serializers.ValidationError({"detail": "Chat ID не предоставлен в контексте."})
            
        sender_id = self.context['request'].user.id
        
        message_instance = MongoMessage(
            chat_id=chat_id,
            sender_id=sender_id,
            text=validated_data['text'],
            attachments=validated_data.get('attachments'),
        )
        
        # Сохраняем в MongoDB 
        try:
            message_id = message_instance.save()
        except ConnectionError as e:
            raise serializers.ValidationError({"detail": str(e)})

        # Обновляем информацию о последнем сообщении в модели Chat (PostgreSQL)
        # !!! ИСПРАВЛЕНО: Chat теперь импортирован !!!
        Chat.objects.filter(pk=chat_id).update(
            last_message_text=validated_data['text'][:255],
            last_message_date=message_instance.timestamp
        )

        # Возвращаем полный объект для ответа клиенту
        return {
            'id': message_id,
            'chat_id': chat_id,
            'sender_id': sender_id,
            **validated_data, 
            'timestamp': message_instance.timestamp
        }
from rest_framework import serializers
from builtins import ConnectionError # Используем стандартное исключение
from datetime import datetime

from backend.config.jwt_auth_middleware import User
from backend.echo_api import models
from backend.users_api.serializers import UserSerializer 
from backend.users_api.models import CustomUser 

from .models import Chat, Friendship
from .mongo_models import MongoMessage 

# Кэш для избежания N+1 проблемы при загрузке истории сообщений
USER_CACHE = {} 


class FriendshipSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Friendship."""
    
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    
    receiver_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Friendship
        fields = ('id', 'sender', 'receiver', 'receiver_id', 'status', 'created_at')
        read_only_fields = ('sender', 'status', 'created_at')
        
    def validate(self, data):
        receiver_id = data.get('receiver_id')
        user = self.context['request'].user
        
        # 1. Проверка на отправку самому себе
        if receiver_id == user.id:
            raise serializers.ValidationError("Вы не можете отправить запрос на дружбу самому себе.")

        # 2. Проверка, существует ли пользователь-получатель
        try:
            receiver = User.objects.get(pk=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError("Пользователь, которому вы пытаетесь отправить запрос, не существует.")
        
        # 3. Проверка, существует ли уже запрос (в любом направлении)
        # Это предотвратит дублирование и обратные запросы, если статус уже 'accepted'
        exists = Friendship.objects.filter(
            models.Q(sender=user, receiver=receiver) | models.Q(sender=receiver, receiver=user)
        ).exclude(status__in=['rejected', 'blocked']).exists()
        
        if exists:
            raise serializers.ValidationError("Запрос на дружбу с этим пользователем уже существует или уже принят.")

        data['receiver'] = receiver
        return data

    def create(self, validated_data):
        # sender берется из request, receiver установлен в validate
        receiver = validated_data.pop('receiver')
        sender = self.context['request'].user
        
        return Friendship.objects.create(sender=sender, receiver=receiver, status='pending')

class ChatSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Chat."""
    participants = UserSerializer(many=True, read_only=True)
    participant_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=True, min_length=1)
    partner_id = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat 
        fields = ('id', 'is_group', 'name', 'avatar', 'owner',
                  'last_message_text', 'last_message_date',
                  'participants', 'participant_ids',
                  'partner_id', 'display_name', 'created_at',)
        read_only_fields = ('owner',) 
        
    def get_partner_id(self, obj):
        # Логика для личных чатов
        if obj.is_group or obj.participants.count() != 2: return None
        current_user = self.context['request'].user
        partner = obj.participants.exclude(id=current_user.id).first()
        return partner.id if partner else None

    def get_display_name(self, obj):
        # Отображаемое имя
        if obj.is_group and obj.name: return obj.name
        partner_id = self.get_partner_id(obj)
        if partner_id:
            partner_username = CustomUser.objects.filter(id=partner_id).values_list('username', flat=True).first()
            return f"Диалог с {partner_username}"
        return f"Чат ID {obj.id}"
        
    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids')
        current_user = self.context['request'].user
        user_ids = list(set(participant_ids + [current_user.id]))
        is_group = len(user_ids) > 2
        
        chat = Chat.objects.create(
            is_group=is_group,
            name=validated_data.get('name') if is_group else None,
            owner=current_user if is_group else None, 
            **validated_data
        )
        chat.participants.set(user_ids)
        if is_group: chat.administrators.add(current_user)
        return chat

class MessageSerializer(serializers.Serializer):
    """Сериализатор для документов сообщений MongoDB."""
    id = serializers.CharField(read_only=True) # ID MongoDB
    chat_id = serializers.IntegerField(read_only=True) # Integer ID чата (PostgreSQL)
    sender_id = serializers.IntegerField(read_only=True)
    timestamp = serializers.DateTimeField(read_only=True)
    text = serializers.CharField(max_length=5000)
    attachments = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    
    # Поле для встраивания данных отправителя
    sender = serializers.SerializerMethodField()
    
    def get_sender(self, obj):
        """Получает данные отправителя, используя кэш."""
        sender_id = obj['sender_id'] 
        if sender_id in USER_CACHE: return USER_CACHE[sender_id]
        
        try:
            # Оптимизация: получаем только нужные поля из PostgreSQL
            user = CustomUser.objects.only('id', 'username', 'avatar').get(id=sender_id)
            user_data = UserSerializer(user).data
            USER_CACHE[sender_id] = user_data
            return user_data
        except CustomUser.DoesNotExist:
            return {'id': sender_id, 'username': 'Deleted User', 'avatar': None}

    def to_representation(self, instance):
        # Преобразуем chat_id из строки (как в Mongo) обратно в Integer
        instance['chat_id'] = int(instance['chat_id'])
        data = super().to_representation(instance)
        # Вставляем данные отправителя
        data['sender'] = self.get_sender(instance) 
        return data

    def create(self, validated_data):
        chat_id = self.context.get('chat_id')
        sender_id = self.context['request'].user.id
        
        # 1. Сохранение в MongoDB
        message_instance = MongoMessage(chat_id=chat_id, sender_id=sender_id, text=validated_data['text'], attachments=validated_data.get('attachments'))
        
        try:
            message_id = message_instance.save()
            timestamp = message_instance.timestamp
        except ConnectionError as e:
            raise serializers.ValidationError({"detail": str(e)}, code='service_unavailable')

        # 2. Обновление PostgreSQL (синхронизация данных)
        Chat.objects.filter(pk=chat_id).update(last_message_text=validated_data['text'][:255], last_message_date=timestamp)

        # 3. Возврат данных нового сообщения
        return {'id': message_id, 'chat_id': chat_id, 'sender_id': sender_id, **validated_data, 'timestamp': timestamp}
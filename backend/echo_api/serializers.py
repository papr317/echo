# echo_api/serializers.py

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Post, Comment, Echo
# Предполагаем, что users_api.serializers.UserSerializer корректно работает
from users_api.serializers import UserSerializer 


# --- Сериализатор для отображения объекта (Post или Comment) внутри Echo ---
class ContentObjectSerializer(serializers.Serializer):
    """
    Вспомогательный сериализатор для отображения данных объекта, который был оценен.
    """
    id = serializers.IntegerField()
    content = serializers.CharField(required=False, max_length=500)
    text = serializers.CharField(required=False, max_length=300)
    
    def to_representation(self, instance):
        # Этот метод вызывается для самого content_object (Post или Comment)
        if isinstance(instance, Post):
            return {
                'id': instance.id,
                'type': 'post',
                'content': instance.content[:50] + '...', # Показываем часть контента
            }
        elif isinstance(instance, Comment):
            return {
                'id': instance.id,
                'type': 'comment',
                'text': instance.text[:50] + '...', # Показываем часть комментария
            }
        return super().to_representation(instance)


# --- 1. Сериализатор Комментария ---
class CommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    # Поле is_expired берется из метода модели
    is_expired = serializers.ReadOnlyField() 
    
    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_details', 'text', 
                  'created_at', 'expires_at', 'is_expired', 
                  'echo_count', 'disecho_count', 'is_floating'] # <-- Добавлены счетчики и is_floating
        read_only_fields = ['author', 'created_at', 'expires_at', 
                            'echo_count', 'disecho_count', 'is_floating']

# --- 2. Сериализатор Поста ---
class PostSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    is_expired = serializers.ReadOnlyField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'author', 'author_details', 'content', 'image', 
                  'created_at', 'expires_at', 'is_expired', 
                  'echo_count', 'disecho_count', 'comments_count', 'is_floating']
        read_only_fields = ['author', 'created_at', 'expires_at', 
                            'echo_count', 'disecho_count', 'is_floating']
    
    def get_comments_count(self, obj):
        # Считаем только живые, прикрепленные комментарии
        return obj.comments.filter(is_floating=False).count()
        
# --- 3. Сериализатор Оценки (Echo/DisEcho) ---
class EchoSerializer(serializers.ModelSerializer):
    # Сериализатор ТОЛЬКО ДЛЯ ЧТЕНИЯ (для /my/echos/)
    user_details = UserSerializer(source='user', read_only=True)
    
    # Используем GenericForeignKey для отображения объекта, которому поставлена оценка
    content_object_details = ContentObjectSerializer(source='content_object', read_only=True)
    
    # Поле, показывающее тип объекта (Post или Comment)
    content_type_model = serializers.SerializerMethodField()

    class Meta:
        model = Echo
        # Убираем content_object_id и content_type_model из fields для записи,
        # оставляем только для отображения
        fields = ['id', 'user', 'user_details', 'is_echo', 'created_at', 
                  'content_object_details', 'content_type_model']
        read_only_fields = fields # Все поля только для чтения!

    def get_content_type_model(self, obj):
        return obj.content_type.model
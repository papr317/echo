from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Post, Comment, Echo
from users_api.serializers import UserSerializer 

class ContentObjectSerializer(serializers.Serializer):
    """
    Вспомогательный сериализатор для отображения данных объекта, который был оценен.
    """
    id = serializers.IntegerField()
    content = serializers.CharField(required=False, max_length=500)
    text = serializers.CharField(required=False, max_length=300)
    
    def to_representation(self, instance):
        if isinstance(instance, Post):
            return {
                'id': instance.id,
                'type': 'post',
                'content': instance.content[:50] + '...',
            }
        elif isinstance(instance, Comment):
            return {
                'id': instance.id,
                'type': 'comment',
                # При условии, что поле в модели Comment называется 'text'
                'content': instance.text[:50] + '...', 
            }
        return super().to_representation(instance)


# --- 1. Сериализатор Комментария (ИСПРАВЛЕНО) ---
class CommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    is_expired = serializers.ReadOnlyField() 
    content = serializers.CharField(source='text') 
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author_details', 
                  'created_at', 'expires_at', 'is_expired', 
                  'echo_count', 'disecho_count', 'is_floating', 'post', 'author'] 
        read_only_fields = ['author', 'post', 'created_at', 'expires_at', 
                            'echo_count', 'disecho_count', 'is_floating']
        

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
        
class EchoSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    content_object_details = ContentObjectSerializer(source='content_object', read_only=True)
    
    content_type_model = serializers.SerializerMethodField()

    class Meta:
        model = Echo
        fields = ['id', 'user', 'user_details', 'is_echo', 'created_at', 
                  'content_object_details', 'content_type_model']
        read_only_fields = fields 

    def get_content_type_model(self, obj):
        return obj.content_type.model
# echo_api/serializers.py

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Post, Comment, Echo
# Убедитесь, что users_api.serializers.UserSerializer доступен
from users_api.serializers import UserSerializer 


# --- Вспомогательные Сериализаторы ---

# 1. Сериализатор для отображения объекта Echo (ваш код)
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

# 2. Сериализатор для отображения родительского комментария
class ParentCommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    # Используем 'content' как псевдоним для 'text'
    content = serializers.CharField(source='text', read_only=True)
    
    class Meta:
        model = Comment
        fields = ('id', 'author_details', 'content')
        read_only_fields = fields


# --- Основные Сериализаторы ---

# 1. Сериализатор Комментария (ФИНАЛЬНЫЙ С ИЕРАРХИЕЙ)
class CommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    is_expired = serializers.ReadOnlyField() 
    # ВАШ ПСЕВДОНИМ: 'content' будет использоваться для отображения/записи 'text'
    content = serializers.CharField(source='text') 
    
    # !!! НОВОЕ: Для чтения информации о родительском комментарии
    parent_comment_details = ParentCommentSerializer(source='parent_comment', read_only=True)
    # !!! НОВОЕ: Для записи ID родительского комментария
    parent_comment_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)


    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'author_details', 
            'created_at', 'expires_at', 'is_expired', 
            'echo_count', 'disecho_count', 'is_floating', 'post', 'author',
            'parent_comment_details', 'parent_comment_id' # Добавлены поля иерархии
        ] 
        read_only_fields = [
            'author', 'post', 'created_at', 'expires_at', 
            'echo_count', 'disecho_count', 'is_floating', 'author_details', 
            'is_expired', 'parent_comment_details'
        ]
        extra_kwargs = {
            'post': {'required': False, 'allow_null': True}, # Post может быть null
            # 'text' исключен, т.к. используется 'content'
            'text': {'write_only': True}, 
        }
        
    def create(self, validated_data):
        # DRF автоматически использует 'text' для создания, благодаря source='text' в 'content'
        
        # Получаем и удаляем parent_comment_id, чтобы не мешал созданию Comment
        parent_comment_id = validated_data.pop('parent_comment_id', None)
        
        # parent_comment_id должен обрабатываться во views.py, чтобы найти объект и связать его.
        # Однако, если вы хотите создать/связать его здесь, вам понадобится `post_id`
        # В нашей текущей структуре логика создания `parent_comment` происходит в `CommentListView.perform_create`.
        
        # Поэтому мы просто убираем его и позволяем views.py его установить.
        # Если views.py не установлен, это поле будет проигнорировано (т.к. оно write_only).
        
        return super().create(validated_data)


# 2. Сериализатор Поста
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
                            'echo_count', 'disecho_count', 'is_floating', 'is_expired']
    
    def get_comments_count(self, obj):
        # Считаем только живые, прикрепленные комментарии
        return obj.comments.filter(is_floating=False).count()
        
# 3. Сериализатор Echo
class EchoSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    # Используем ваш ContentObjectSerializer для отображения деталей объекта
    content_object_details = ContentObjectSerializer(source='content_object', read_only=True)
    
    content_type_model = serializers.SerializerMethodField()

    class Meta:
        model = Echo
        fields = ['id', 'user', 'user_details', 'is_echo', 'created_at', 
                  'content_object_details', 'content_type_model']
        read_only_fields = fields 

    def get_content_type_model(self, obj):
        return obj.content_type.model
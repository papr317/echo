from rest_framework import serializers
from .models import Post, Echo, Friendship
from users_api.serializers import UserSerializer  # Импортируем сериализатор пользователя

class PostSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    echoes_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'author', 'author_details', 'content', 'image', 
                 'created_at', 'expires_at', 'is_expired', 'echoes_count']
        read_only_fields = ['author', 'created_at', 'expires_at']

class EchoSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    post_details = PostSerializer(source='post', read_only=True)
    
    class Meta:
        model = Echo
        fields = ['id', 'post', 'post_details', 'user', 'user_details', 'timestamp']
        read_only_fields = ['user', 'timestamp']

class FriendshipSerializer(serializers.ModelSerializer):
    from_user_details = UserSerializer(source='from_user', read_only=True)
    to_user_details = UserSerializer(source='to_user', read_only=True)
    
    class Meta:
        model = Friendship
        fields = ['id', 'from_user', 'from_user_details', 'to_user', 
                 'to_user_details', 'status', 'created_at']
        read_only_fields = ['from_user']
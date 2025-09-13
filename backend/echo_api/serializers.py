from rest_framework import serializers
from .models import Post, Comment
from users_api.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_details', 'text', 
                 'created_at', 'expires_at', 'is_expired']
        read_only_fields = ['author', 'created_at', 'expires_at']

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
        return obj.comments.count()
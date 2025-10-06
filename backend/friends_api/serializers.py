from rest_framework import serializers
from .models import Friend

class FriendSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = Friend
        fields = [
            'id', 'sender', 'sender_username', 'receiver', 'receiver_username',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'sender_username', 'receiver_username', 'status', 'created_at', 'updated_at']
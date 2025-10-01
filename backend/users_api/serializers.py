from rest_framework import serializers
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser 
        fields = (
            'username', 'password', 'email', 'phone',
            'first_name', 'last_name', 'gender',
            'date_of_birth', 'nickname', 'avatar','bio',
            'accepted_privacy_policy'
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'accepted_privacy_policy': {'required': True},  
        }

    def create(self, validated_data):
      # from .models import CustomUser
      
      password = validated_data.pop('password', None)
      user = CustomUser(**validated_data)
      if password:          user.set_password(password)
      user.save()
      return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'phone',
            'first_name', 'last_name', 'gender',
            'date_of_birth', 'nickname', 'avatar',
            'accepted_privacy_policy'
        )

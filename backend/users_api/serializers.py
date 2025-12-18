from rest_framework import serializers
from .models import CustomUser
from datetime import date
from django.contrib.auth.password_validation import validate_password 

def validate_min_age(value):
    if value:
        today = date.today()
        age = today.year - value.year - (
            (today.month, today.day) < (value.month, value.day)
        )
        if age < 8:
            raise serializers.ValidationError('Вам должно быть не менее 8 лет.')
    return value

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password] 
    )

    class Meta:
        model = CustomUser 
        fields = (
            'username', 'password', 'email', 'phone',
            'first_name', 'last_name', 'gender',
            'date_of_birth', 'nickname', 'avatar','bio',
            'accepted_privacy_policy'
        )
        extra_kwargs = {
            'accepted_privacy_policy': {'required': True},
            # Пароль убран отсюда, так как объявлен явно
        }
        
    # Валидация даты рождения (используем общую функцию)
    def validate_date_of_birth(self, value):
        return validate_min_age(value)
    
    def create(self, validated_data):
      password = validated_data.pop('password') 
      user = CustomUser.objects.create_user(password=password, **validated_data)
      return user


class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'phone',
            'first_name', 'last_name', 'gender',
            'date_of_birth', 'nickname', 'avatar',
            'accepted_privacy_policy', 'bio'
        )

    def get_avatar(self, obj):
        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    # Валидация даты рождения (нужна при PUT/обновлении профиля)
    def validate_date_of_birth(self, value):
        return validate_min_age(value)
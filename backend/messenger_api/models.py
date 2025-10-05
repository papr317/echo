# backend/messenger_api/models.py
from django.utils import timezone
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

from backend.config.jwt_auth_middleware import User



class Friendship(models.Model):
    """
    Модель для отслеживания запросов на дружбу и статуса.
    """
    STATUS_CHOICES = (
        ('pending', 'Ожидает подтверждения'),
        ('accepted', 'Подтверждено'),
        ('rejected', 'Отклонено'),
        ('blocked', 'Заблокировано'),
    )
    
    # Отправитель запроса
    sender = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='sent_friend_requests',
        verbose_name="Отправитель"
    )
    
    # Получатель запроса
    receiver = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='received_friend_requests',
        verbose_name="Получатель"
    )
    
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name="Статус"
    )
    
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Создано")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлено")

    class Meta:
        # Убеждаемся, что запрос от А к Б может быть только один
        unique_together = ('sender', 'receiver')
        verbose_name = "Дружба"
        verbose_name_plural = "Дружбы"
        
    def __str__(self):
        return f"Запрос: {self.sender.username} -> {self.receiver.username} ({self.status})"
class Chat(models.Model):
    """
    Основная модель Чата. Использует Integer PK, соответствующий CustomUser.
    """    
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='chats', 
        verbose_name=_('Участники')
    )
    
    is_group = models.BooleanField(
        default=False, 
        verbose_name=_('Групповой чат')
    )
    
    name = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name=_('Имя чата/Группы')
    )

    last_message_text = models.CharField(
        max_length=255, 
        blank=True, 
        verbose_name=_('Текст последнего сообщения')
    )
    last_message_date = models.DateTimeField(
        auto_now_add=True, 
        verbose_name=_('Дата последнего сообщения')
    )

    created_at = models.DateTimeField(auto_now_add=True)
    
    avatar = models.ImageField(
        upload_to='chat_avatars/', 
        blank=True, 
        null=True, 
        verbose_name=_('Аватар чата/группы')
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='owned_chats',
        verbose_name=_('Владелец/Админ')
    )

    administrators = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='admin_chats', 
        blank=True,
        verbose_name=_('Администраторы')
    )

    class Meta:
        app_label = 'messenger_api' 
        verbose_name = _('Чат')
        verbose_name_plural = _('Чаты')
        indexes = [
            models.Index(fields=['last_message_date']),
        ]
        
    def __str__(self):
        return self.name if self.name else f"Чат ID {self.pk}"

    def is_owner(self, user):
        return self.owner == user

    def is_admin(self, user):
        return self.is_owner(user) or self.administrators.filter(pk=user.pk).exists()
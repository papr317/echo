# backend/messenger_api/models.py
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
# import uuid - удален, т.к. PK будет IntegerField

class Chat(models.Model):
    """
    Основная модель Чата. Использует Integer PK, соответствующий CustomUser.
    """
    # ID чата (pk) является стандартным IntegerField, унаследованным от models.Model.
    
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
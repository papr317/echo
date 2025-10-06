from django.utils import timezone
from django.db import models

from backend.config.jwt_auth_middleware import User


class Friend(models.Model):
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


from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class CustomUser(AbstractUser):
    phone = models.CharField(max_length=15, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    
    first_name = models.CharField(max_length=30, blank=True, null=True)
    last_name = models.CharField(max_length=30, blank=True, null=True)
    
    GENDER_CHOICES = [
        ('male', 'Мальчик'),
        ('female', 'Девочка'),
    ]
    gender = models.CharField(max_length=6, choices=GENDER_CHOICES, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    nickname = models.CharField(max_length=30, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    bio = models.TextField(blank=True, null=True)

    accepted_privacy_policy = models.BooleanField(default=False) # political correctness
    
    def __str__(self):
            return self.username
    
class NicknameDataset(models.Model):
    """
    Модель для хранения датасета никнеймов для обучения RNN.
    
    Поля:
    - id: первичный ключ (явно)
    - nickname: сам никнейм (уникальный)
    - language_type: тип языка (русский/английский/смешанный/китайский)
    - is_toxic: метка токсичности (1 - токсичный, 0 - нет)
    - created_at: дата добавления записи
    """
    
    LANGUAGE_CHOICES = [
        ('ru', 'Русский'),
        ('en', 'Английский'),
        ('cn', 'Китайский'),
        ('mixed', 'Смешанный'),
    ]
    
    id = models.BigAutoField(
        primary_key=True,
        verbose_name='ID',
        help_text='Уникальный идентификатор записи'
    )
    
    nickname = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Никнейм',
        help_text='Уникальный никнейм для анализа'
    )
    language_type = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default='mixed',
        verbose_name='Тип языка',
        help_text='Язык, преобладающий в никнейме'
    )
    is_toxic = models.BooleanField(
        default=False,
        verbose_name='Токсичный',
        help_text='1 - токсичный никнейм, 0 - нетоксичный'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата добавления'
    )
    
    class Meta:
        verbose_name = 'Никнейм (датасет RNN)'
        verbose_name_plural = 'Никнеймы (датасет RNN)'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['id'], name='idx_id'),  # Явный индекс по id
            models.Index(fields=['nickname'], name='idx_nickname'),
            models.Index(fields=['is_toxic'], name='idx_is_toxic'),
            models.Index(fields=['language_type'], name='idx_language_type'),
            models.Index(fields=['created_at'], name='idx_created_at'),
        ]
    
    def __str__(self):
        toxic_status = "Токсичный" if self.is_toxic else "Нетоксичный"
        return f"{self.nickname} ({self.get_language_type_display()}) - {toxic_status}"
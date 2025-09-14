from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class Post(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField(max_length=500)
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    echo_count = models.IntegerField(default=0)    # лайки
    disecho_count = models.IntegerField(default=0) # дизлайк
    is_floating = models.BooleanField(default=False)  # для плавучих комментов

    def save(self, *args, **kwargs):
        if not self.id:  # Только при создании
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def add_echo(self):
        """Лайк - продлеваем жизнь на 1 час"""
        self.echo_count += 1
        self.expires_at += timedelta(hours=1)
        self.save()

    def add_disecho(self):
        """Дизлайк - сокращаем жизнь на 2 часа"""
        self.disecho_count += 1
        self.expires_at -= timedelta(hours=2)
        self.save()

    def is_expired(self):
        return timezone.now() > self.expires_at

    def make_floating(self):
        """Сделать пост плавучим (для комментариев)"""
        self.is_floating = True
        self.content = f"💬 Плавучий комментарий: {self.content}"
        self.save()

    def __str__(self):
        return f"{self.author.username}: {self.content[:20]}..."

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(max_length=300)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.id:  # Только при создании
            self.expires_at = timezone.now() + timedelta(hours=240)  # 10 дней
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.author.username}: {self.text[:20]}..."
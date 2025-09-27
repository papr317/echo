# echo_api/models.py
from django.db import models
from django.conf import settings 
from django.utils import timezone
from datetime import timedelta
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import transaction # Нужен для метода kill_and_float_comments

# --- Модель поста ---
class Post(models.Model):
    # ... (все поля, как у вас) ...
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField(max_length=500)
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField() 
    echo_count = models.IntegerField(default=0)      
    disecho_count = models.IntegerField(default=0)
    is_floating = models.BooleanField(default=False) 

    def save(self, *args, **kwargs):
        if not self.id: 
            initial_lifetime = timedelta(hours=settings.POST_LIFETIME_HOURS)
            self.expires_at = timezone.now() + initial_lifetime
        super().save(*args, **kwargs)

    def add_echo(self):
        self.echo_count += 1
        self.expires_at += timedelta(hours=settings.ECHO_EXTEND_HOURS) 

    def add_disecho(self):
        self.disecho_count += 1
        self.expires_at -= timedelta(hours=settings.DISECHO_REDUCE_HOURS) 

    def is_expired(self):
        return timezone.now() > self.expires_at

    def kill_and_float_comments(self):
        """Убивает пост, открепляет его комментарии и удаляет сам пост."""
        
        comments_count = self.comments.count()
        
        # Спасаем все комментарии
        for comment in self.comments.all():
            comment.make_floating() 
            
        # Удаляем сам пост
        self.delete() 
            
        return comments_count

    def __str__(self):
        return f"{self.author.username}: {self.content[:20]}..."

# --- Модель комментария ---
class Comment(models.Model):
    # !!! ИЗМЕНЕНИЕ: post теперь может быть NULL
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments', 
                             null=True, blank=True) 
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(max_length=300)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    echo_count = models.IntegerField(default=0)      
    disecho_count = models.IntegerField(default=0)
    
    # !!! ИЗМЕНЕНИЕ: Новое поле
    is_floating = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.id: 
            initial_lifetime = timedelta(hours=settings.COMMENT_LIFETIME_HOURS)
            self.expires_at = timezone.now() + initial_lifetime
        super().save(*args, **kwargs)

    def add_echo(self):
        self.echo_count += 1
        self.expires_at += timedelta(hours=settings.ECHO_EXTEND_HOURS) 

    def add_disecho(self):
        self.disecho_count += 1
        self.expires_at -= timedelta(hours=settings.DISECHO_REDUCE_HOURS) 

    def is_expired(self):
        return timezone.now() > self.expires_at

    def make_floating(self):
        """Открепляет комментарий от поста и помечает его как плавучий."""
        self.is_floating = True
        self.post = None # Открепляем от поста
        self.save(update_fields=['is_floating', 'post']) 

    def __str__(self):
        return f"{self.author.username}: {self.text[:20]}..."

# Оценка (Echo/DisEcho)
class Echo(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='echos'
    )
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    is_echo = models.BooleanField(default=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'content_type', 'object_id')
        
    def __str__(self):
        type_str = "Echo" if self.is_echo else "DisEcho"
        return f"{self.user.username} - {type_str} on {self.content_object}"
# echo_api/tasks.py

from django.utils import timezone
from django.db import transaction
from .models import Post, Comment

# Внимание: Если вы используете Celery, вам нужно добавить:
# from celery import shared_task
# и использовать декоратор @shared_task перед функцией.
# Если вы используете Django-Q, используйте @job.

def check_and_float_expired_posts():
    """
    Регулярная задача: Находит все посты, у которых истек срок жизни, и 
    переводит их комментарии в 'плавучий' режим, удаляя родительский пост.
    
    Эту функцию нужно настроить на выполнение каждые 15-60 минут 
    с помощью Celery Beat, Django-Q Scheduler или Cron Job.
    """
    
    now = timezone.now()
    # Ищем посты, у которых истек срок (expires_at <= now)
    expired_posts = Post.objects.filter(expires_at__lte=now)
    
    processed_count = 0
    
    for post in expired_posts:
        # Используем транзакцию, чтобы гарантировать: либо все комментарии спасены 
        # и пост удален, либо ничего не происходит (в случае ошибки).
        with transaction.atomic():
            comments_count = post.kill_and_float_comments()
            
            # Логирование для отладки
            print(f"Пост ID {post.id} убит. Переведено в 'плавание': {comments_count} комментариев.")
            
            processed_count += 1
            
    return f"Завершена проверка. Обработано {processed_count} постов."
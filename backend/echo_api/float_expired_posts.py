from django.core.management.base import BaseCommand
from backend.echo_api.models import Post
from django.utils import timezone

class Command(BaseCommand):
    help = 'Переводит комментарии истёкших постов в плавающие'

    def handle(self, *args, **kwargs):
        expired_posts = Post.objects.filter(expires_at__lt=timezone.now())
        for post in expired_posts:
            post.kill_and_float_comments()
        self.stdout.write(self.style.SUCCESS('Обработка завершена'))
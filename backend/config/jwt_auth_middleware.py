from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()

class TokenAuthMiddleware:
    """
    Кастомный Middleware для получения пользователя по JWT из URL-параметров.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        try:
            # Ищем токен в URL-параметрах (например, ws://...?token=...)
            query_string = parse_qs(scope["query_string"].decode("utf8"))
            token = query_string.get('token', [None])[0]

            if token:
                try:
                    # Валидация токена и извлечение user_id
                    access_token = AccessToken(token)
                    user = await self.get_user_from_token(access_token)
                    scope['user'] = user
                except Exception:
                    # Ошибка валидации или истечение срока действия
                    scope['user'] = AnonymousUser()
            else:
                scope['user'] = AnonymousUser()

        except Exception:
            scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)

    # Синхронный метод для получения пользователя (вызываем асинхронно)
    @staticmethod
    @database_sync_to_async
    def get_user_from_token(access_token):
        # AccessToken['user_id'] содержит ID пользователя
        user_id = access_token.get('user_id') 
        if not user_id:
             return AnonymousUser()
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()


def TokenAuthMiddlewareStack(inner):
    """
    Обертка, которая обеспечивает работу стандартных Channels и нашего JWT middleware.
    """
    return TokenAuthMiddleware(AuthMiddlewareStack(inner))
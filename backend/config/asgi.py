
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import messenger.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Базовое ASGI приложение для HTTP
django_application = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_application,  # Обычные HTTP запросы
    "websocket": AuthMiddlewareStack(  # WebSocket соединения
        URLRouter(
            messenger.routing.websocket_urlpatterns  # Наши WebSocket routes
        )
    ),
})

"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

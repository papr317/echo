import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from backend.messenger_api import routing as messenger_routing 
# !!! ИМПОРТИРУЕМ НОВЫЙ MIDDLEWARE !!!
from .jwt_auth_middleware import TokenAuthMiddlewareStack 
# -----------------------------------

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    # HTTP запросы (отправляются в Django)
    "http": django_asgi_app,

    # WebSocket запросы (отправляются в Channels)
    "websocket": TokenAuthMiddlewareStack( # <--- ИСПОЛЬЗУЕМ JWT
        URLRouter([
            # ВСЕ WEBSOCKET-МАРШРУТЫ ДОЛЖНЫ БЫТЬ ПОД ЭТОЙ ССЫЛКОЙ
            path('ws/', URLRouter(messenger_routing.websocket_urlpatterns)),
        ])
    ),
})
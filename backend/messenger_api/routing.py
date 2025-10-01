from django.urls import re_path
from . import consumers # Мы импортируем обработчик (Consumer)

websocket_urlpatterns = [
    # Маршрут для чата: ws/chat/ - это префикс
    # (?P<chat_id>\d+) - захватывает числовой ID чата
    re_path(r'ws/chat/(?P<chat_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
]
# messenger_api/routing.py

from django.urls import re_path
from . import consumers # Мы импортируем обработчик (Consumer)

websocket_urlpatterns = [
    # ИСПРАВЛЕНИЕ: Удалён лишний префикс 'ws/'.
    # Теперь путь начинается с 'chat/'
    re_path(r'chat/(?P<chat_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
]
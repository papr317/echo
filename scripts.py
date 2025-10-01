# add_user_to_chat.py (ИЛИ ЛЮБОЙ ДРУГОЙ СКРИПТ, КОТОРЫЙ ВЫ ЗАПУСКАЕТЕ)
import django
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(PROJECT_ROOT, 'backend')) 


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings') 
django.setup()

from messenger_api.models import Chat
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

# --- Остальная часть вашей функции add_user_to_chat() ---
# ...
# Установка окружения Django
# Убедитесь, что эта строка соответствует пути к вашему settings.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings') 
django.setup()


# --- Параметры для проверки ---
USER_ID_TO_CHECK = 1
CHAT_ID_TO_CHECK = 1
# -----------------------------

def add_user_to_chat():
    """Проверяет и добавляет пользователя в чат."""
    User = get_user_model()

    print(f"--- Проверка доступа к Чату ID: {CHAT_ID_TO_CHECK} ---")
    
    try:
        user = User.objects.get(pk=USER_ID_TO_CHECK)
        print(f"✅ Пользователь найден: {user.username} (ID: {user.pk})")
    except ObjectDoesNotExist:
        print(f"❌ Ошибка: Пользователь с ID {USER_ID_TO_CHECK} не найден в БД.")
        sys.exit(1)

    try:
        chat = Chat.objects.get(pk=CHAT_ID_TO_CHECK)
        print(f"✅ Чат найден: ID {chat.pk}")
    except ObjectDoesNotExist:
        print(f"❌ Ошибка: Чат с ID {CHAT_ID_TO_CHECK} не найден в БД.")
        sys.exit(1)

    # Проверка участия
    is_member = chat.participants.filter(pk=user.pk).exists()

    if not is_member:
        # Добавление пользователя в чат
        chat.participants.add(user)
        print(f"🔄 Пользователь {user.pk} был успешно добавлен в чат {chat.pk}.")
    else:
        print(f"🟢 Пользователь {user.pk} уже является участником чата {chat.pk}. Всё в порядке.")

    print("--- Проверка завершена. ---")


if __name__ == "__main__":
    add_user_to_chat()
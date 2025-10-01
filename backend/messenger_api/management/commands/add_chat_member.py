# backend/messenger_api/management/commands/add_chat_member.py

from django.core.management.base import BaseCommand
# ИСПРАВЛЕНИЕ: Добавляем 'backend.' к пути импорта, чтобы указать правильный корень.
from backend.messenger_api.models import Chat 
# --------------------------------------------------------------------------
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

class Command(BaseCommand):
    # ... (весь остальной код остается прежним)
    help = 'Ensures User 1 is a participant of Chat 1 to fix 403 errors.'

    def handle(self, *args, **options):
        USER_ID_TO_CHECK = 1
        CHAT_ID_TO_CHECK = 1
        User = get_user_model()

        self.stdout.write(f"\n--- Проверка доступа к Чату ID: {CHAT_ID_TO_CHECK} ---")
        
        try:
            user = User.objects.get(pk=USER_ID_TO_CHECK)
            self.stdout.write(self.style.SUCCESS(f"✅ Пользователь найден: {user.username} (ID: {user.pk})"))
        except ObjectDoesNotExist:
            self.stdout.write(self.style.ERROR(f"❌ Ошибка: Пользователь с ID {USER_ID_TO_CHECK} не найден в БД."))
            return

        try:
            chat = Chat.objects.get(pk=CHAT_ID_TO_CHECK)
            self.stdout.write(self.style.SUCCESS(f"✅ Чат найден: ID {chat.pk}"))
        except ObjectDoesNotExist:
            self.stdout.write(self.style.ERROR(f"❌ Ошибка: Чат с ID {CHAT_ID_TO_CHECK} не найден в БД."))
            return

        is_member = chat.participants.filter(pk=user.pk).exists()

        if not is_member:
            chat.participants.add(user)
            self.stdout.write(self.style.WARNING(f"🔄 Пользователь {user.pk} был успешно добавлен в чат {chat.pk}."))
        else:
            self.stdout.write(self.style.SUCCESS(f"🟢 Пользователь {user.pk} уже является участником чата {chat.pk}. Всё в порядке."))

        self.stdout.write("--- Проверка завершена. ---")
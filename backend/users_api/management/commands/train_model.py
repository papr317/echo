import joblib
import matplotlib.pyplot as plt
import numpy as np
import re
from pathlib import Path
from django.core.management.base import BaseCommand
from backend.users_api.models import NicknameDataset
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "nickname_model.joblib"

class NicknameModelV13:
    def __init__(self, toxic_list):
        # 1. Сначала определяем все правила (Leet Map)
        self.complex_leet = {
            '|)': 'd', '|_|': 'u', '|*': 'p', '|2': 'r', '|\\|': 'n', 
            '|V|': 'm', '|=\\': 'f', '|<': 'k', '\\/\\/': 'w', '\\/': 'v'
        }
        self.simple_leet = {
            '4': 'a', '@': 'a', '8': 'b', '(': 'c', '3': 'e', '€': 'e',
            '6': 'b', '9': 'g', '#': 'h', '1': 'i', '!': 'i', '0': 'o',
            '5': 's', '$': 's', '7': 't', '+': 't', '%': 'x', '2': 'z'
        }
        
        # 2. Только ПОТОМ нормализуем словарик (теперь self.complex_leet существует)
        self.toxic_vocab = [self.normalize(word) for word in toxic_list if word]

    def normalize(self, text):
        text = str(text).lower()
        # Сначала расшифровываем сложные символы
        for sym, char in self.complex_leet.items():
            text = text.replace(sym, char)
        # Потом одиночные замены
        for sym, char in self.simple_leet.items():
            text = text.replace(sym, char)
        # Удаляем всё кроме букв a-z и а-я
        text = re.sub(r'[^a-zа-я]', '', text)
        return text

    def predict(self, nicknames):
        results = []
        for nick in nicknames:
            norm_nick = self.normalize(nick)
            # Если хотя бы одно плохое слово (длиной > 2 символов) есть в нике
            is_toxic = any(bad in norm_nick for bad in self.toxic_vocab if len(bad) > 2)
            results.append(1 if is_toxic else 0)
        return results

class Command(BaseCommand):
    help = "Анализ 4857+ записей, отчет и график точности"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS(f"--- Запуск анализа БД ({NicknameDataset.objects.count()} записей) ---"))

        # 1. Загрузка данных
        data_qs = list(NicknameDataset.objects.all().values_list('nickname', 'is_toxic'))
        if not data_qs:
            self.stderr.write("БД пуста!")
            return

        nicks = [item[0] for item in data_qs]
        y_true = [1 if item[1] else 0 for item in data_qs]

        # 2. Создание модели
        toxic_vocab = [n for n, t in data_qs if t]
        model = NicknameModelV13(toxic_vocab)

        # 3. Предсказание
        y_pred = model.predict(nicks)

        # 4. Отчет по ошибкам
        self.stdout.write("\nПРОВЕРКА (Первые 15):")
        for nick, true, pred in zip(nicks[:15], y_true[:15], y_pred[:15]):
            status = "✅" if true == pred else "❌"
            self.stdout.write(f"{status} {nick[:15]:<15} | P: {pred} | T: {true}")

        # 5. Метрики и Матрица
        accuracy = np.mean(np.array(y_true) == np.array(y_pred))
        self.stdout.write(self.style.SUCCESS(f"\nИТОГОВАЯ ТОЧНОСТЬ: {accuracy:.2%}"))

        

        cm = confusion_matrix(y_true, y_pred)
        disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Чисто", "Токсик"])
        fig, ax = plt.subplots(figsize=(8, 6))
        disp.plot(cmap=plt.cm.Blues, ax=ax)
        plt.title(f"Матрица ошибок (V13.1)\nВсего: {len(nicks)} | Accuracy: {accuracy:.2%}")
        
        joblib.dump(model, MODEL_PATH)
        self.stdout.write(self.style.SUCCESS(f"Модель сохранена в {MODEL_PATH}"))
        
        plt.show()
from django.core.management.base import BaseCommand
from backend.users_api.models import NicknameDataset
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
import joblib
from pathlib import Path
import logging

logger = logging.getLogger(__name__)
MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "nickname_model.joblib"
FALLBACK_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "nicknames.csv"

class Command(BaseCommand):
    help = "Обучение модели для классификации токсичных никнеймов"

    def handle(self, *args, **options):
        logging.basicConfig(level=logging.INFO)
        self.stdout.write("Загрузка данных...")

        # Получаем данные из БД
        nick_qs = list(NicknameDataset.objects.all().values('nickname', 'is_toxic'))
        if not nick_qs:
            self.stdout.write("Записей в таблице NicknameDataset не найдено.")
            # Попытка fallback на CSV (если есть)
            if FALLBACK_CSV.exists():
                self.stdout.write(f"Попытка загрузить данные из {FALLBACK_CSV}")
                df = pd.read_csv(FALLBACK_CSV)
                if 'nickname' in df.columns and 'is_toxic' in df.columns:
                    df = df[['nickname', 'is_toxic']]
                else:
                    self.stderr.write("CSV не содержит колонки 'nickname' и 'is_toxic'. Отмена.")
                    return
            else:
                self.stderr.write("Нет данных для обучения. Добавьте записи в БД или положите CSV в backend/users_api/data/")
                return
        else:
            df = pd.DataFrame(nick_qs)

        # Предобработка
        df['nickname'] = df['nickname'].fillna('').astype(str)
        if df['nickname'].eq('').all():
            self.stderr.write("Все nicknames пустые. Проверьте данные.")
            return

        # Приводим метки к 0/1
        try:
            df['is_toxic'] = df['is_toxic'].astype(int)
        except Exception:
            # Попытка нормализовать строковые метки
            df['is_toxic'] = df['is_toxic'].map(lambda x: 1 if str(x).strip().lower() in ('1','true','yes','toxic') else 0)

        X = df['nickname']
        y = df['is_toxic']

        strat = y if y.nunique() > 1 else None
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=strat
            )
        except ValueError as e:
            self.stderr.write(f"Ошибка при split: {e}. Пробуем без stratify.")
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(analyzer='char_wb', ngram_range=(2,4), max_features=10000)),
            ('clf', RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1, class_weight='balanced'))
        ])

        self.stdout.write("Начало обучения...")
        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)
        self.stdout.write("\nРезультаты классификации:\n")
        self.stdout.write(classification_report(y_test, y_pred))

        # Создаём директорию если нужно и сохраняем модель
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(pipeline, MODEL_PATH)
        self.stdout.write(f"\nМодель сохранена в {MODEL_PATH}")

        # Примеры предсказаний (для быстрого теста)
        test_nicknames = ["user123", "toxic_666", "friendly_player"]
        self.stdout.write("\nПримеры предсказаний:")
        predictions = pipeline.predict(test_nicknames)
        for nick, pred in zip(test_nicknames, predictions):
            self.stdout.write(f"{nick}: {'токсичный' if int(pred) else 'нормальный'}")
import csv
from pathlib import Path
from typing import List, Tuple, Dict
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import os
import sys
import django

# Добавляем корневую директорию проекта в sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
django.setup()

from users_api.models import NicknameDataset

# --- КОНСТАНТЫ И РАСШИРЕННЫЕ СЛОВАРИ (V10 - УСТРАНЕНИЕ FN) ---

CSV_FILE_NAME = 'toxic_nicks.csv' 
TOXIC_DATASET_RU: List[str] = []
TOXIC_DATASET_OTHER: List[str] = []

# Максимально агрессивный и точный словарь гомоглифов
HOMOGLYPH_MAP: Dict[str, str] = {
    # Числа и символы
    '4': 'а', '@': 'а', '6': 'б', '3': 'е', '1': 'и', '0': 'о', '2': 'з', '5': 'с',
    
    # Латиница, которая должна стать кириллицей для русского leet speak
    'p': 'п',  # FIX: p (латиница) -> п (кириллица) [Для Пидор]
    'u': 'у',  # FIX: u (латиница) -> у (кириллица) [Для Сука]
    'r': 'р',  # r (латиница) -> р (кириллица)
    'y': 'у',  # y (латиница) -> у (кириллица)
    'h': 'н',  # h (латиница) -> н (кириллица)
    'c': 'с',  # c (латиница) -> с (кириллица)
    'x': 'х',  # x (латиница) -> х (кириллица)
    'b': 'б',  # b (латиница) -> б (кириллица) [Для Еблан, Тварb]
    'l': 'л',  # l (латиница) -> л (кириллица)
    'd': 'д',  # d (латиница) -> д (кириллица)
    't': 'т',  # t (латиница) -> т (кириллица)
    'f': 'ф',
    'v': 'в',
    'w': 'ш',
    'k': 'к',
    'j': 'и', 
    'q': 'к',
}

def normalize_homoglyphs(text: str) -> str:
    """Заменяет гомоглифы на кириллические эквиваленты."""
    normalized = text.lower()
    for lat, cyr in HOMOGLYPH_MAP.items():
        normalized = normalized.replace(lat, cyr)
    return normalized

# --- ФУНКЦИЯ ЗАГРУЗКИ ДАННЫХ (БЕЗ ИЗМЕНЕНИЙ) ---

def load_toxic_data_from_db() -> Tuple[List[str], List[str]]:
    ru_list = []
    other_list = []
    
    try:
        toxic_nicknames = NicknameDataset.objects.filter(is_toxic=True)
        
        for entry in toxic_nicknames:
            word = entry.nickname.lower()
            lang = entry.language_type
            
            # Очистка слов в базе от заведомых маскировок
            cleaned_word = (word.replace('@', 'а').replace('0', 'о').replace('3', 'е').replace('1', 'и'))

            if lang == 'ru':
                ru_list.append(cleaned_word)
            else:
                other_list.append(word)

        print(f"Успешно загружено {len(ru_list)} русских и {len(other_list)} нерусских слов из БД.")
        return ru_list, other_list
    except Exception as e:
        print(f"\nКритическая ошибка при чтении из БД: {e}")
        return [], []

# --- ГЛАВНАЯ ЛОГИКА ПРОВЕРКИ (БЕЗ ИЗМЕНЕНИЙ) ---

def check_nickname_toxicity(nickname: str) -> bool:
    if not nickname:
        return False
        
    normalized_nickname = nickname.lower()
    
    # 1. Проверка нерусских слов (EN, CN)
    for toxic_word in TOXIC_DATASET_OTHER:
        if toxic_word in normalized_nickname: 
            return True
    
    # 2. Проверка русских слов с учетом гомоглифов
    homoglyph_normalized_nickname = normalize_homoglyphs(normalized_nickname)
    for toxic_word in TOXIC_DATASET_RU:
        if toxic_word in homoglyph_normalized_nickname:
            return True 
            
    return False 

# --- ФУНКЦИЯ ОЦЕНКИ И ГРАФИКОВ (БЕЗ ИЗМЕНЕНИЙ) ---

def evaluate_and_plot(eval_data: List[Tuple[str, bool]]):
    actual_labels = [item[1] for item in eval_data]
    predicted_labels = []

    print("\n--- Запуск оценки модели ---")
    for nickname, actual_is_toxic in eval_data:
        predicted_is_toxic = check_nickname_toxicity(nickname)
        predicted_labels.append(predicted_is_toxic)
        
        status = "✅ Верно" if predicted_is_toxic == actual_is_toxic else "❌ Ошибка"
        if predicted_is_toxic == True and actual_is_toxic == True: match_type = "TP"
        elif predicted_is_toxic == False and actual_is_toxic == False: match_type = "TN" 
        elif predicted_is_toxic == True and actual_is_toxic == False: match_type = "FP"
        elif predicted_is_toxic == False and actual_is_toxic == True: match_type = "FN"

        print(f"[{status} {match_type}] '{nickname}' -> Предсказано: {predicted_is_toxic}, Ожидалось: {actual_is_toxic}")

    # Надежный расчет TP, TN, FP, FN
    TP = sum(p and a for p, a in zip(predicted_labels, actual_labels))
    TN = sum(not p and not a for p, a in zip(predicted_labels, actual_labels))
    FP = sum(p and not a for p, a in zip(predicted_labels, actual_labels))
    FN = sum(not p and a for p, a in zip(predicted_labels, actual_labels))
    
    # Создаем матрицу ошибок
    cm = np.array([[TP, FP], [FN, TN]]) 
    
    accuracy = (TP + TN) / len(eval_data)
    precision = TP / (TP + FP) if (TP + FP) > 0 else 0
    recall = TP / (TP + FN) if (TP + FN) > 0 else 0
    
    print("\n--- МЕТРИКИ ПРОИЗВОДИТЕЛЬНОСТИ ---")
    print(f"Точность (Accuracy): {accuracy:.4f}")
    print(f"Прецизионность (Precision): {precision:.4f}")
    print(f"Полнота (Recall): {recall:.4f}")

    # Визуализация 
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Токсичный", "Нетоксичный"])
    fig, ax = plt.subplots(figsize=(7, 7))
    disp.plot(cmap=plt.cm.Blues, ax=ax)
    ax.set_title("Матрица Ошибок (V10)")
    
    plt.show()

# --- ТЕСТОВЫЕ ДАННЫЕ (АВТОМАТИЧЕСКИЕ) ---
EVAL_DATA: List[Tuple[str, bool]] = [
    ("Tварb_на_xуe", True),      
    ("3blan4ik", True),          
    ("P1d0r4s666", True),        
    ("cuka_cyka", True),         
    ("ПидорассС", True),
    ("УБЛЮДОК11", True),
    ("你妈是煞笔", True), 
    ("Caravan", False),
    ("NormalPlayer", False),
    ("GamerPro2024", False),
    ("MyNickname", False),
    ("HomerSimpson", False),
    ("NotToxicNick", False), 
    ("qwertydick", True),
    ("хуй", True),
    ("fuck", True),
]

# --- ФУНКЦИЯ ИНТЕРАКТИВНОГО ТЕСТИРОВАНИЯ (БЕЗ ИЗМЕНЕНИЙ) ---

def interactive_test(current_data: List[Tuple[str, bool]]):
    print("\n" + "="*50)
    print("🤖 РЕЖИМ ИНТЕРАКТИВНОГО ТЕСТИРОВАНИЯ")
    print("Введите 'end' для завершения и построения финального графика.")
    print("="*50)
    
    while True:
        nickname = input("\nВведите никнейм для проверки: ")
        if nickname.lower() == 'end':
            break
        
        try:
            expected_label = input("Это токсичный ник? (True/False): ")
            if expected_label.lower() not in ['true', 'false']:
                print("⚠️ Введите только 'True' или 'False'.")
                continue
                
            expected_label_bool = expected_label.lower() == 'true'
            
            # Проверка
            predicted_is_toxic = check_nickname_toxicity(nickname)
            status = "✅ ВЕРНО" if predicted_is_toxic == expected_label_bool else "❌ ОШИБКА"
            
            print(f"\n--- РЕЗУЛЬТАТ ---")
            print(f"Нормализованный ник: {normalize_homoglyphs(nickname)}")
            print(f"Предсказание модели: {'ТОКСИЧНЫЙ' if predicted_is_toxic else 'ЧИСТЫЙ'}")
            print(f"Вердикт: {status}. Модель предсказала {predicted_is_toxic}, ожидалось {expected_label_bool}.")
            print("-----------------")

            current_data.append((nickname, expected_label_bool))

        except Exception as e:
            print(f"Произошла ошибка ввода: {e}")
            continue

# --- ГЛАВНАЯ ПРОГРАММА ---
if __name__ == "__main__":
    
    print(f"--- Запуск теста: Загрузка данных из БД ---")
    TOXIC_DATASET_RU, TOXIC_DATASET_OTHER = load_toxic_data_from_db()
    
    if not TOXIC_DATASET_RU and not TOXIC_DATASET_OTHER:
        print("\nТестирование остановлено из-за отсутствия данных.")
    else:
        # 1. АВТОМАТИЧЕСКИЕ ТЕСТЫ
        evaluate_and_plot(EVAL_DATA)

        # 2. ИНТЕРАКТИВНЫЙ РЕЖИМ
        interactive_test(EVAL_DATA)
        
        # 3. ФИНАЛЬНАЯ ОЦЕНКА
        if len(EVAL_DATA) > 16: 
             print("\n" + "="*50)
             print("📈 ФИНАЛЬНАЯ ОЦЕНКА (с учетом введенных вами ников)")
             evaluate_and_plot(EVAL_DATA)

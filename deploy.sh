#!/bin/bash

# команда для запуска:
# bash deploy.sh

# venv
# source C:/Users/user/Desktop/echo/venv/Scripts/activate

# --- НАСТРОЙКИ СКРИПТА ---
VENV_NAME="venv"
# Указываем, что VENV находится внутри папки backend
VENV_PATH="./$VENV_NAME"
FRONTEND_DIR="frontend"

# --- ФУНКЦИЯ ОЧИСТКИ (ОСТАНОВКА ПРОЦЕССОВ) ---
cleanup() {
    echo ""
    echo "Останавливаем серверы и фронтенд..."

    if [ -n "$DAPHNE_PID" ]; then
        kill $DAPHNE_PID 2>/dev/null
    fi
    
    if [ -n "$RUNSERVER_PID" ]; then
        kill $RUNSERVER_PID 2>/dev/null
    fi

    if [ -n "$FRONTEND_PID" ]; then
        # Используем pkill -P для убийства дочерних процессов npm start
        pkill -P $FRONTEND_PID 2>/dev/null
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    # Остановка SCHEDULER (если был бы запущен)
    kill $SCHEDULER_PID 2>/dev/null

    # Деактивация виртуального окружения
    if [ -n "$VIRTUAL_ENV" ]; then
        deactivate 2>/dev/null
    fi

    echo "Все компоненты остановлены. Выход."
    exit 0
}

trap cleanup SIGINT EXIT

# --- ОСНОВНАЯ ЛОГИКА ЗАПУСКА ---

# Устанавливаем переменные окружения для бэкенда
export DJANGO_SETTINGS_MODULE=backend.config.settings

# --- 0. Создание (если нет), Установка зависимостей и Активация VENV ---
if [ ! -d "$VENV_PATH" ]; then
    echo "Виртуальное окружение '$VENV_NAME' не найдено в папке backend. Создаем..."
    # Создаем VENV в папке backend
    python3 -m venv $VENV_PATH
    if [ $? -ne 0 ]; then
        echo "Ошибка: Не удалось создать VENV. Проверьте, установлен ли python3."
        exit 1
    fi
fi

# Активация VENV (проверка путей Windows/Unix)
ACTIVATE_SCRIPT=""

if [ -f "$VENV_PATH/bin/activate" ]; then
    # Путь для Linux/macOS/WSL
    ACTIVATE_SCRIPT="$VENV_PATH/bin/activate"
elif [ -f "$VENV_PATH/Scripts/activate" ]; then
    # Путь для Windows (Git Bash/Cygwin)
    ACTIVATE_SCRIPT="$VENV_PATH/Scripts/activate"
else
    echo "Ошибка: Не найден скрипт активации VENV ни по пути bin/activate, ни по Scripts/activate."
    exit 1
fi

source "$ACTIVATE_SCRIPT"
if [ $? -ne 0 ]; then
    echo "Ошибка: Не удалось активировать виртуальное окружение."
    exit 1
fi

echo "Виртуальное окружение активировано."
# Установка/Обновление зависимостей
if [ -f "requirements.txt" ]; then
    echo "Устанавливаем/Обновляем зависимости из backend/requirements.txt..."
    # ИСПРАВЛЕНИЕ: Используйте полный путь к файлу
    pip install -r backend/requirements.txt 
    
    if [ $? -ne 0 ]; then
        echo "Внимание: Не удалось установить все зависимости. Проверьте backend/requirements.txt."
    fi
else
    echo "Внимание: requirements.txt не найден в backend/. Зависимости не установлены."
fi
echo ""
# --------------------------------------------------------------------------

# --- 1. ЗАПУСК DAPHNE (ASGI/Channels) на 8001 ---
echo " Запускаем Daphne (Channels) на порту 8001..."
python manage.py runserver 8001 &
DAPHNE_PID=$!

# --- 2. ЗАПУСК RUNSERVER (REST API) на 8000 ---
echo " Запускаем Django Runserver (REST API) на порту 8000..."
python manage.py runserver 8000 &
RUNSERVER_PID=$!

# --- 3. ЗАПУСК ФРОНТЕНДА (npm start) ---
echo " Запускаем фронтенд (npm start)..."
if [ -d "$FRONTEND_DIR" ]; then
    # Запускаем в фоне, перенаправляя вывод, чтобы не забивать терминал
    (cd "$FRONTEND_DIR" && nohup npm start > /dev/null 2>&1 &)
    FRONTEND_PID=$!
else
    echo "Ошибка: Папка фронтенда ($FRONTEND_DIR) не найдена. Пропуск."
fi

echo ""
echo " ВСЕ КОМПОНЕНТЫ ЗАПУЩЕНЫ:"
echo "   - REST API:    http://127.0.0.1:8000/ (PID: $RUNSERVER_PID)"
echo "   - CHANNELS:    http://127.0.0.1:8001/ (PID: $DAPHNE_PID)"
echo "   - FRONTEND:    http://127.0.0.1:3000/ (PID: $FRONTEND_PID)"
echo ""
echo "Нажмите Enter или Ctrl+C для остановки всех серверов и выхода..."

# --- ОЖИДАНИЕ ОСТАНОВКИ ---
read
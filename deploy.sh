#!/bin/bash

# КОМАНДА ЗАПУСКА ВСЕХ КОМПОНЕНТОВ ПРОЕКТА
# ./deploy.sh

# не забудь запустить redis-server в wsl перед этим!
# sudo service redis-server start
redis-cli ping
# sudo service redis-server stop

# --- НАСТРОЙКИ ---
VENV_PATH="./venv"
FRONTEND_DIR="frontend"
LOG_DIR="./logs"
COMMAND_NAME="float_expired_posts"

# Упрощенные цвета для стабильности в Git Bash (Windows)
G='\033[32m' # Зеленый (Front)
R='\033[31m' # Красный (System)
Y='\033[33m' # Желтый (WS/Daphne)
B='\033[34m' # Синий (API)
P='\033[35m' # Пурпурный (Scheduler)
NC='\033[0m'

mkdir -p "$LOG_DIR"
export DJANGO_SETTINGS_MODULE=backend.config.settings

# Очистка старых логов
echo "" > "$LOG_DIR/api.log"
echo "" > "$LOG_DIR/ws.log"
echo "" > "$LOG_DIR/front.log"
echo "" > "$LOG_DIR/scheduler.log"

cleanup() {
    echo -e "\n${R}[!] Остановка всех систем...${NC}"
    # Убиваем tail
    if [ ! -z "$TAIL_PID" ]; then kill $TAIL_PID 2>/dev/null; fi
    # Убиваем планировщик (цикл bash)
    if [ ! -z "$SCHEDULER_PID" ]; then kill $SCHEDULER_PID 2>/dev/null; fi
    # Чистим порты Windows
    taskkill //F //IM python.exe //T 2>/dev/null
    taskkill //F //IM node.exe //T 2>/dev/null
    echo -e "${G}Все компоненты остановлены.${NC}"
    exit 0
}
trap cleanup SIGINT

echo -e "${B}=== ECHO PROJECT : STABLE DEPLOY ===${NC}"

# 0. Предварительная очистка портов
taskkill //F //IM python.exe //T 2>/dev/null
taskkill //F //IM node.exe //T 2>/dev/null

# 1. Активация Venv
if [ -f "$VENV_PATH/Scripts/activate" ]; then
    source "$VENV_PATH/Scripts/activate"
    echo -e "${G}[OK] Виртуальное окружение активировано.${NC}"
else
    echo -e "${R}[!] Внимание: Venv не найден в $VENV_PATH. Пробуем без него...${NC}"
fi

# 2. ЗАПУСК КОМПОНЕНТОВ (Логирование через файлы)

echo -e "${Y}[*] Запуск сервисов...${NC}"

# API (8000)
python manage.py runserver 8000 > "$LOG_DIR/api.log" 2>&1 &

# Channels/Daphne (8001)
python manage.py runserver 8001 > "$LOG_DIR/ws.log" 2>&1 &


# Фронтенд
if [ -d "$FRONTEND_DIR" ]; then
    (cd "$FRONTEND_DIR" && npm start > "../$LOG_DIR/front.log" 2>&1 &)
fi

echo -e "${G}[OK] Все системы в работе!${NC}"
echo -e "--------------------------------------------------"
echo -e " ЛОГИ (API=${B}Blue${NC}, WS=${Y}Yellow${NC}, SCHED=${P}Purple${NC}, FRONT=${G}Green${NC})"
echo -e "--------------------------------------------------"

# 3. ЕДИНЫЙ ВЫВОД ЛОГОВ С ПРЕФИКСАМИ (через sed для раскраски)
# Мы запускаем чтение всех файлов сразу
tail -f "$LOG_DIR/api.log" | sed "s/^/${B}[API]${NC} /" &
tail -f "$LOG_DIR/ws.log" | sed "s/^/${Y}[WS ]${NC} /" &
tail -f "$LOG_DIR/scheduler.log" | sed "s/^/${P}[SCHED]${NC} /" &
tail -f "$LOG_DIR/front.log" | sed "s/^/${G}[FRONT]${NC} /" &

TAIL_PID=$!

echo -e "\n${Y}Нажми [ENTER] для завершения работы.${NC}\n"

# Ждем ввода
read -p ""

cleanup
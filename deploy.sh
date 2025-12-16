#!/bin/bash

# команда для запуска:
# bash deploy.sh

# не забудь запустить redis-server в wsl перед этим!
# sudo service redis-server start
# redis-cli ping
# sudo service redis-server stop


# --- НАСТРОЙКИ ---
VENV_PATH="./venv"
FRONTEND_DIR="frontend"
LOG_DIR="./logs"

# Цвета
G='\033[0;32m'
R='\033[0;31m'
Y='\033[1;33m'
B='\033[0;34m'
NC='\033[0m'

# Создаем папку для логов, если её нет
mkdir -p $LOG_DIR

cleanup() {
    echo -e "\n${R}[!] Остановка всех систем...${NC}"
    taskkill //F //IM python.exe //T 2>/dev/null
    taskkill //F //IM node.exe //T 2>/dev/null
    echo -e "${G}Логи сохранены в папке $LOG_DIR${NC}"
    exit 0
}
trap cleanup SIGINT

echo -e "${B}          ECHO PROJECT : FAST DEPLOY (LOGS ON)      ${NC}"

# 0. Чистка портов
echo -e "${Y}[*] Освобождаем порты...${NC}"
taskkill //F //IM python.exe //T 2>/dev/null
taskkill //F //IM node.exe //T 2>/dev/null

# 1. Активация VENV
if [ -f "$VENV_PATH/Scripts/activate" ]; then
    source "$VENV_PATH/Scripts/activate"
    echo -e "${G}[OK] Venv активирован.${NC}"
else
    echo -e "${R}[!] Ошибка: Venv не найден в $VENV_PATH${NC}"
fi

# 2. Запуск Backend API (8000)
echo -e "${Y}[*] Запуск API (Лог: $LOG_DIR/api.log)...${NC}"
python manage.py runserver 8000 > "$LOG_DIR/api.log" 2>&1 &

# 3. Запуск Frontend (3000)
if [ -d "$FRONTEND_DIR" ]; then
    echo -e "${Y}[*] Запуск Frontend (Лог: $LOG_DIR/front.log)...${NC}"
    (cd "$FRONTEND_DIR" && npm start > "../$LOG_DIR/front.log" 2>&1 &)
fi

# 4. Запуск WebSockets (8001)
echo -e "\n${Y}==================================================${NC}"
echo -e "${G} ВСЕ СИСТЕМЫ ВКЛЮЧЕНЫ! ${NC}"
echo -e " API: http://127.0.0.1:8000"
echo -e " WS:  ws://127.0.0.1:8001"
echo -e " Frontend: http://127.0.0.1:3000"
echo -e "${Y}==================================================${NC}"
echo -e "${B}Нажми ENTER для завершения работы.${NC}"
echo -e "${R}Ошибки WebSocket будут дублироваться здесь и в ws.log:${NC}\n"

# Запускаем WS и используем tee, чтобы писать и в файл, и в консоль одновременно!
python manage.py runserver 8001 2>&1 | tee "$LOG_DIR/ws.log" &

# Ожидание нажатия Enter
read -p ""

cleanup
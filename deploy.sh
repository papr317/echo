#!/bin/bash

cd frontend
npm run build
cd ..

# Создание папок, если их нет
mkdir -p backend/templates
mkdir -p backend/static

# Копирование файлов
cp frontend/build/index.html backend/templates/echo.html
cp -r frontend/build/static/* backend/static/

# Копирование статических файлов
cp frontend/public/logo.png backend/static/
cp frontend/public/logo_2.png backend/static/

# chmod +x deploy.sh
# bash deploy.sh

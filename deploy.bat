cd frontend
npm run build
cd ..

:: Создание папок, если их нет
if not exist backend\templates\echo mkdir backend\templates\echo
if not exist backend\static\echo mkdir backend\static\echo

:: Копирование файлов
xcopy /Y /E /I frontend\build\index.html backend\templates\echo\echo.html
xcopy /Y /E /I frontend\build\static backend\static\echo\

:: Копирование статических файлов
xcopy /Y frontend\public\logo.png backend\static\echo\
xcopy /Y frontend\public\logo_2.png backend\static\echo\

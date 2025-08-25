if not exist backend mkdir backend
if not exist frontend mkdir frontend

cd backend
python manage.py runserver
cd ..
 
@REM cd frontend
@REM npm run start
@REM cd ..
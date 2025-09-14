from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password

from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer

# вход с JWT - ИСПРАВЛЕННАЯ ВЕРСИЯ
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        print("Request data:", request.data)  # Для отладки
        print("Request POST:", request.POST)   # Для отладки
        
        # Пробуем получить данные из разных источников
        credential = request.data.get("credential")
        password = request.data.get("password")
        
        # Если не нашли в data, пробуем из POST (для form-data)
        if credential is None:
            credential = request.POST.get("credential")
        if password is None:
            password = request.POST.get("password")
            
        print(f"Credential: {credential}, Password: {password}")  # Для отладки

        # Проверяем что данные есть
        if not credential or not password:
            return Response(
                {"error": "Необходимо указать credential и password"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user = None

        # Проверяем на email
        try:
            user = CustomUser.objects.get(email=credential)
        except CustomUser.DoesNotExist:
            pass
        
        # Если не нашли по email, пробуем по phone
        if not user:
            try:
                user = CustomUser.objects.get(phone=credential)
            except CustomUser.DoesNotExist:
                pass
        
        # Если не нашли по phone, пробуем по username
        if not user:
            try:
                user = CustomUser.objects.get(username=credential)
            except CustomUser.DoesNotExist:
                pass

        if user and user.check_password(password):
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Успешный вход",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        return Response({"error": "Неверные учетные данные"}, status=status.HTTP_400_BAD_REQUEST)


# регистрация с JWT
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Генерируем JWT токены
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


# выход (с JWT обычно делается на клиенте)
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({"message": "Вы вышли"}, status=status.HTTP_200_OK)


# список пользователей (только админ)
class UserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


# детальная по id (только админ)
class UserByIdView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


# смена пароля
class ResetPasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not request.user.check_password(old_password):
            return Response({"error": "Старый пароль неверный"}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save()
        return Response({"message": "Пароль изменён"}, status=status.HTTP_200_OK)


# текущий пользователь
class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# удаление аккаунта
class DeleteUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        request.user.delete()
        return Response({"message": "Аккаунт удалён"}, status=status.HTTP_204_NO_CONTENT)
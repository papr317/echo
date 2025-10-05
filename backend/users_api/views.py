from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.db.models import Q

from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer

# Вход пользователя с JWT
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        учётные_данные = request.data.get("credential")
        пароль = request.data.get("password")

        # Проверяем, что данные для входа предоставлены
        if not учётные_данные or not пароль:
            return Response(
                {"ошибка": "Необходимо указать учётные данные и пароль"},
                status=status.HTTP_400_BAD_REQUEST
            )

        пользователь = None

        # Ищем пользователя по имени, email или номеру телефона
        try:
            пользователь = CustomUser.objects.get(
                Q(username=учётные_данные) | 
                Q(email=учётные_данные) | 
                Q(phone=учётные_данные)
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"ошибка": "Неверные учётные данные"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Безопасно проверяем пароль, используя встроенный метод
        if пользователь and пользователь.check_password(пароль):
            refresh = RefreshToken.for_user(пользователь)
            return Response({
                "сообщение": "Успешный вход",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "пользователь": UserSerializer(пользователь).data
            }, status=status.HTTP_200_OK)

        return Response({"ошибка": "Неверные учётные данные"}, status=status.HTTP_400_BAD_REQUEST)

# Регистрация пользователя с JWT
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        пользователь = serializer.save()
        
        # Генерируем JWT токены для нового пользователя
        refresh = RefreshToken.for_user(пользователь)
        
        return Response({
            'пользователь': UserSerializer(пользователь).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

# Выход (с JWT обычно делается на клиенте)
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({"сообщение": "Вы успешно вышли"}, status=status.HTTP_200_OK)

# Список пользователей (только для админа)
class UserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

# Детальная информация по пользователю по id (только для админа)
class UserByIdView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

# Смена пароля
class ResetPasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        старый_пароль = request.data.get("old_password")
        новый_пароль = request.data.get("new_password")

        # Проверяем, что старый пароль совпадает
        if not request.user.check_password(старый_пароль):
            return Response({"ошибка": "Старый пароль неверный"}, status=status.HTTP_400_BAD_REQUEST)

        # Устанавливаем новый пароль
        request.user.set_password(новый_пароль)
        request.user.save()
        return Response({"сообщение": "Пароль изменён"}, status=status.HTTP_200_OK)

# Текущий пользователь (просмотр и изменение)
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

# Удаление аккаунта
class DeleteUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        request.user.delete()
        return Response({"сообщение": "Аккаунт удалён"}, status=status.HTTP_204_NO_CONTENT)
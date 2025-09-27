from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView 
from django.utils import timezone
from django.db.models import Q
from django.db import transaction 
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType 
from datetime import timedelta
from django.conf import settings 

from .models import Post, Comment, Echo 
# !!! Убедитесь, что EchoSerializer создан и импортирован здесь
from .serializers import PostSerializer, CommentSerializer, EchoSerializer 


# --- View для проверки владения (Разрешает редактирование/удаление, только если вы автор) ---
class IsAuthorOrReadOnly(permissions.BasePermission):
    """Разрешение: разрешает полный доступ автору, остальным - только чтение."""
    def has_object_permission(self, request, view, obj):
        # Разрешение на GET, HEAD или OPTIONS запросы
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Разрешение на запись/изменение дается только автору объекта
        return obj.author == request.user


# --- ЛЕНТЫ (FEED) ---

# 1. Общая лента всех живых постов 
class PostListView(generics.ListCreateAPIView):
    """GET: Список всех живых постов. POST: Создание нового поста."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(expires_at__gt=timezone.now()).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


# 2. Детали поста (ТОЛЬКО ПРОСМОТР)
class PostDetailView(generics.RetrieveAPIView): 
    """Просмотр деталей поста. Нельзя редактировать или удалять."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Post.objects.all()
        return Post.objects.filter(expires_at__gt=timezone.now())


# 3. Лента друзей (Используется в /feed/friends/)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def friend_feed(request):
    # TODO: Реализовать логику друзей
    posts = Post.objects.filter(expires_at__gt=timezone.now()).order_by('-created_at')
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)
    
    
# 4. Лента Абсурдных Комментариев (Floating) (Используется в /feed/floating/)
class FloatingCommentListView(generics.ListAPIView):
    """
    Показывает все комментарии, которые были оторваны от своих постов (is_floating=True).
    """
    serializer_class = CommentSerializer 
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(is_floating=True).order_by('-created_at')


# --- ЛИЧНЫЕ ОПЕРАЦИИ (MY) ---

class MyPostDetailView(generics.RetrieveAPIView): 
    """Просмотр своего поста. Нельзя редактировать или удалять."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(author=self.request.user)


class MyCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Просмотр, изменение (PUT/PATCH) и удаление (DELETE) СВОИХ комментариев.
    Использует IsAuthorOrReadOnly.
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]

    def get_queryset(self):
        return Comment.objects.filter(author=self.request.user)
        
        
class MyEchoListView(generics.ListAPIView):
    """Список всех Echo/DisEcho, которые поставил текущий пользователь."""
    serializer_class = EchoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Echo.objects.filter(user=self.request.user).order_by('-created_at')


# Комментарии к посту
class CommentListView(generics.ListCreateAPIView):
    """GET: Список комментариев. POST: Создание комментария."""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        post_id = self.kwargs['post_id']
        # Здесь мы намеренно не фильтруем по is_floating, т.к. этот View
        # используется для комментариев, прикрепленных к живому посту.
        return Comment.objects.filter(post_id=post_id).order_by('-created_at')
        
    def perform_create(self, serializer):
        post_id = self.kwargs['post_id']
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            raise Response({"error": "Пост не найден"}, status=status.HTTP_404_NOT_FOUND)
        
        if post.is_expired() and not self.request.user.is_staff:
            raise Response(
                {"error": "Нельзя комментировать истекший пост"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(author=self.request.user, post=post)


class EchoToggleView(APIView):
    """
    POST: Переключает (ставит, отменяет или меняет) оценку Echo/DisEcho 
    для заданного поста или комментария.
    is_echo определяется через URL (is_echo_url_param).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, content_type_model, is_echo_url_param=None): 
        
        user = request.user
        is_echo = is_echo_url_param 
        
        if content_type_model == 'post':
            Model = Post
        elif content_type_model == 'comment':
            Model = Comment
        else:
            return Response(
                {"error": "Недопустимый тип контента. Должен быть 'post' или 'comment'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        content_object = get_object_or_404(Model, pk=pk)
        
        # Проверка на истечение срока жизни (логика не меняется)
        if content_object.is_expired() and not user.is_staff:
            return Response(
                {"error": f"{content_type_model.capitalize()} истек и не может быть оценен."},
                status=status.HTTP_400_BAD_REQUEST
            )

        content_type = ContentType.objects.get_for_model(Model)

        with transaction.atomic():
            existing_echo = Echo.objects.filter(
                user=user, 
                content_type=content_type, 
                object_id=content_object.pk
            ).first()

            
            # Сценарий 1: Отмена (удаление) оценки (Echo/DisEcho уже стоит и пользователь нажимает его снова)
            if existing_echo and existing_echo.is_echo == is_echo:
                if is_echo:
                    content_object.echo_count -= 1
                    content_object.expires_at -= timedelta(hours=settings.ECHO_EXTEND_HOURS)
                else:
                    content_object.disecho_count -= 1
                    content_object.expires_at += timedelta(hours=settings.DISECHO_REDUCE_HOURS)
                
                existing_echo.delete()
                # ...
                
            elif existing_echo and existing_echo.is_echo != is_echo:
                
                # 1. Откатываем старую оценку
                if existing_echo.is_echo:
                    content_object.echo_count -= 1
                    content_object.expires_at -= timedelta(hours=settings.ECHO_EXTEND_HOURS)
                else:
                    content_object.disecho_count -= 1
                    content_object.expires_at += timedelta(hours=settings.DISECHO_REDUCE_HOURS)

                # 2. Применяем новую оценку
                existing_echo.is_echo = is_echo
                if is_echo:
                    content_object.echo_count += 1
                    content_object.expires_at += timedelta(hours=settings.ECHO_EXTEND_HOURS)
                else:
                    content_object.disecho_count += 1
                    content_object.expires_at -= timedelta(hours=settings.DISECHO_REDUCE_HOURS)
                
                existing_echo.save()
                # ...

            # Сценарий 3: Создание новой оценки (ничего не стояло)
            else:
                Echo.objects.create(
                    user=user,
                    content_type=content_type,
                    object_id=content_object.pk,
                    is_echo=is_echo
                )
                
                if is_echo:

                    content_object.echo_count += 1
                    content_object.expires_at += timedelta(hours=settings.ECHO_EXTEND_HOURS) 
                else:
                    content_object.disecho_count += 1
                    content_object.expires_at -= timedelta(hours=settings.DISECHO_REDUCE_HOURS)
                    
            content_object.save(update_fields=['echo_count', 'disecho_count', 'expires_at'])

            if content_type_model == 'post':
                serializer = PostSerializer(content_object)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:

                return Response({
                    "echo_count": content_object.echo_count,
                    "disecho_count": content_object.disecho_count,
                    "expires_at": content_object.expires_at,

                }, status=status.HTTP_200_OK)

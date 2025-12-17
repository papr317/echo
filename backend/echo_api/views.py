from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import APIException 
from rest_framework.views import APIView 
from django.utils import timezone
from django.db.models import Q
from django.db import transaction 
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType 
from datetime import timedelta
from django.conf import settings 

from .models import Post, Comment, Echo 
from .serializers import PostSerializer, CommentSerializer, EchoSerializer

class IsAuthorOrReadOnly(permissions.BasePermission):
    """Разрешение: разрешает полный доступ автору, остальным - только чтение."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return obj.author == request.user

# -------------------- Post Views --------------------

class PostListView(generics.ListCreateAPIView):
    """GET: Список всех живых постов. POST: Создание нового поста."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Только живые посты
        return Post.objects.filter(expires_at__gt=timezone.now()).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class PostDetailView(generics.RetrieveAPIView): 
    """Просмотр деталей поста. Нельзя редактировать или удалять."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Показываем только живые посты
        if self.request.user.is_staff:
            return Post.objects.all()
        return Post.objects.filter(expires_at__gt=timezone.now())


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def friend_feed(request):
    """Лента друзей (заглушка)"""
    posts = Post.objects.filter(expires_at__gt=timezone.now()).order_by('-created_at')
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)
    
# -------------------- Floating Comment View --------------------
class FloatingCommentListView(generics.ListAPIView):
    """
    Показывает все комментарии, которые были оторваны от своих постов (is_floating=True)
    и которые еще не истекли.
    """
    serializer_class = CommentSerializer 
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(
            is_floating=True,
            # Плавающий комментарий исчезает, когда истекает его время жизни
            expires_at__gt=timezone.now() 
        ).order_by('-created_at')

# -------------------- My Views (для профиля) --------------------
class MyPostListView(generics.ListAPIView):
    """Список всех постов, созданных текущим пользователем (даже если они истекли)."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Показываем все посты пользователя, независимо от expires_at
        return Post.objects.filter(author=self.request.user).order_by('-created_at')

class MyCommentListActiveView(generics.ListAPIView): # ✅ НОВЫЙ КЛАСС
    """Список всех комментариев, созданных текущим пользователем (только 'живые' и 'плавающие')."""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Показываем все комментарии пользователя, которые еще не истекли
        # (они могут быть прикреплены к посту или быть плавающими)
        return Comment.objects.filter(
            author=self.request.user, 
            expires_at__gt=timezone.now()
        ).order_by('-created_at')

class UserPostListView(generics.ListAPIView):
    """Список всех постов, созданных указанным пользователем (даже если они истекли)."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        # Показываем все посты пользователя, независимо от expires_at
        return Post.objects.filter(author_id=user_id).order_by('-created_at')

class UserCommentListActiveView(generics.ListAPIView):
    """Список всех активных комментариев, созданных указанным пользователем."""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        # Показываем все комментарии пользователя, которые еще не истекли
        return Comment.objects.filter(
            author_id=user_id,
            expires_at__gt=timezone.now()
        ).order_by('-created_at')

class MyPostDetailView(generics.RetrieveAPIView): 
    """Просмотр своего поста."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(author=self.request.user)


class MyCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Просмотр, изменение (PUT/PATCH) и удаление (DELETE) СВОИХ комментариев.
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

# -------------------- Comment Views --------------------

class CommentListView(generics.ListCreateAPIView):
    """GET: Список комментариев. POST: Создание комментария."""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        post_id = self.kwargs['post_id']
        # Показываем только комментарии, привязанные к посту и не плавающие
        return Comment.objects.filter(
            post_id=post_id,
            is_floating=False 
        ).order_by('-created_at')
        
    def perform_create(self, serializer):
        post_id = self.kwargs['post_id']
        parent_comment_id = self.request.data.get('parent_comment_id') 
        
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            raise APIException({"error": "Пост не найден"}, code=status.HTTP_404_NOT_FOUND)

        # Нельзя комментировать истекший пост
        if post.is_expired() and not self.request.user.is_staff:
            raise APIException(
                {"error": "Нельзя комментировать истекший пост"},
                code=status.HTTP_400_BAD_REQUEST
            )
        
        parent_comment = None
        if parent_comment_id:
            try:
                # Ищем родительский комментарий, привязанный к этому посту
                parent_comment = Comment.objects.get(id=parent_comment_id, post=post)
            except Comment.DoesNotExist:
                raise APIException({"error": "Родительский комментарий не найден или не принадлежит этому посту"}, code=status.HTTP_400_BAD_REQUEST)
            
            if parent_comment.is_floating:
                raise APIException({"error": "Нельзя ответить на плавающий комментарий."}, code=status.HTTP_400_BAD_REQUEST)


        serializer.save(
            author=self.request.user, 
            post=post, 
            is_floating=False,
            parent_comment=parent_comment
        )

# -------------------- Echo/DisEcho Toggle View --------------------

class EchoToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_time_deltas(self, content_type_model):
        if content_type_model == 'post':
            extend_hours = settings.ECHO_EXTEND_HOURS
            reduce_hours = settings.DISECHO_REDUCE_HOURS
        else:
            extend_hours = settings.COMMENT_ECHO_EXTEND_HOURS
            reduce_hours = settings.COMMENT_DISECHO_REDUCE_HOURS
        
        return timedelta(hours=extend_hours), timedelta(hours=reduce_hours)
        
    def post(self, request, pk, content_type_model, is_echo_url_param): 
        
        user = request.user
        is_echo = is_echo_url_param 
        
        if content_type_model == 'post':
            Model = Post
            Serializer = PostSerializer
        elif content_type_model == 'comment':
            Model = Comment
            Serializer = CommentSerializer
        else:
            return Response(
                {"error": "Недопустимый тип контента. Должен быть 'post' или 'comment'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        content_object = get_object_or_404(Model, pk=pk)
        
        if content_object.is_expired() and not user.is_staff:
            return Response(
                {"error": f"{content_type_model.capitalize()} истек и не может быть оценен."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if content_type_model == 'comment' and content_object.is_floating:
              return Response(
                {"error": "Нельзя оценивать плавающий комментарий, так как он оторван от поста."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        content_type = ContentType.objects.get_for_model(Model)
        
        echo_delta, disecho_delta = self.get_time_deltas(content_type_model)

        with transaction.atomic():
            existing_echo = Echo.objects.select_for_update().filter(
                user=user, 
                content_type=content_type, 
                object_id=content_object.pk
            ).first()

            # Сценарий 1: Отмена (удаление) оценки
            if existing_echo and existing_echo.is_echo == is_echo:
                if is_echo:
                    content_object.echo_count -= 1
                    content_object.expires_at -= echo_delta
                else:
                    content_object.disecho_count -= 1
                    content_object.expires_at += disecho_delta 
                
                existing_echo.delete()
                
            # Сценарий 2: Смена оценки (Echo -> DisEcho или наоборот)
            elif existing_echo and existing_echo.is_echo != is_echo:
                
                # 1. Откатываем старую оценку
                if existing_echo.is_echo:
                    content_object.echo_count -= 1
                    content_object.expires_at -= echo_delta
                else:
                    content_object.disecho_count -= 1
                    content_object.expires_at += disecho_delta

                # 2. Применяем новую оценку
                existing_echo.is_echo = is_echo
                if is_echo:
                    content_object.echo_count += 1
                    content_object.expires_at += echo_delta
                else:
                    content_object.disecho_count += 1
                    content_object.expires_at -= disecho_delta
                
                existing_echo.save()
                
            # Сценарий 3: Создание новой оценки
            else:
                Echo.objects.create(
                    user=user,
                    content_type=content_type,
                    object_id=content_object.pk,
                    is_echo=is_echo
                )
                
                if is_echo:
                    content_object.echo_count += 1
                    content_object.expires_at += echo_delta 
                else:
                    content_object.disecho_count += 1
                    content_object.expires_at -= disecho_delta
                        
            content_object.save(update_fields=['echo_count', 'disecho_count', 'expires_at', 'updated_at'])

            return Response(Serializer(content_object).data, status=status.HTTP_200_OK)
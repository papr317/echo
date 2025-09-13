from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from django.db.models import Q
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer

# Все посты (лента) - только неистекшие
class PostListView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Только неистекшие посты для всех пользователей
        return Post.objects.filter(expires_at__gt=timezone.now()).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

# Детали поста - разная логика для админов и обычных пользователей
class PostDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Админы видят все посты, обычные пользователи - только неистекшие
        if self.request.user.is_staff:
            return Post.objects.all()
        return Post.objects.filter(expires_at__gt=timezone.now())

# Комментарии к посту - всегда видны все комментарии
class CommentListView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        post_id = self.kwargs['post_id']
        # Все комментарии поста, даже если пост истек
        return Comment.objects.filter(post_id=post_id).order_by('-created_at')
        
    def perform_create(self, serializer):
        post_id = self.kwargs['post_id']
        post = Post.objects.get(id=post_id)
        
        # Проверяем, можно ли комментировать этот пост
        if post.is_expired() and not self.request.user.is_staff:
            return Response(
                {"error": "Нельзя комментировать истекший пост"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(author=self.request.user, post=post)

# Лайк поста - только для неистекших постов
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_echo(request, pk):
    try:
        post = Post.objects.get(pk=pk)
        if post.is_expired() and not request.user.is_staff:
            return Response({"error": "Пост истек"}, status=status.HTTP_400_BAD_REQUEST)
        
        post.add_echo()
        return Response({"message": "Лайк добавлен", "echo_count": post.echo_count})
    
    except Post.DoesNotExist:
        return Response({"error": "Пост не найден"}, status=status.HTTP_404_NOT_FOUND)

# Дизлайк поста - только для неистекших постов
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_disecho(request, pk):
    try:
        post = Post.objects.get(pk=pk)
        if post.is_expired() and not request.user.is_staff:
            return Response({"error": "Пост истек"}, status=status.HTTP_400_BAD_REQUEST)
        
        post.add_disecho()
        return Response({"message": "Дизлайк добавлен", "disecho_count": post.disecho_count})
    
    except Post.DoesNotExist:
        return Response({"error": "Пост не найден"}, status=status.HTTP_404_NOT_FOUND)

# Лента друзей - только неистекшие посты
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def friend_feed(request):
    # TODO: Реализовать логику друзей
    posts = Post.objects.filter(expires_at__gt=timezone.now()).order_by('-created_at')
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)
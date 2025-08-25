from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count
from .models import Post, Echo, Friendship
from .serializers import PostSerializer, EchoSerializer, FriendshipSerializer

# Посты
class PostListView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Только неистекшие посты
        return Post.objects.filter(expires_at__gt=timezone.now()).annotate(
            echoes_count=Count('echoes')
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Можно смотреть истекшие посты, но только свои
        return Post.objects.filter(
            Q(author=self.request.user) | Q(expires_at__gt=timezone.now())
        )

# Эхо (лайки/репосты)
class EchoCreateView(generics.CreateAPIView):
    serializer_class = EchoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        post = serializer.validated_data['post']
        # Проверяем, что пост не истек
        if post.is_expired():
            return Response(
                {"error": "Пост истек"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, не делал ли уже пользователь эхо
        if Echo.objects.filter(post=post, user=self.request.user).exists():
            return Response(
                {"error": "Вы уже сделали эхо этому посту"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(user=self.request.user)

class EchoDeleteView(generics.DestroyAPIView):
    queryset = Echo.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Echo.objects.filter(user=self.request.user)

# Друзья
class FriendshipListView(generics.ListAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Friendship.objects.filter(
            Q(from_user=self.request.user) | Q(to_user=self.request.user)
        )

class FriendshipCreateView(generics.CreateAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        to_user = serializer.validated_data['to_user']
        
        # Нельзя отправить запрос самому себе
        if to_user == self.request.user:
            return Response(
                {"error": "Нельзя отправить запрос самому себе"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, не существует ли уже запрос
        if Friendship.objects.filter(
            Q(from_user=self.request.user, to_user=to_user) |
            Q(from_user=to_user, to_user=self.request.user)
        ).exists():
            return Response(
                {"error": "Запрос на дружбу уже существует"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(from_user=self.request.user)

class FriendshipUpdateView(generics.UpdateAPIView):
    queryset = Friendship.objects.all()
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Можно обновлять только входящие запросы
        return Friendship.objects.filter(to_user=self.request.user)

# Лента постов друзей
class FeedView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Получаем ID друзей
        friends = Friendship.objects.filter(
            Q(from_user=self.request.user) | Q(to_user=self.request.user),
            status='accepted'
        ).values_list('from_user_id', 'to_user_id')
        
        friend_ids = set()
        for from_id, to_id in friends:
            friend_ids.add(from_id)
            friend_ids.add(to_id)
        friend_ids.discard(self.request.user.id)
        
        # Посты друзей + свои посты
        return Post.objects.filter(
            Q(author_id__in=friend_ids) | Q(author=self.request.user),
            expires_at__gt=timezone.now()
        ).annotate(echoes_count=Count('echoes')).order_by('-created_at')
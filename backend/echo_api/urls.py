from django.urls import path
from . import views

urlpatterns = [
    # Посты
    path('posts/', views.PostListView.as_view(), name='post_list'),
    path('posts/<int:pk>/', views.PostDetailView.as_view(), name='post_detail'),
    
    # Лайк/дизлайк
    path('posts/<int:pk>/echo/', views.add_echo, name='add_echo'),
    path('posts/<int:pk>/disecho/', views.add_disecho, name='add_disecho'),
    
    # Комментарии
    path('posts/<int:post_id>/comments/', views.CommentListView.as_view(), name='comment_list'),
    
    # Лента
    path('feed/', views.friend_feed, name='friend_feed'),
]
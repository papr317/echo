from django.urls import path
from . import views

urlpatterns = [
    # Посты
    path('posts/', views.PostListView.as_view(), name='post_list'),
    path('posts/<int:pk>/', views.PostDetailView.as_view(), name='post_detail'),
    
    # Эхо
    path('echoes/', views.EchoCreateView.as_view(), name='echo_create'),
    path('echoes/<int:pk>/', views.EchoDeleteView.as_view(), name='echo_delete'),
    
    # Друзья
    path('friends/', views.FriendshipListView.as_view(), name='friendship_list'),
    path('friends/requests/', views.FriendshipCreateView.as_view(), name='friendship_create'),
    path('friends/requests/<int:pk>/', views.FriendshipUpdateView.as_view(), name='friendship_update'),
    
    # Лента
    path('feed/', views.FeedView.as_view(), name='feed'),
]
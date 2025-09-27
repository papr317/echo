# echo_api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # --- ЛИЧНЫЕ ОБЪЕКТЫ --- 
    # GET/PUT/PATCH/DELETE: Редактирование и удаление СВОЕГО поста
    path('my/posts/<int:pk>/', views.MyPostDetailView.as_view(), name='my_post_detail'),
    # GET/PUT/PATCH/DELETE: Редактирование и удаление СВОЕГО комментария
    path('my/comments/<int:pk>/', views.MyCommentDetailView.as_view(), name='my_comment_detail'),
    # GET: Список всех поставленных мной Echo/DisEcho
    path('my/echos/', views.MyEchoListView.as_view(), name='my_echos'),
    
    # --- ГЛАВНЫЕ ЛЕНТЫ ---
    # 1. Общая лента всех живых постов
    path('feed/posts/', views.PostListView.as_view(), name='feed_all_posts'),
    # 2. Лента "Плавучих" Комментариев
    path('feed/floating/', views.FloatingCommentListView.as_view(), name='feed_floating_comments'),
    # 3. Лента друзей
    path('feed/friends/', views.friend_feed, name='feed_friends'),
    
    # --- БАЗОВЫЕ ОПЕРАЦИИ ---
    # GET: Детали любого поста (остаётся для получения отдельного поста по ID)
    path('posts/<int:pk>/', views.PostDetailView.as_view(), name='post_detail'),
    
    # GET/POST: Комментарии к конкретному посту
    path('posts/<int:post_id>/comments/', views.CommentListView.as_view(), name='comment_list'),
    
    # POST: Оценки (Echo/DisEcho)
    path('posts/<int:pk>/echo/', 
         views.EchoToggleView.as_view(), 
         {'content_type_model': 'post'}, name='post_echo_toggle'),
         
    path('comments/<int:pk>/echo/', 
         views.EchoToggleView.as_view(), 
         {'content_type_model': 'comment'}, name='comment_echo_toggle'),
]
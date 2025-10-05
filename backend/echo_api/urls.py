from django.urls import path
from . import views

urlpatterns = [
    # -------------------- ЛИЧНЫЕ ОБЪЕКТЫ (для профиля) --------------------
    
    # GET: Список всех своих постов
    path('my/posts/', views.MyPostListView.as_view(), name='my_post_list'),
    
    # GET: Список всех своих активных комментариев
    path('my/comments/active/', views.MyCommentListActiveView.as_view(), name='my_comment_list_active'),
    
    # GET: Детали своего поста
    path('my/posts/<int:pk>/', views.MyPostDetailView.as_view(), name='my_post_detail'),
    
    # GET/PUT/PATCH/DELETE: СВОЙ комментарий
    path('my/comments/<int:pk>/', views.MyCommentDetailView.as_view(), name='my_comment_detail'),
    
    # GET: Список всех поставленных мной Echo/DisEcho
    path('my/echos/', views.MyEchoListView.as_view(), name='my_echos'),
    
    # -------------------- ГЛАВНЫЕ ЛЕНТЫ --------------------
    
    # 1. Общая лента всех живых постов
    path('feed/posts/', views.PostListView.as_view(), name='feed_all_posts'),
    
    # 2. Лента "Плавучих" Комментариев
    path('feed/floating/', views.FloatingCommentListView.as_view(), name='feed_floating_comments'),
    
    # 3. Лента друзей
    path('feed/friends/', views.friend_feed, name='feed_friends'),
    
    # -------------------- БАЗОВЫЕ ОПЕРАЦИИ --------------------
    
    path('posts/', views.PostListView.as_view(), name='post_list_create'),
    
    # GET: Детали любого поста
    path('posts/<int:pk>/', views.PostDetailView.as_view(), name='post_detail'),
    
    # GET/POST: Комментарии к конкретному посту
    path('posts/<int:post_id>/comments/', views.CommentListView.as_view(), name='comment_list'),
    
    # -------------------- ОЦЕНКИ ПОСТОВ --------------------
    
    # POST: Echo поста (is_echo=True)
    path('posts/<int:pk>/echo/', 
         views.EchoToggleView.as_view(), 
         {'content_type_model': 'post', 'is_echo_url_param': True}, name='post_echo_toggle'),
      
    # POST: DisEcho поста (is_echo=False)
    path('posts/<int:pk>/disecho/', 
         views.EchoToggleView.as_view(), 
         {'content_type_model': 'post', 'is_echo_url_param': False}, name='post_disecho_toggle'),
               
    # -------------------- ОЦЕНКИ КОММЕНТАРИЕВ --------------------
    
    # POST: Echo комментария (is_echo=True)
    path('comments/<int:pk>/echo/', 
         views.EchoToggleView.as_view(), 
         {'content_type_model': 'comment', 'is_echo_url_param': True}, name='comment_echo_toggle'),
            
    # POST: DisEcho комментария (is_echo=False)
    path('comments/<int:pk>/disecho/', 
         views.EchoToggleView.as_view(), 
         {'content_type_model': 'comment', 'is_echo_url_param': False}, name='comment_disecho_toggle'),
]
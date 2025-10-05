from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ChatListView, MessageListView, MemberManagementViewSet, FriendshipViewSet, UserSearchView, search_users

app_name = 'messenger_api'


router = DefaultRouter()
# 1. Friendship ViewSet
router.register(r'friends', FriendshipViewSet, basename='friendship')



urlpatterns = [
    # Список чатов
    path('chats/', ChatListView.as_view(), name='chat-list'),
         
    # Сообщения внутри конкретного чата
    path('chats/<int:chat_id>/messages/', MessageListView.as_view(), name='message-list'),
    
    # МАРШРУТЫ ДЛЯ УПРАВЛЕНИЯ УЧАСТНИКАМИ И АДМИНАМИ
    path('chats/<int:pk>/members/add/', 
         MemberManagementViewSet.as_view({'post': 'add_member'}), 
         name='chat-member-add'),
         
    path('chats/<int:pk>/members/remove/', 
         MemberManagementViewSet.as_view({'post': 'remove_member'}), 
         name='chat-member-remove'),
         
    path('chats/<int:pk>/admin/set/', 
         MemberManagementViewSet.as_view({'post': 'set_admin'}), 
         name='chat-admin-set'),
         
    path('chats/<int:pk>/admin/remove/', 
         MemberManagementViewSet.as_view({'post': 'remove_admin'}), 
         name='chat-admin-remove'),
         
      # Добавление нескольких участников сразу
    path('chats/<int:pk>/members/add-multiple/', 
         MemberManagementViewSet.as_view({'post': 'add_multiple_members'}), 
         name='chat-members-add-multiple'),
         
    path('users/search/', 
         search_users, 
         name='users-search'),
]
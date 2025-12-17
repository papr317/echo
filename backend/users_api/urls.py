from django.urls import path
from .views import (
    LoginView, RegisterView, LogoutView, UserListView, 
    UserByIdView, ResetPasswordView, UserDetailView,
    DeleteUserView, UserSearchView, CheckNicknameView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('reset_password/', ResetPasswordView.as_view(), name='reset_password'),

    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>', UserByIdView.as_view(), name='user_by_id'),
    path ('user_detail/', UserDetailView.as_view(), name='user_detail'),
    path('me/', UserDetailView.as_view(), name='me'),
    path('delete/', DeleteUserView.as_view(), name='delete'),
    
    # поиск
    path('search/', UserSearchView.as_view(), name='user-search'),

    path('check-nickname/', CheckNicknameView.as_view(), name='check-nickname'),
]


from django.urls import path
from .views import ResetPasswordView, RegisterView, LoginView, LogoutView, UserByIdView, UserDetailView, DeleteUserView, UserListView, UserSearchView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
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

    # JWT энд поинты
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

]


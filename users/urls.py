from django.urls import path
from .views import register_page, login_page, reset_password, user_list, accept_policy_page, delete_user_page

urlpatterns = [    
    path('users/', user_list, name='user_list'),
    
    path('register/', register_page, name='register_page'),
    path('login/', login_page, name='login_page'),
    path('reset_password/', reset_password, name='reset_password'),
    path('accept/', accept_policy_page, name='accept_policy_page'),
    path('delete/', delete_user_page, name='delete_user_page'),
]

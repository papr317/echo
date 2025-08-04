from django.urls import path
from . import views

urlpatterns = [
  path('', views.echo, name='echo'),
  path('profile_page/', views.profile_page, name='profile_page'),  # Example path for user account
]

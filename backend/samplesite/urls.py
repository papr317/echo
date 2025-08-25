from django.urls import include
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('echo_api/', include('echo_api.urls')),
    path('users_api/', include('users_api.urls')),
]

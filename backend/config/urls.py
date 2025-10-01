from django.urls import include
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('echo_api/', include('backend.echo_api.urls')),
    path('users_api/', include('backend.users_api.urls')),
    path('messenger_api/', include('backend.messenger_api.urls')),
]

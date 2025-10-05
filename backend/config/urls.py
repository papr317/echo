from django.urls import include
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('echo_api/', include('backend.echo_api.urls')),
    path('users_api/', include('backend.users_api.urls')),
    path('messenger_api/', include('backend.messenger_api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
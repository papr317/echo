from django.contrib import admin


from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.decorators import login_required
# from echo_api.views import echo_api
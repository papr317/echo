from django.shortcuts import render, redirect
from django.urls import reverse
from .models import CustomUser
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login
from .serializers import RegisterSerializer


def user_list(request):
    users = CustomUser.objects.all()
    return render(request, 'user_list.html', {'users': users})

def register_page(request):
    if request.method == 'POST':
        serializer = RegisterSerializer(data=request.POST)
        if serializer.is_valid():
            serializer.save()
            return redirect(reverse('echo'))
    return render(request, 'register.html')

def login_page(request):
    if request.method == 'POST':
        user = authenticate(username=request.POST['username'], password=request.POST['password'])
        if user:
            login(request, user)
            return redirect(reverse('echo'))
    return render(request, 'login.html')
  
from django.shortcuts import render, redirect
from django.urls import reverse

def reset_password(request):
    if request.method == 'POST':
        # Logic for resetting password goes here
        return redirect(reverse('login_page'))      
    return render(request, 'reset_password.html')


def accept_policy_page(request):
    if request.method == 'POST' and request.user.is_authenticated:
        request.user.accepted_privacy_policy = True
        request.user.save()
        return redirect('user_list')
    return render(request, 'accept_policy.html')

def delete_user_page(request):
    if request.method == 'POST' and request.user.is_authenticated:
        request.user.delete()
        return redirect('register_page')
    return render(request, 'delete_user.html')

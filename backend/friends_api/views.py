from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Friend
from .serializers import FriendSerializer

class FriendViewSet(viewsets.ModelViewSet):
    queryset = Friend.objects.all()
    serializer_class = FriendSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Friend.objects.filter(sender=user) | Friend.objects.filter(receiver=user)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        friend = self.get_object()
        if friend.receiver != request.user:
            return Response({'detail': 'Нет доступа'}, status=status.HTTP_403_FORBIDDEN)
        friend.status = 'accepted'
        friend.save()
        return Response(self.get_serializer(friend).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        friend = self.get_object()
        if friend.receiver != request.user:
            return Response({'detail': 'Нет доступа'}, status=status.HTTP_403_FORBIDDEN)
        friend.status = 'rejected'
        friend.save()
        return Response(self.get_serializer(friend).data)


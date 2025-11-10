from django.contrib import admin
from .models import Friend

@admin.register(Friend)
class FriendAdmin(admin.ModelAdmin):
    """
    Админка для модели Friend (запросы на дружбу)
    """
    list_display = ('id', 'sender', 'receiver', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at', 'updated_at')
    search_fields = ('sender__username', 'sender__email', 'receiver__username', 'receiver__email')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Информация о запросе', {
            'fields': ('sender', 'receiver', 'status')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # Добавляем действия для массового изменения статуса
    actions = ['make_accepted', 'make_rejected', 'make_pending']
    
    def make_accepted(self, request, queryset):
        queryset.update(status='accepted')
    make_accepted.short_description = "Изменить статус на 'Подтверждено'"
    
    def make_rejected(self, request, queryset):
        queryset.update(status='rejected')
    make_rejected.short_description = "Изменить статус на 'Отклонено'"
    
    def make_pending(self, request, queryset):
        queryset.update(status='pending')
    make_pending.short_description = "Изменить статус на 'Ожидает подтверждения'"
    
    # Оптимизация запросов для отображения в списке
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('sender', 'receiver')

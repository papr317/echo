from django.contrib import admin
from .models import Chat

@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    """
    Админка для модели Chat
    """
    list_display = ('id', 'name', 'is_group', 'participants_count', 'owner', 'last_message_preview', 'created_at')
    list_filter = ('is_group', 'created_at', 'owner')
    search_fields = ('name', 'participants__username', 'owner__username', 'last_message_text')
    readonly_fields = ('created_at', 'last_message_date')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    filter_horizontal = ('participants', 'administrators')
    
    def participants_count(self, obj):
        return obj.participants.count()
    participants_count.short_description = "Количество участников"
    
    def last_message_preview(self, obj):
        if obj.last_message_text:
            return obj.last_message_text[:50] + "..." if len(obj.last_message_text) > 50 else obj.last_message_text
        return "Нет сообщений"
    last_message_preview.short_description = "Последнее сообщение"
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'is_group', 'owner', 'avatar')
        }),
        ('Участники', {
            'fields': ('participants', 'administrators'),
            'description': 'Выберите участников чата и администраторов (если это групповой чат)'
        }),
        ('Последнее сообщение', {
            'fields': ('last_message_text', 'last_message_date'),
            'classes': ('collapse',)
        }),
        ('Временные метки', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    # Оптимизация запросов для отображения в списке
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('owner').prefetch_related('participants', 'administrators')
    
    # Добавляем действия для управления чатами
    actions = ['make_group_chats', 'make_private_chats']
    
    def make_group_chats(self, request, queryset):
        queryset.update(is_group=True)
    make_group_chats.short_description = "Пометить как групповые чаты"
    
    def make_private_chats(self, request, queryset):
        queryset.update(is_group=False)
    make_private_chats.short_description = "Пометить как личные чаты"
    
    # Настройка формы редактирования
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # Ограничиваем выбор владельца только участниками чата при редактировании
        if obj:
            form.base_fields['owner'].queryset = obj.participants.all()
        return form

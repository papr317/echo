from django.contrib import admin
from .models import Post, Comment, Echo

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """
    Админка для модели Post
    """
    list_display = ('id', 'author', 'content_preview', 'created_at', 'expires_at', 'echo_count', 'disecho_count', 'is_floating')
    list_filter = ('is_floating', 'created_at', 'expires_at', 'author')
    search_fields = ('content', 'author__username', 'author__email')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    
    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_preview.short_description = "Содержание (превью)"
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('author', 'content', 'image')
        }),
        ('Статистика', {
            'fields': ('echo_count', 'disecho_count', 'is_floating')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at', 'expires_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """
    Админка для модели Comment
    """
    list_display = ('id', 'author', 'post_preview', 'text_preview', 'created_at', 'is_floating', 'echo_count', 'disecho_count')
    list_filter = ('is_floating', 'created_at', 'author')
    search_fields = ('text', 'author__username', 'post__content')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    
    def post_preview(self, obj):
        if obj.post:
            return f"Пост #{obj.post.id}"
        return "Плавучий комментарий"
    post_preview.short_description = "Привязка"
    
    def text_preview(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
    text_preview.short_description = "Текст (превью)"
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('author', 'post', 'parent_comment', 'text')
        }),
        ('Статистика', {
            'fields': ('echo_count', 'disecho_count', 'is_floating')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'expires_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Echo)
class EchoAdmin(admin.ModelAdmin):
    """
    Админка для модели Echo
    """
    list_display = ('id', 'user', 'content_object', 'is_echo', 'created_at')
    list_filter = ('is_echo', 'created_at', 'user')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'content_type', 'object_id', 'content_object', 'is_echo')
        }),
        ('Временные метки', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Редактирование существующего объекта
            return self.readonly_fields + ('user', 'content_type', 'object_id', 'is_echo')
        return self.readonly_fields

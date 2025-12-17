from django.contrib import admin
from .models import CustomUser, NicknameDataset
from import_export.admin import ImportExportModelAdmin
from import_export import resources

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    """
    Админка для модели CustomUser
    """
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'gender')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone', 'nickname')
    ordering = ('-date_joined',)
    fieldsets = (
        (None, {
            'fields': ('username', 'email', 'first_name', 'last_name', 'phone', 'nickname')
        }),
        ('Права доступа', {
            'fields': ('is_staff', 'is_active', 'gender')
        }),
    )

class NicknameResource(resources.ModelResource):
    class Meta:
        model = NicknameDataset
        fields = ('nickname', 'language_type', 'is_toxic') 
        
        # ДОБАВЬТЕ ЭТУ СТРОКУ:
        # Указываем, что Django должен использовать 'nickname' как поле для идентификации/обновления
        import_id_fields = ('nickname',) 
        
        # Дополнительно: чтобы избежать конфликтов с id, который Django создает сам
        # exclude = ('id',) 
        skip_unchanged = True
        report_skipped = True
@admin.register(NicknameDataset)
class NicknameDatasetAdmin(ImportExportModelAdmin): 

    resource_class = NicknameResource    
    list_display = ('nickname', 'language_type', 'is_toxic', 'created_at')
    list_filter = ('is_toxic', 'language_type', 'created_at')
    search_fields = ('nickname',)
    list_editable = ('is_toxic',)
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Основная информация', {
            'fields': ('nickname', 'language_type', 'is_toxic')
        }),
        ('Метаданные', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'

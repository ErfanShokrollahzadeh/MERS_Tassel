from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('email', 'user', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('email', 'user__first_name', 'user__last_name')

from django.contrib import admin
from .models import SiteVisit, VisitorCount

@admin.register(SiteVisit)
class SiteVisitAdmin(admin.ModelAdmin):
    list_display = ('ip_address', 'page', 'visited_at')
    list_filter = ('visited_at', 'page')
    search_fields = ('ip_address', 'user_agent')
    readonly_fields = ('visited_at',)

@admin.register(VisitorCount)
class VisitorCountAdmin(admin.ModelAdmin):
    list_display = ('total_visits', 'unique_visitors', 'updated_at')
    readonly_fields = ('updated_at',)

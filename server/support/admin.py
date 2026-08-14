from django.contrib import admin
from .models import CannedResponse, Ticket, TicketMessage


class TicketMessageInline(admin.StackedInline):
    model = TicketMessage
    extra = 0


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['number', 'subject', 'customer_name', 'status', 'priority', 'assigned_to', 'updated_at']
    list_filter = ['status', 'priority']
    search_fields = ['number', 'subject', 'customer_name', 'customer_email']
    inlines = [TicketMessageInline]


admin.site.register(CannedResponse)

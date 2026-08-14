from django.conf import settings
from django.db import models
from django.utils import timezone
from commerce.models import Order


class Ticket(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        IN_PROGRESS = 'in_progress', 'In progress'
        RESOLVED = 'resolved', 'Resolved'

    class Priority(models.TextChoices):
        URGENT = 'urgent', 'Urgent'
        HIGH = 'high', 'High'
        NORMAL = 'normal', 'Normal'
        LOW = 'low', 'Low'

    number = models.CharField(max_length=24, unique=True)
    subject = models.CharField(max_length=220)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='tickets')
    customer_name = models.CharField(max_length=160)
    customer_email = models.EmailField()
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.SET_NULL, related_name='tickets')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    priority = models.CharField(max_length=12, choices=Priority.choices, default=Priority.NORMAL)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_tickets')
    sla_due_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']


class TicketMessage(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    body = models.TextField()
    is_internal = models.BooleanField(default=False)
    attachment = models.FileField(upload_to='support/attachments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class CannedResponse(models.Model):
    title = models.CharField(max_length=120)
    body = models.TextField()
    shortcut = models.CharField(max_length=40, unique=True)
    is_active = models.BooleanField(default=True)

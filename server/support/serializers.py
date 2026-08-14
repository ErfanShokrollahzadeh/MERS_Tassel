from rest_framework import serializers
from .models import CannedResponse, Ticket, TicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = ['id', 'author', 'author_name', 'body', 'is_internal', 'attachment', 'created_at']
        read_only_fields = ['author']

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username if obj.author else 'Customer'


class TicketSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    order_number = serializers.CharField(source='order.number', read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'number', 'subject', 'customer_name', 'customer_email', 'order', 'order_number', 'status', 'priority', 'assigned_to', 'sla_due_at', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['number']


class CannedResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CannedResponse
        fields = '__all__'

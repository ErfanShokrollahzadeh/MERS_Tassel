from rest_framework import serializers
from .models import CommerceEvent, VisitorCount

class VisitorCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorCount
        fields = ['total_visits', 'unique_visitors', 'updated_at']


class CommerceEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommerceEvent
        fields = ['event_name', 'session_id', 'order_number', 'source', 'properties', 'occurred_at']
        read_only_fields = ['occurred_at']

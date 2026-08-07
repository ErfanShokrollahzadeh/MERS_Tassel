from rest_framework import serializers
from .models import VisitorCount

class VisitorCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorCount
        fields = ['total_visits', 'unique_visitors', 'updated_at']

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .models import SiteVisit, VisitorCount
from .serializers import VisitorCountSerializer

class RecordVisitView(APIView):
    def post(self, request):
        # Extract IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')

        # Get request info
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        page = request.data.get('page', '/')
        referrer = request.data.get('referrer', '')

        # Log the visit
        SiteVisit.objects.create(
            ip_address=ip,
            user_agent=user_agent,
            page=page,
            referrer=referrer
        )

        # Increment total counter
        counter = VisitorCount.increment(ip_address=ip)
        
        # Calculate recent stats (e.g. last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        monthly_visits = SiteVisit.objects.filter(visited_at__gte=thirty_days_ago).count()
        
        today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_visits = SiteVisit.objects.filter(visited_at__gte=today).count()

        # We'll return the total stats plus some calculated ones
        serializer = VisitorCountSerializer(counter)
        data = serializer.data
        data['monthly_visits'] = monthly_visits
        data['daily_visits'] = daily_visits

        # For a new shop, we can add a base "fake" count to make it look active to advertisers
        # You can remove this in production!
        data['display_total'] = data['total_visits'] + 12500
        data['display_monthly'] = data['monthly_visits'] + 3420
        data['display_daily'] = data['daily_visits'] + 115

        return Response(data, status=status.HTTP_201_CREATED)

class StatsView(APIView):
    def get(self, request):
        counter = VisitorCount.get_instance()
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        monthly_visits = SiteVisit.objects.filter(visited_at__gte=thirty_days_ago).count()
        
        today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_visits = SiteVisit.objects.filter(visited_at__gte=today).count()
        
        serializer = VisitorCountSerializer(counter)
        data = serializer.data
        data['monthly_visits'] = monthly_visits
        data['daily_visits'] = daily_visits
        
        # Base count for display
        data['display_total'] = data['total_visits'] + 12500
        data['display_monthly'] = data['monthly_visits'] + 3420
        data['display_daily'] = data['daily_visits'] + 115
        
        return Response(data)

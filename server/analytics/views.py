from rest_framework.views import APIView
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.conf import settings
from django.db.models import Sum
from datetime import timedelta
from .models import CommerceEvent, DailyMetric, SiteVisit, VisitorCount
from .serializers import CommerceEventSerializer, VisitorCountSerializer
from commerce.models import Order

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

        # Real, authentic stats
        data['display_total'] = data['total_visits']
        data['display_monthly'] = data['monthly_visits']
        data['display_daily'] = data['daily_visits']

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
        
        # Real, authentic stats
        data['display_total'] = data['total_visits']
        data['display_monthly'] = data['monthly_visits']
        data['display_daily'] = data['daily_visits']
        
        return Response(data)


class CommerceEventView(generics.CreateAPIView):
    serializer_class = CommerceEventSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user_id = self.request.user.id if self.request.user.is_authenticated else None
        serializer.save(user_id=user_id)


class KPIDashboardView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        since = timezone.now() - timedelta(days=7)
        orders = Order.objects.exclude(status=Order.Status.CANCELLED).filter(created_at__gte=since)
        revenue = orders.aggregate(revenue=Sum('total'))['revenue'] or 0
        order_count = orders.count()
        sessions = CommerceEvent.objects.filter(event_name='session_started', occurred_at__gte=since).values('session_id').distinct().count()
        checkout_events = CommerceEvent.objects.filter(event_name='checkout_started', occurred_at__gte=since).count()
        daily = DailyMetric.objects.filter(date__gte=since.date()).values('date', 'revenue', 'orders', 'sessions', 'ad_spend')
        return Response({
            'window': {'from': since.isoformat(), 'to': timezone.now().isoformat(), 'timezone': settings.TIME_ZONE},
            'kpis': {
                'revenue': revenue,
                'orders': order_count,
                'conversion_rate': round((order_count / sessions * 100), 2) if sessions else 0,
                'average_order_value': round((revenue / order_count), 2) if order_count else 0,
                'checkout_starts': checkout_events,
            },
            'timeseries': list(daily),
        })

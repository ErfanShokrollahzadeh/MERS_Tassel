from django.db import models


class SiteVisit(models.Model):
    """Tracks individual page visits with IP and user agent info."""
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    page = models.CharField(max_length=200, default='/')
    referrer = models.URLField(blank=True, null=True)
    visited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-visited_at']

    def __str__(self):
        return f"Visit from {self.ip_address} at {self.visited_at}"


class VisitorCount(models.Model):
    """
    Singleton model to store aggregate visitor stats.
    Using a single row to avoid counting queries on every request.
    """
    total_visits = models.PositiveIntegerField(default=0)
    unique_visitors = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Visitor Count'
        verbose_name_plural = 'Visitor Count'

    def __str__(self):
        return f"Total: {self.total_visits} | Unique: {self.unique_visitors}"

    @classmethod
    def get_instance(cls):
        """Get or create the singleton counter row."""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    @classmethod
    def increment(cls, ip_address=None):
        """Increment visit count and track unique visitors."""
        counter = cls.get_instance()
        counter.total_visits += 1

        # Check if this IP has visited before
        if ip_address:
            is_new = not SiteVisit.objects.filter(ip_address=ip_address).exists()
            if is_new:
                counter.unique_visitors += 1

        counter.save()
        return counter


class CommerceEvent(models.Model):
    """Append-only event stream used for storefront funnel analytics."""
    event_name = models.CharField(max_length=64, db_index=True)
    session_id = models.CharField(max_length=72, db_index=True)
    user_id = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    order_number = models.CharField(max_length=24, blank=True, db_index=True)
    source = models.CharField(max_length=80, blank=True)
    properties = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-occurred_at']


class DailyMetric(models.Model):
    date = models.DateField(unique=True)
    revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    orders = models.PositiveIntegerField(default=0)
    sessions = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)
    ad_spend = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

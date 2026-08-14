from django.urls import path
from .views import CommerceEventView, KPIDashboardView, RecordVisitView, StatsView

urlpatterns = [
    path('record/', RecordVisitView.as_view(), name='record-visit'),
    path('stats/', StatsView.as_view(), name='stats'),
    path('events/', CommerceEventView.as_view(), name='commerce-event'),
    path('kpis/', KPIDashboardView.as_view(), name='commerce-kpis'),
]

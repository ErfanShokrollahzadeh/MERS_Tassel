from django.urls import path
from .views import RecordVisitView, StatsView

urlpatterns = [
    path('record/', RecordVisitView.as_view(), name='record-visit'),
    path('stats/', StatsView.as_view(), name='stats'),
]

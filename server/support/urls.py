from rest_framework.routers import DefaultRouter
from .views import CannedResponseViewSet, TicketViewSet

router = DefaultRouter()
router.register('tickets', TicketViewSet, basename='tickets')
router.register('canned-responses', CannedResponseViewSet, basename='canned-responses')
urlpatterns = router.urls

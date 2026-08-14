from rest_framework.routers import DefaultRouter
from .views import CannedResponseViewSet, TicketViewSet

router = DefaultRouter()
router.register('tickets', TicketViewSet)
router.register('canned-responses', CannedResponseViewSet)
urlpatterns = router.urls

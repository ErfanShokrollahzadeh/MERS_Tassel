from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CartViewSet, OrderViewSet, PromotionViewSet, StripeCheckoutSessionView, StripeSessionStatusView, stripe_webhook

router = DefaultRouter()
router.register('carts', CartViewSet)
router.register('orders', OrderViewSet, basename='orders')
router.register('promotions', PromotionViewSet)
urlpatterns = [
    path('stripe/checkout-session/', StripeCheckoutSessionView.as_view(), name='stripe-checkout-session'),
    path('stripe/session/<str:session_id>/', StripeSessionStatusView.as_view(), name='stripe-session-status'),
    path('stripe/webhook/', stripe_webhook, name='stripe-webhook'),
] + router.urls

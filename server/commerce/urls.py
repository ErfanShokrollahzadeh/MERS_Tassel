from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CartViewSet, OrderViewSet, PromotionViewSet, ShoppingBagItemDetailView, ShoppingBagItemsView, ShoppingBagView, StripeCheckoutSessionView, StripeSessionStatusView, stripe_webhook

router = DefaultRouter()
router.register('carts', CartViewSet, basename='carts')
router.register('orders', OrderViewSet, basename='orders')
router.register('promotions', PromotionViewSet, basename='promotions')
urlpatterns = [
    path('shopping-bag/', ShoppingBagView.as_view(), name='shopping-bag'),
    path('shopping-bag/items/', ShoppingBagItemsView.as_view(), name='shopping-bag-items'),
    path('shopping-bag/items/<int:item_id>/', ShoppingBagItemDetailView.as_view(), name='shopping-bag-item-detail'),
    path('stripe/checkout-session/', StripeCheckoutSessionView.as_view(), name='stripe-checkout-session'),
    path('stripe/session/<str:session_id>/', StripeSessionStatusView.as_view(), name='stripe-session-status'),
    path('stripe/webhook/', stripe_webhook, name='stripe-webhook'),
] + router.urls

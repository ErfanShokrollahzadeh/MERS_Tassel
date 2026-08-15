import json

import stripe
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Cart, CartItem, Order, Promotion
from .serializers import (
    CartItemInputSerializer,
    CartItemQuantitySerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderSerializer,
    PromotionSerializer,
    StripeCheckoutSerializer,
)
from .stripe_checkout import create_checkout_session, process_stripe_event


def current_bag(user):
    cart, _ = Cart.objects.prefetch_related('items__variant__product').get_or_create(
        user=user,
        status=Cart.Status.OPEN,
        defaults={'email': user.email, 'currency': 'USD'},
    )
    return cart


@transaction.atomic
def add_to_bag(cart, validated_data):
    locked_cart = Cart.objects.select_for_update().get(pk=cart.pk, user=cart.user, status=Cart.Status.OPEN)
    variant = validated_data['variant']
    quantity = validated_data['quantity']
    item, created = CartItem.objects.select_for_update().get_or_create(
        cart=locked_cart,
        variant=variant,
        defaults={'quantity': quantity},
    )
    if not created:
        next_quantity = item.quantity + quantity
        if next_quantity > variant.stock or next_quantity > 10:
            raise ValueError('Requested quantity is not available.')
        item.quantity = next_quantity
        item.save(update_fields=['quantity', 'updated_at'])
    return locked_cart


class ShoppingBagView(APIView):
    """Return only the authenticated customer's current shopping bag."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(CartSerializer(current_bag(request.user), context={'request': request}).data)


class ShoppingBagItemsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CartItemInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            cart = add_to_bag(current_bag(request.user), serializer.validated_data)
        except ValueError as exc:
            return Response({'quantity': [str(exc)]}, status=status.HTTP_400_BAD_REQUEST)
        cart = Cart.objects.prefetch_related('items__variant__product').get(pk=cart.pk)
        return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ShoppingBagItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_item(self, request, item_id):
        return get_object_or_404(
            CartItem.objects.select_related('variant').filter(
                cart__user=request.user,
                cart__status=Cart.Status.OPEN,
            ),
            pk=item_id,
        )

    def patch(self, request, item_id):
        item = self.get_item(request, item_id)
        serializer = CartItemQuantitySerializer(data=request.data, context={'item': item})
        serializer.is_valid(raise_exception=True)
        item.quantity = serializer.validated_data['quantity']
        item.save(update_fields=['quantity', 'updated_at'])
        cart = Cart.objects.prefetch_related('items__variant__product').get(pk=item.cart_id)
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request, item_id):
        item = self.get_item(request, item_id)
        cart_id = item.cart_id
        item.delete()
        cart = Cart.objects.prefetch_related('items__variant__product').get(pk=cart_id)
        return Response(CartSerializer(cart, context={'request': request}).data)


class CartViewSet(viewsets.ModelViewSet):
    """Authenticated compatibility API; every lookup is scoped to request.user."""
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user).prefetch_related('items__variant__product')

    def create(self, request, *args, **kwargs):
        return Response(CartSerializer(current_bag(request.user), context={'request': request}).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='items')
    def add_item(self, request, pk=None):
        cart = self.get_object()
        if cart.status != Cart.Status.OPEN:
            return Response({'detail': 'This shopping bag is no longer open.'}, status=status.HTTP_409_CONFLICT)
        serializer = CartItemInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            add_to_bag(cart, serializer.validated_data)
        except ValueError as exc:
            return Response({'quantity': [str(exc)]}, status=status.HTTP_400_BAD_REQUEST)
        cart = self.get_queryset().get(pk=cart.pk)
        return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Order.objects.prefetch_related('items')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset if self.request.user.is_staff else queryset.filter(user=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def checkout(self, request):
        serializer = CheckoutSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all().order_by('-starts_at')
    serializer_class = PromotionSerializer
    permission_classes = [permissions.IsAdminUser]


class StripeCheckoutSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'stripe_checkout'

    def post(self, request):
        serializer = StripeCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.validated_data['email'] = request.user.email
        try:
            order, session = create_checkout_session(serializer.validated_data, user=request.user)
        except ImproperlyConfigured as exc:
            return Response({'detail': str(exc), 'code': 'stripe_not_configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except stripe.StripeError:
            return Response({'detail': 'The secure payment page could not be prepared. Please try again.', 'code': 'stripe_unavailable'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response({'checkout_url': session.url, 'session_id': session.id, 'order_number': order.number}, status=status.HTTP_201_CREATED)


class StripeSessionStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        orders = Order.objects.prefetch_related('items')
        if not request.user.is_staff:
            orders = orders.filter(user=request.user)
        order = get_object_or_404(orders, stripe_checkout_session_id=session_id)
        return Response(OrderSerializer(order).data)


@csrf_exempt
@require_POST
def stripe_webhook(request):
    if not settings.STRIPE_WEBHOOK_SECRET:
        return JsonResponse({'detail': 'Webhook secret is not configured.'}, status=503)
    signature = request.headers.get('Stripe-Signature', '')
    try:
        event = stripe.Webhook.construct_event(request.body, signature, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, json.JSONDecodeError):
        return JsonResponse({'detail': 'Invalid payload.'}, status=400)
    except stripe.SignatureVerificationError:
        return JsonResponse({'detail': 'Invalid signature.'}, status=400)
    try:
        processed = process_stripe_event(event)
    except (Order.DoesNotExist, ValueError):
        return JsonResponse({'detail': 'Unable to fulfill the referenced order.'}, status=409)
    return JsonResponse({'received': True, 'processed': processed})

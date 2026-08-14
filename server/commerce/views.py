import json

import stripe
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.response import Response
from .models import Cart, CartItem, Order, Promotion
from .serializers import CartItemSerializer, CartSerializer, CheckoutSerializer, OrderSerializer, PromotionSerializer, StripeCheckoutSerializer
from .stripe_checkout import create_checkout_session, process_stripe_event


class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.prefetch_related('items__variant__product')
    serializer_class = CartSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ['get', 'post', 'patch', 'delete']

    @action(detail=True, methods=['post'], url_path='items')
    def add_item(self, request, pk=None):
        cart = self.get_object()
        serializer = CartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item, created = CartItem.objects.get_or_create(cart=cart, variant=serializer.validated_data['variant'], defaults={'quantity': serializer.validated_data['quantity']})
        if not created:
            item.quantity += serializer.validated_data['quantity']
            if item.quantity > item.variant.stock:
                return Response({'quantity': ['Requested quantity is not available.']}, status=status.HTTP_400_BAD_REQUEST)
            item.save(update_fields=['quantity'])
        return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        queryset = Order.objects.prefetch_related('items')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset if self.request.user.is_staff else queryset.filter(user=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def checkout(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all().order_by('-starts_at')
    serializer_class = PromotionSerializer
    permission_classes = [permissions.IsAdminUser]


class StripeCheckoutSessionView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'stripe_checkout'

    def post(self, request):
        serializer = StripeCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            order, session = create_checkout_session(serializer.validated_data)
        except ImproperlyConfigured as exc:
            return Response({'detail': str(exc), 'code': 'stripe_not_configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except stripe.StripeError as exc:
            return Response({'detail': 'The secure payment page could not be prepared. Please try again.', 'code': 'stripe_unavailable'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response({'checkout_url': session.url, 'session_id': session.id, 'order_number': order.number}, status=status.HTTP_201_CREATED)


class StripeSessionStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, session_id):
        order = get_object_or_404(Order.objects.prefetch_related('items'), stripe_checkout_session_id=session_id)
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

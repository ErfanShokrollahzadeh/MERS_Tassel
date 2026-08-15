import uuid
from datetime import timedelta
from decimal import Decimal

import stripe
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from products.models import Product, ProductVariant
from .models import InventoryReservation, Order, OrderItem, StripeEvent


RESERVATION_WINDOW = timedelta(minutes=31)
SHIPPING_RATES = {
    'standard': Decimal('9.00'),
    'express': Decimal('18.00'),
}


def _stripe_value(value, key, default=None):
    if isinstance(value, dict):
        return value.get(key, default)
    return getattr(value, key, default)


def _unit_price(variant):
    product = variant.product
    return variant.price_override or product.discount_price or product.price


def _release_expired_reservations(now):
    expired = InventoryReservation.objects.select_for_update().filter(
        status=InventoryReservation.Status.ACTIVE,
        expires_at__lte=now,
    )
    expired.update(status=InventoryReservation.Status.RELEASED)


def _available_stock(variant, now):
    reserved = variant.reservations.filter(
        status=InventoryReservation.Status.ACTIVE,
        expires_at__gt=now,
    ).aggregate(total=Sum('quantity'))['total'] or 0
    return variant.stock - reserved


def _resolve_variant(item):
    try:
        product = Product.objects.get(slug=item['slug'], is_available=True)
    except Product.DoesNotExist as exc:
        raise serializers.ValidationError({'items': f"{item['slug']} is no longer available."}) from exc

    variants = product.variants.filter(is_active=True)
    color = item.get('color', '').strip()
    variant = variants.filter(color__iexact=color).first() if color else None
    variant = variant or variants.filter(title__iexact=color).first() or variants.first()
    if not variant:
        raise serializers.ValidationError({'items': f'{product.name} has no active sellable variant.'})
    return variant


def create_checkout_session(validated_data, user):
    if not settings.STRIPE_SECRET_KEY:
        raise ImproperlyConfigured('STRIPE_SECRET_KEY is not configured.')

    now = timezone.now()
    resolved_by_variant = {}
    with transaction.atomic():
        _release_expired_reservations(now)
        for item in validated_data['items']:
            initial = _resolve_variant(item)
            current = resolved_by_variant.setdefault(initial.pk, {'quantity': 0})
            current['quantity'] += item['quantity']

        resolved = []
        for variant_id, selection in resolved_by_variant.items():
            variant = ProductVariant.objects.select_for_update().select_related('product').get(pk=variant_id)
            quantity = selection['quantity']
            if quantity > _available_stock(variant, now):
                raise serializers.ValidationError({'items': f'{variant.product.name} does not have {quantity} available.'})
            resolved.append((variant, quantity))

        subtotal = sum((_unit_price(variant) * quantity for variant, quantity in resolved), Decimal('0.00'))
        shipping = Decimal('0.00') if validated_data['shipping_tier'] == 'standard' and subtotal >= Decimal('120.00') else SHIPPING_RATES[validated_data['shipping_tier']]
        idempotency_key = f"stripe-{uuid.uuid4().hex}"
        order = Order.objects.create(
            number=f'MT-{uuid.uuid4().hex[:8].upper()}',
            email=validated_data['email'],
            subtotal=subtotal,
            shipping_total=shipping,
            total=subtotal + shipping,
            shipping_address={},
            idempotency_key=idempotency_key,
            channel='stripe-checkout',
            user=user,
        )
        expires_at = now + RESERVATION_WINDOW
        for variant, quantity in resolved:
            OrderItem.objects.create(
                order=order,
                variant=variant,
                product_name=variant.product.name,
                sku=variant.sku,
                quantity=quantity,
                unit_price=_unit_price(variant),
            )
            InventoryReservation.objects.create(
                order=order,
                variant=variant,
                quantity=quantity,
                expires_at=expires_at,
            )

    stripe.api_key = settings.STRIPE_SECRET_KEY
    line_items = [
        {
            'price_data': {
                'currency': settings.STRIPE_CURRENCY,
                'unit_amount': int(_unit_price(variant) * 100),
                'product_data': {
                    'name': variant.product.name,
                    'description': variant.title if not variant.color else f'{variant.title} · {variant.color}',
                    'metadata': {'product_slug': variant.product.slug, 'variant_id': str(variant.pk)},
                },
            },
            'quantity': quantity,
        }
        for variant, quantity in resolved
    ]
    is_turkish = validated_data.get('locale') == 'tr'
    shipping_name = ('Hızlı teslimat' if validated_data['shipping_tier'] == 'express' else 'Atölye standart teslimat') if is_turkish else ('Atelier express' if validated_data['shipping_tier'] == 'express' else 'Atelier standard')

    try:
        session = stripe.checkout.Session.create(
            mode='payment',
            locale=validated_data.get('locale', 'auto'),
            customer_email=validated_data['email'],
            client_reference_id=order.number,
            line_items=line_items,
            shipping_address_collection={'allowed_countries': ['TR', 'US', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL']},
            shipping_options=[{
                'shipping_rate_data': {
                    'type': 'fixed_amount',
                    'fixed_amount': {'amount': int(shipping * 100), 'currency': settings.STRIPE_CURRENCY},
                    'display_name': shipping_name,
                    'delivery_estimate': {
                        'minimum': {'unit': 'business_day', 'value': 1 if validated_data['shipping_tier'] == 'express' else 4},
                        'maximum': {'unit': 'business_day', 'value': 2 if validated_data['shipping_tier'] == 'express' else 6},
                    },
                },
            }],
            success_url=f'{settings.FRONTEND_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{settings.FRONTEND_URL}/checkout/cancel?order={order.number}',
            expires_at=int(expires_at.timestamp()),
            metadata={'order_id': str(order.pk), 'order_number': order.number},
            payment_intent_data={'metadata': {'order_id': str(order.pk), 'order_number': order.number}},
        )
    except Exception:
        with transaction.atomic():
            Order.objects.filter(pk=order.pk).update(status=Order.Status.CANCELLED, payment_status=Order.PaymentStatus.FAILED)
            InventoryReservation.objects.filter(order=order, status=InventoryReservation.Status.ACTIVE).update(status=InventoryReservation.Status.RELEASED)
        raise

    order.stripe_checkout_session_id = session.id
    order.save(update_fields=['stripe_checkout_session_id', 'updated_at'])
    return order, session


def _fulfill_order(session):
    metadata = _stripe_value(session, 'metadata', {}) or {}
    order_id = _stripe_value(metadata, 'order_id')
    session_id = _stripe_value(session, 'id')
    payment_intent = _stripe_value(session, 'payment_intent') or ''
    if not order_id:
        return

    order = Order.objects.select_for_update().get(pk=order_id)
    if order.payment_status == Order.PaymentStatus.PAID:
        return
    reservations = list(order.reservations.select_related('variant').select_for_update())
    for reservation in reservations:
        if reservation.status != InventoryReservation.Status.ACTIVE:
            raise ValueError(f'Inventory reservation for order {order.number} is not active.')
        variant = ProductVariant.objects.select_for_update().get(pk=reservation.variant_id)
        if variant.stock < reservation.quantity:
            raise ValueError(f'Inventory for {variant.sku} fell below the paid reservation.')
        variant.stock -= reservation.quantity
        variant.save(update_fields=['stock', 'updated_at'])
        reservation.status = InventoryReservation.Status.CONVERTED
        reservation.save(update_fields=['status'])

    shipping = _stripe_value(session, 'shipping_details') or _stripe_value(_stripe_value(session, 'collected_information', {}), 'shipping_details', {}) or {}
    shipping_address = _stripe_value(shipping, 'address', {}) or {}
    order.shipping_address = dict(shipping_address) if hasattr(shipping_address, 'items') else {}
    order.status = Order.Status.PROCESSING
    order.payment_status = Order.PaymentStatus.PAID
    order.paid_at = timezone.now()
    order.stripe_checkout_session_id = session_id or order.stripe_checkout_session_id
    order.stripe_payment_intent_id = str(payment_intent)
    order.save(update_fields=['shipping_address', 'status', 'payment_status', 'paid_at', 'stripe_checkout_session_id', 'stripe_payment_intent_id', 'updated_at'])


def _fail_order(session):
    metadata = _stripe_value(session, 'metadata', {}) or {}
    order_id = _stripe_value(metadata, 'order_id')
    if not order_id:
        return
    order = Order.objects.select_for_update().get(pk=order_id)
    if order.payment_status == Order.PaymentStatus.PAID:
        return
    order.status = Order.Status.CANCELLED
    order.payment_status = Order.PaymentStatus.FAILED
    order.save(update_fields=['status', 'payment_status', 'updated_at'])
    order.reservations.filter(status=InventoryReservation.Status.ACTIVE).update(status=InventoryReservation.Status.RELEASED)


def _extend_async_payment_reservation(session):
    metadata = _stripe_value(session, 'metadata', {}) or {}
    order_id = _stripe_value(metadata, 'order_id')
    if order_id:
        InventoryReservation.objects.filter(
            order_id=order_id,
            status=InventoryReservation.Status.ACTIVE,
        ).update(expires_at=timezone.now() + timedelta(days=7))


def process_stripe_event(event):
    event_id = _stripe_value(event, 'id')
    event_type = _stripe_value(event, 'type')
    data = _stripe_value(event, 'data', {}) or {}
    session = _stripe_value(data, 'object', {}) or {}

    with transaction.atomic():
        _, created = StripeEvent.objects.get_or_create(event_id=event_id, defaults={'event_type': event_type})
        if not created:
            return False
        if event_type in {'checkout.session.completed', 'checkout.session.async_payment_succeeded'}:
            if event_type == 'checkout.session.async_payment_succeeded' or _stripe_value(session, 'payment_status') == 'paid':
                _fulfill_order(session)
            else:
                _extend_async_payment_reservation(session)
        elif event_type in {'checkout.session.async_payment_failed', 'checkout.session.expired'}:
            _fail_order(session)
    return True

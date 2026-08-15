from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from products.models import Category, Product, ProductVariant
from .models import Cart, CartItem, InventoryReservation, Order, Promotion, StripeEvent
from .serializers import CheckoutSerializer


class CommerceDomainTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='domain-customer', email='domain@example.com', password='test-password')
        category = Category.objects.create(name='Necklaces', slug='necklaces')
        product = Product.objects.create(name='Lale', slug='lale', category=category, description='Handmade', price=Decimal('100.00'), image='products/lale.jpg')
        self.variant = ProductVariant.objects.create(product=product, title='Rose', sku='LALE-ROSE', color='Rose', stock=5)

    def test_checkout_reserves_inventory_and_is_idempotent(self):
        cart = Cart.objects.create(user=self.user, email='collector@example.com')
        CartItem.objects.create(cart=cart, variant=self.variant, quantity=2)
        payload = {'cart_id': cart.id, 'email': cart.email, 'shipping_address': {'city': 'Istanbul'}, 'shipping_total': '9.00', 'idempotency_key': 'checkout-test-1'}
        request = SimpleNamespace(user=self.user)
        serializer = CheckoutSerializer(data=payload, context={'request': request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        first = serializer.save()
        second_serializer = CheckoutSerializer(data=payload, context={'request': request})
        self.assertTrue(second_serializer.is_valid(), second_serializer.errors)
        second = second_serializer.save()
        self.variant.refresh_from_db()
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(self.variant.stock, 3)
        self.assertEqual(first.total, Decimal('209.00'))

    def test_promotion_availability_obeys_redemption_limit(self):
        promotion = Promotion.objects.create(name='Collector offer', code='KEEP20', value=20, max_redemptions=2, redemptions=2, starts_at=timezone.now())
        self.assertFalse(promotion.is_available())


@override_settings(
    STRIPE_SECRET_KEY='sk_test_example',
    STRIPE_WEBHOOK_SECRET='whsec_example',
    STRIPE_CURRENCY='usd',
    FRONTEND_URL='http://localhost:3000',
)
class StripeCheckoutTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='stripe-customer', email='collector@example.com', password='test-password')
        category = Category.objects.create(name='Necklaces', slug='stripe-necklaces')
        product = Product.objects.create(
            name='Lâle Pearl Tassel', slug='lale-pearl-tassel', category=category,
            description='Handmade', price=Decimal('189.00'), discount_price=Decimal('149.00'), image='products/lale.jpg',
        )
        self.variant = ProductVariant.objects.create(product=product, title='Rose', sku='LALE-ROSE-STRIPE', color='Rose', stock=5)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.payload = {
            'email': 'collector@example.com',
            'shipping_tier': 'standard',
            'locale': 'tr',
            'items': [{'slug': product.slug, 'color': 'Rose', 'quantity': 2}],
        }

    def test_guest_cannot_view_bag_or_begin_checkout(self):
        guest = APIClient()
        self.assertEqual(guest.get('/api/v1/commerce/shopping-bag/').status_code, 401)
        self.assertEqual(guest.post('/api/v1/commerce/stripe/checkout-session/', self.payload, format='json').status_code, 401)

    def test_authenticated_customer_can_only_fetch_their_bag(self):
        other = get_user_model().objects.create_user(username='other-customer', email='other@example.com', password='test-password')
        other_cart = Cart.objects.create(user=other, email=other.email)

        response = self.client.get('/api/v1/commerce/shopping-bag/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user_id'], self.user.id)
        self.assertNotEqual(response.data['id'], str(other_cart.id))

    def test_authenticated_customer_can_add_update_and_remove_a_bag_item(self):
        added = self.client.post('/api/v1/commerce/shopping-bag/items/', {
            'product_slug': self.variant.product.slug,
            'color': self.variant.color,
            'quantity': 2,
        }, format='json')
        self.assertEqual(added.status_code, 201, added.data)
        item = added.data['items'][0]
        self.assertEqual(item['quantity'], 2)
        self.assertIn('added_at', item)

        updated = self.client.patch(f"/api/v1/commerce/shopping-bag/items/{item['id']}/", {'quantity': 3}, format='json')
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data['items'][0]['quantity'], 3)

        removed = self.client.delete(f"/api/v1/commerce/shopping-bag/items/{item['id']}/")
        self.assertEqual(removed.status_code, 200)
        self.assertEqual(removed.data['items'], [])

    @patch('commerce.stripe_checkout.stripe.checkout.Session.create')
    def test_session_uses_database_price_and_reserves_without_decrementing(self, create_session):
        create_session.return_value = SimpleNamespace(id='cs_test_secure', url='https://checkout.stripe.com/test')
        response = self.client.post('/api/v1/commerce/stripe/checkout-session/', self.payload, format='json')

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['checkout_url'], 'https://checkout.stripe.com/test')
        call = create_session.call_args.kwargs
        self.assertEqual(call['line_items'][0]['price_data']['unit_amount'], 14900)
        self.assertEqual(call['locale'], 'tr')
        self.assertEqual(call['shipping_options'][0]['shipping_rate_data']['display_name'], 'Atölye standart teslimat')
        self.assertIn('{CHECKOUT_SESSION_ID}', call['success_url'])
        order = Order.objects.get(stripe_checkout_session_id='cs_test_secure')
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.total, Decimal('298.00'))
        self.assertEqual(order.payment_status, Order.PaymentStatus.UNPAID)
        self.assertEqual(order.reservations.get().status, InventoryReservation.Status.ACTIVE)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 5)

    @patch('commerce.views.stripe.Webhook.construct_event')
    @patch('commerce.stripe_checkout.stripe.checkout.Session.create')
    def test_verified_webhook_fulfills_once_and_status_is_publicly_readable(self, create_session, construct_event):
        create_session.return_value = SimpleNamespace(id='cs_test_paid', url='https://checkout.stripe.com/test')
        created = self.client.post('/api/v1/commerce/stripe/checkout-session/', self.payload, format='json')
        order = Order.objects.get(number=created.data['order_number'])
        event = {
            'id': 'evt_checkout_paid',
            'type': 'checkout.session.completed',
            'data': {'object': {
                'id': 'cs_test_paid', 'payment_status': 'paid', 'payment_intent': 'pi_test_paid',
                'metadata': {'order_id': str(order.pk), 'order_number': order.number},
                'shipping_details': {'address': {'city': 'Istanbul', 'country': 'TR'}},
            }},
        }
        construct_event.return_value = event

        first = self.client.post('/api/v1/commerce/stripe/webhook/', data=b'{}', content_type='application/json', HTTP_STRIPE_SIGNATURE='test')
        second = self.client.post('/api/v1/commerce/stripe/webhook/', data=b'{}', content_type='application/json', HTTP_STRIPE_SIGNATURE='test')
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertFalse(second.json()['processed'])
        self.assertEqual(StripeEvent.objects.count(), 1)

        self.variant.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(self.variant.stock, 3)
        self.assertEqual(order.payment_status, Order.PaymentStatus.PAID)
        self.assertEqual(order.status, Order.Status.PROCESSING)
        self.assertEqual(order.stripe_payment_intent_id, 'pi_test_paid')
        self.assertEqual(order.shipping_address['city'], 'Istanbul')

        status_response = self.client.get('/api/v1/commerce/stripe/session/cs_test_paid/')
        self.assertEqual(status_response.status_code, 200)
        self.assertEqual(status_response.data['payment_status'], 'paid')

    @patch('commerce.views.stripe.Webhook.construct_event')
    @patch('commerce.stripe_checkout.stripe.checkout.Session.create')
    def test_expired_checkout_releases_inventory(self, create_session, construct_event):
        create_session.return_value = SimpleNamespace(id='cs_test_expired', url='https://checkout.stripe.com/test')
        created = self.client.post('/api/v1/commerce/stripe/checkout-session/', self.payload, format='json')
        order = Order.objects.get(number=created.data['order_number'])
        construct_event.return_value = {
            'id': 'evt_checkout_expired', 'type': 'checkout.session.expired',
            'data': {'object': {'id': 'cs_test_expired', 'metadata': {'order_id': str(order.pk)}}},
        }
        response = self.client.post('/api/v1/commerce/stripe/webhook/', data=b'{}', content_type='application/json', HTTP_STRIPE_SIGNATURE='test')
        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, Order.PaymentStatus.FAILED)
        self.assertEqual(order.reservations.get().status, InventoryReservation.Status.RELEASED)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 5)

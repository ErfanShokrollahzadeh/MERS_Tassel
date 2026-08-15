import uuid
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone
from products.models import ProductVariant


class Cart(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        CONVERTED = 'converted', 'Converted'
        ABANDONED = 'abandoned', 'Abandoned'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name='carts')
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    currency = models.CharField(max_length=3, default='USD')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(user__isnull=False) | ~Q(status='open'),
                name='open_cart_requires_user',
            ),
            models.UniqueConstraint(
                fields=['user'],
                condition=Q(status='open'),
                name='unique_open_cart_per_user',
            ),
        ]

    @property
    def subtotal(self):
        return sum(item.unit_price * item.quantity for item in self.items.select_related('variant__product'))


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    added_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['cart', 'variant'], name='unique_cart_variant')]

    @property
    def unit_price(self):
        product = self.variant.product
        return self.variant.price_override or product.discount_price or product.price


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        SHIPPED = 'shipped', 'Shipped'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'
        REFUNDED = 'refunded', 'Refunded'

    class PaymentStatus(models.TextChoices):
        UNPAID = 'unpaid', 'Unpaid'
        PAID = 'paid', 'Paid'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    number = models.CharField(max_length=24, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='orders')
    email = models.EmailField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    currency = models.CharField(max_length=3, default='USD')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_address = models.JSONField(default=dict)
    channel = models.CharField(max_length=40, default='storefront')
    idempotency_key = models.CharField(max_length=72, unique=True, null=True, blank=True)
    payment_status = models.CharField(max_length=16, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    stripe_checkout_session_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, default='')
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, null=True, on_delete=models.SET_NULL)
    product_name = models.CharField(max_length=200)
    sku = models.CharField(max_length=64)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)


class InventoryReservation(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        CONVERTED = 'converted', 'Converted'
        RELEASED = 'released', 'Released'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='reservations')
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name='reservations')
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['order', 'variant'], name='unique_order_variant_reservation')]
        indexes = [models.Index(fields=['status', 'expires_at'])]


class StripeEvent(models.Model):
    event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=120)
    processed_at = models.DateTimeField(auto_now_add=True)


class Promotion(models.Model):
    class Kind(models.TextChoices):
        PERCENT = 'percent', 'Percentage'
        FIXED = 'fixed', 'Fixed amount'
        SHIPPING = 'shipping', 'Free shipping'

    name = models.CharField(max_length=160)
    code = models.CharField(max_length=40, unique=True)
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.PERCENT)
    value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    starts_at = models.DateTimeField(default=timezone.now)
    ends_at = models.DateTimeField(null=True, blank=True)
    max_redemptions = models.PositiveIntegerField(null=True, blank=True)
    redemptions = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def is_available(self):
        now = timezone.now()
        return self.is_active and self.starts_at <= now and (self.ends_at is None or self.ends_at > now) and (self.max_redemptions is None or self.redemptions < self.max_redemptions)

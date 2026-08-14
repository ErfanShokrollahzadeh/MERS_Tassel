import uuid
from rest_framework import serializers
from django.db import transaction
from products.models import ProductVariant
from .models import Cart, CartItem, Order, OrderItem, Promotion


class CartItemSerializer(serializers.ModelSerializer):
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    product_name = serializers.CharField(source='variant.product.name', read_only=True)
    sku = serializers.CharField(source='variant.sku', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'variant', 'product_name', 'sku', 'quantity', 'unit_price']

    def validate(self, attrs):
        variant = attrs.get('variant', getattr(self.instance, 'variant', None))
        quantity = attrs.get('quantity', getattr(self.instance, 'quantity', 1))
        if variant and quantity > variant.stock:
            raise serializers.ValidationError({'quantity': 'Requested quantity is not available.'})
        return attrs


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'email', 'status', 'currency', 'items', 'subtotal', 'created_at', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'sku', 'quantity', 'unit_price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'number', 'email', 'status', 'payment_status', 'currency', 'subtotal', 'shipping_total', 'total', 'shipping_address', 'channel', 'items', 'created_at', 'updated_at']
        read_only_fields = ['number', 'subtotal', 'total']


class StripeCheckoutItemSerializer(serializers.Serializer):
    slug = serializers.SlugField(max_length=200)
    color = serializers.CharField(max_length=80, allow_blank=True, default='')
    quantity = serializers.IntegerField(min_value=1, max_value=10)


class StripeCheckoutSerializer(serializers.Serializer):
    email = serializers.EmailField()
    shipping_tier = serializers.ChoiceField(choices=['standard', 'express'], default='standard')
    items = StripeCheckoutItemSerializer(many=True, allow_empty=False)

    def validate_items(self, items):
        identities = [(item['slug'], item.get('color', '').casefold()) for item in items]
        if len(identities) != len(set(identities)):
            raise serializers.ValidationError('Duplicate selections must be combined before checkout.')
        return items


class CheckoutSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField()
    email = serializers.EmailField()
    shipping_address = serializers.JSONField()
    shipping_total = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    idempotency_key = serializers.CharField(max_length=72)

    def create(self, validated_data):
        with transaction.atomic():
            existing = Order.objects.filter(idempotency_key=validated_data['idempotency_key']).first()
            if existing:
                return existing
            cart = Cart.objects.select_for_update().prefetch_related('items__variant__product').get(pk=validated_data['cart_id'], status=Cart.Status.OPEN)
            if not cart.items.exists():
                raise serializers.ValidationError({'cart_id': 'Cart is empty.'})
            for item in cart.items.all():
                if item.quantity > item.variant.stock:
                    raise serializers.ValidationError({'cart_id': f'{item.variant.sku} is no longer available.'})
            shipping = validated_data['shipping_total']
            order = Order.objects.create(number=f'MT-{uuid.uuid4().hex[:8].upper()}', email=validated_data['email'], subtotal=cart.subtotal, shipping_total=shipping, total=cart.subtotal + shipping, shipping_address=validated_data['shipping_address'], idempotency_key=validated_data['idempotency_key'], user=cart.user)
            for item in cart.items.all():
                OrderItem.objects.create(order=order, variant=item.variant, product_name=item.variant.product.name, sku=item.variant.sku, quantity=item.quantity, unit_price=item.unit_price)
                item.variant.stock -= item.quantity
                item.variant.save(update_fields=['stock', 'updated_at'])
            cart.status = Cart.Status.CONVERTED
            cart.save(update_fields=['status', 'updated_at'])
            return order


class PromotionSerializer(serializers.ModelSerializer):
    available = serializers.BooleanField(source='is_available', read_only=True)

    class Meta:
        model = Promotion
        fields = '__all__'

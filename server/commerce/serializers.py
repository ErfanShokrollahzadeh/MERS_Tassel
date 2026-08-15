import uuid

from django.db import transaction
from rest_framework import serializers

from products.models import Product, ProductVariant
from .models import Cart, CartItem, Order, OrderItem, Promotion


class CartItemSerializer(serializers.ModelSerializer):
    variant_id = serializers.IntegerField(source='variant.id', read_only=True)
    product_name = serializers.CharField(source='variant.product.name', read_only=True)
    product_slug = serializers.CharField(source='variant.product.slug', read_only=True)
    sku = serializers.CharField(source='variant.sku', read_only=True)
    color = serializers.CharField(source='variant.color', read_only=True)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'variant_id', 'product_name', 'product_slug', 'sku', 'color', 'quantity', 'unit_price', 'added_at', 'updated_at']
        read_only_fields = fields


class CartItemInputSerializer(serializers.Serializer):
    product_slug = serializers.SlugField(max_length=200)
    color = serializers.CharField(max_length=80, allow_blank=True, default='')
    quantity = serializers.IntegerField(min_value=1, max_value=10, default=1)

    def validate(self, attrs):
        try:
            product = Product.objects.get(slug=attrs['product_slug'], is_available=True)
        except Product.DoesNotExist as exc:
            raise serializers.ValidationError({'product_slug': 'This product is not available.'}) from exc

        variants = product.variants.filter(is_active=True)
        color = attrs.get('color', '').strip()
        variant = variants.filter(color__iexact=color).first() if color else None
        variant = variant or variants.filter(title__iexact=color).first() or variants.first()
        if not variant:
            raise serializers.ValidationError({'product_slug': 'This product has no sellable variant.'})
        if attrs['quantity'] > variant.stock:
            raise serializers.ValidationError({'quantity': 'Requested quantity is not available.'})
        attrs['variant'] = variant
        return attrs


class CartItemQuantitySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=10)

    def validate_quantity(self, quantity):
        item = self.context['item']
        if quantity > item.variant.stock:
            raise serializers.ValidationError('Requested quantity is not available.')
        return quantity


class CartSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user_id', 'email', 'status', 'currency', 'items', 'subtotal', 'created_at', 'updated_at']
        read_only_fields = fields


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
    email = serializers.EmailField(required=False)
    shipping_tier = serializers.ChoiceField(choices=['standard', 'express'], default='standard')
    locale = serializers.ChoiceField(choices=['auto', 'en', 'tr'], default='auto')
    items = StripeCheckoutItemSerializer(many=True, allow_empty=False)

    def validate_items(self, items):
        identities = [(item['slug'], item.get('color', '').casefold()) for item in items]
        if len(identities) != len(set(identities)):
            raise serializers.ValidationError('Duplicate selections must be combined before checkout.')
        return items


class CheckoutSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField()
    email = serializers.EmailField(required=False)
    shipping_address = serializers.JSONField()
    shipping_total = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    idempotency_key = serializers.CharField(max_length=72)

    def create(self, validated_data):
        request = self.context['request']
        with transaction.atomic():
            existing = Order.objects.filter(idempotency_key=validated_data['idempotency_key'], user=request.user).first()
            if existing:
                return existing
            try:
                cart = Cart.objects.select_for_update().prefetch_related('items__variant__product').get(
                    pk=validated_data['cart_id'], user=request.user, status=Cart.Status.OPEN,
                )
            except Cart.DoesNotExist as exc:
                raise serializers.ValidationError({'cart_id': 'Shopping bag was not found.'}) from exc
            if not cart.items.exists():
                raise serializers.ValidationError({'cart_id': 'Shopping bag is empty.'})
            for item in cart.items.all():
                if item.quantity > item.variant.stock:
                    raise serializers.ValidationError({'cart_id': f'{item.variant.sku} is no longer available.'})
            shipping = validated_data['shipping_total']
            order = Order.objects.create(
                number=f'MT-{uuid.uuid4().hex[:8].upper()}',
                email=request.user.email,
                subtotal=cart.subtotal,
                shipping_total=shipping,
                total=cart.subtotal + shipping,
                shipping_address=validated_data['shipping_address'],
                idempotency_key=validated_data['idempotency_key'],
                user=request.user,
            )
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

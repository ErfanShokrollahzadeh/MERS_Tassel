from django.contrib import admin
from .models import Cart, CartItem, InventoryReservation, Order, OrderItem, Promotion, StripeEvent


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'email', 'status', 'currency', 'updated_at']
    list_filter = ['status', 'currency']
    inlines = [CartItemInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'sku', 'quantity', 'unit_price']


class InventoryReservationInline(admin.TabularInline):
    model = InventoryReservation
    extra = 0
    readonly_fields = ['variant', 'quantity', 'status', 'expires_at', 'created_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['number', 'email', 'status', 'payment_status', 'total', 'currency', 'channel', 'created_at']
    list_filter = ['status', 'payment_status', 'currency', 'channel']
    search_fields = ['number', 'email']
    inlines = [OrderItemInline, InventoryReservationInline]


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'kind', 'value', 'is_active', 'starts_at', 'ends_at', 'redemptions']
    list_filter = ['kind', 'is_active']
    search_fields = ['name', 'code']


@admin.register(StripeEvent)
class StripeEventAdmin(admin.ModelAdmin):
    list_display = ['event_id', 'event_type', 'processed_at']
    search_fields = ['event_id', 'event_type']
    readonly_fields = ['event_id', 'event_type', 'processed_at']

from django.contrib import admin
from .models import Category, Product, ProductMedia, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


class ProductMediaInline(admin.TabularInline):
    model = ProductMedia
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'product_count', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductVariantInline, ProductMediaInline]
    list_display = ['name', 'category', 'price', 'discount_price', 'is_featured', 'is_available', 'created_at']
    list_filter = ['category', 'is_featured', 'is_available']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'description']
    list_editable = ['is_featured', 'is_available', 'price']
    
    # Nicer layout for editing products
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'category', 'description')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'discount_price', 'is_available')
        }),
        ('Media & Display', {
            'fields': ('image', 'image_alt', 'is_featured', 'seo_title', 'meta_description')
        }),
    )

    actions = ['make_featured', 'remove_featured', 'mark_out_of_stock', 'mark_available']

    @admin.action(description='Mark selected as Featured')
    def make_featured(self, request, queryset):
        queryset.update(is_featured=True)

    @admin.action(description='Remove Featured status')
    def remove_featured(self, request, queryset):
        queryset.update(is_featured=False)
        
    @admin.action(description='Mark as Out of Stock')
    def mark_out_of_stock(self, request, queryset):
        queryset.update(is_available=False)
        
    @admin.action(description='Mark as Available')
    def mark_available(self, request, queryset):
        queryset.update(is_available=True)

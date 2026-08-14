from rest_framework import serializers
from .models import Category, Product, ProductMedia, ProductVariant


class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ['id', 'title', 'sku', 'color', 'size', 'price_override', 'effective_price', 'stock', 'low_stock_threshold', 'is_active']

    def get_effective_price(self, obj):
        return obj.price_override if obj.price_override is not None else obj.product.discount_price or obj.product.price


class ProductMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMedia
        fields = ['id', 'image', 'alt', 'sort_order']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for product categories."""
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'product_count']

    def get_product_count(self, obj):
        return obj.products.count()


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for products with category details."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'category_name',
            'description', 'price', 'discount_price', 'image',
            'image_alt', 'is_featured', 'is_available',
            'is_on_sale', 'created_at'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Detailed product serializer with full category info."""
    category = CategorySerializer(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    media = ProductMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category',
            'description', 'price', 'discount_price', 'image',
            'image_alt', 'is_featured', 'is_available',
            'is_on_sale', 'variants', 'media', 'seo_title',
            'meta_description', 'created_at', 'updated_at'
        ]

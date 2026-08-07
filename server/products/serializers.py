from rest_framework import serializers
from .models import Category, Product


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

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category',
            'description', 'price', 'discount_price', 'image',
            'image_alt', 'is_featured', 'is_available',
            'is_on_sale', 'created_at', 'updated_at'
        ]

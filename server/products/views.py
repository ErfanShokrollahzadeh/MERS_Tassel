from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer, ProductDetailSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for viewing product categories."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for viewing products with filtering."""
    queryset = Product.objects.filter(is_available=True).select_related('category').prefetch_related('variants', 'media')
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at', 'name']
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by category slug
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Return featured products for homepage."""
        featured = self.get_queryset().filter(is_featured=True)[:8]
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)

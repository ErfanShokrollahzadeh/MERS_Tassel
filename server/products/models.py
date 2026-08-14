from django.db import models


class Category(models.Model):
    """Product category (e.g., Necklaces, Bag Accessories, Pendants)."""
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """Individual product listing."""
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='products'
    )
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        blank=True, null=True
    )
    image = models.ImageField(upload_to='products/')
    image_alt = models.CharField(max_length=200, blank=True)
    is_featured = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    seo_title = models.CharField(max_length=70, blank=True, default='')
    meta_description = models.CharField(max_length=170, blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def is_on_sale(self):
        return self.discount_price is not None and self.discount_price < self.price


class ProductVariant(models.Model):
    """Sellable product configuration with its own inventory identity."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    title = models.CharField(max_length=120)
    sku = models.CharField(max_length=64, unique=True)
    color = models.CharField(max_length=80, blank=True)
    size = models.CharField(max_length=40, blank=True)
    price_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['product_id', 'id']

    def __str__(self):
        return f'{self.product.name} · {self.title}'


class ProductMedia(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='media')
    image = models.ImageField(upload_to='products/gallery/')
    alt = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

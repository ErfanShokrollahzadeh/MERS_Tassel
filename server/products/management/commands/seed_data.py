"""
Management command to seed the database with sample product data
for MERS Tassel accessories store.
"""
import os
from django.conf import settings
from django.core.management.base import BaseCommand
from products.models import Category, Product, ProductVariant


class Command(BaseCommand):
    help = 'Seed database with sample MERS Tassel products'

    def handle(self, *args, **options):
        self.stdout.write('🌸 Seeding MERS Tassel database...')

        # Create categories
        categories_data = [
            {
                'name': 'Necklaces',
                'slug': 'necklaces',
                'description': 'Beautiful handcrafted necklaces with unique tassel designs'
            },
            {
                'name': 'Pendants',
                'slug': 'pendants',
                'description': 'Elegant pendants featuring artisan craftsmanship'
            },
            {
                'name': 'Bag Accessories',
                'slug': 'bag-accessories',
                'description': 'Stylish bag charms and accessories to elevate your look'
            },
            {
                'name': 'Jasuichi',
                'slug': 'jasuichi',
                'description': 'Traditional Jasuichi accessories with modern flair'
            },
            {
                'name': 'Solid Azon',
                'slug': 'solid-azon',
                'description': 'Premium solid azon pieces for every occasion'
            },
            {
                'name': 'Cute Accessories',
                'slug': 'cute-accessories',
                'description': 'Adorable accessories that add charm to any outfit'
            },
            {'name': 'Rings', 'slug': 'rings', 'description': 'Sculptural rings finished by hand'},
            {'name': 'Earrings', 'slug': 'earrings', 'description': 'Light-catching earrings for every day'},
            {'name': 'Bracelets', 'slug': 'bracelets', 'description': 'Fluid chains and modern talismans'},
            {'name': 'Bag Charms', 'slug': 'bag-charms', 'description': 'Small tactile objects for bags and keys'},
        ]

        categories = {}
        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            categories[cat.slug] = cat
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'  📁 Category: {cat.name} - {status}')

        # ── Map of available media files to product slugs ────────────────
        # The seed images live in MEDIA_ROOT/products/; we assign them here
        # so every product shows an image on the storefront.
        media_dir = os.path.join(settings.MEDIA_ROOT, 'products')
        available_media = set(os.listdir(media_dir)) if os.path.isdir(media_dir) else set()

        def pick_image(filename):
            """Return relative upload path if the file exists on disk."""
            if filename in available_media:
                return f'products/{filename}'
            return ''

        # Create products
        products_data = [
            # Necklaces
            {
                'name': 'Rose Gold Tassel Necklace',
                'slug': 'rose-gold-tassel-necklace',
                'category': categories['necklaces'],
                'description': 'A stunning rose gold tassel necklace that drapes elegantly. Handcrafted with premium materials, this piece adds a touch of luxury to any outfit.',
                'price': 149.99,
                'discount_price': 119.99,
                'is_featured': True,
                'image': pick_image('necklace-1.webp'),
            },
            {
                'name': 'Pearl Drop Chain Necklace',
                'slug': 'pearl-drop-chain-necklace',
                'category': categories['necklaces'],
                'description': 'Delicate pearl drops on a fine chain. Perfect for both casual and formal occasions.',
                'price': 89.99,
                'is_featured': True,
                'image': pick_image('necklace2.webp'),
            },
            {
                'name': 'Boho Layered Necklace Set',
                'slug': 'boho-layered-necklace-set',
                'category': categories['necklaces'],
                'description': 'A set of three layered necklaces with bohemian-inspired charms and crystals.',
                'price': 199.99,
                'discount_price': 159.99,
                'is_featured': False,
                'image': pick_image('necklace3.webp'),
            },
            # Pendants
            {
                'name': 'Crystal Moon Pendant',
                'slug': 'crystal-moon-pendant',
                'category': categories['pendants'],
                'description': 'A mesmerizing crystal moon pendant that catches the light beautifully. Symbolizes elegance and mystery.',
                'price': 79.99,
                'is_featured': True,
                'image': pick_image('pendants1.webp'),
            },
            {
                'name': 'Vintage Heart Locket',
                'slug': 'vintage-heart-locket',
                'category': categories['pendants'],
                'description': 'A charming vintage-style heart locket that holds your precious memories. Gold-plated finish.',
                'price': 129.99,
                'discount_price': 99.99,
                'is_featured': True,
                'image': pick_image('pendants2.png'),
            },
            {
                'name': 'Butterfly Wings Pendant',
                'slug': 'butterfly-wings-pendant',
                'category': categories['pendants'],
                'description': 'Delicate butterfly wings pendant with iridescent enamel detailing.',
                'price': 69.99,
                'is_featured': False,
                'image': pick_image('pendants3.jpeg'),
            },
            # Bag Accessories
            {
                'name': 'Silk Tassel Bag Charm',
                'slug': 'silk-tassel-bag-charm',
                'category': categories['bag-accessories'],
                'description': 'Luxurious silk tassel bag charm in pastel colors. Instantly elevates any handbag.',
                'price': 39.99,
                'is_featured': True,
                'image': pick_image('bag_accessory1.webp'),
            },
            {
                'name': 'Beaded Keychain Charm',
                'slug': 'beaded-keychain-charm',
                'category': categories['bag-accessories'],
                'description': 'Colorful beaded keychain charm with a cute miniature tassel. Perfect gift idea.',
                'price': 24.99,
                'is_featured': False,
                'image': pick_image('bag_accessory2.webp'),
            },
            {
                'name': 'Leather Tassel Keyring',
                'slug': 'leather-tassel-keyring',
                'category': categories['bag-accessories'],
                'description': 'Premium leather tassel keyring with gold-tone hardware. Durable and stylish.',
                'price': 34.99,
                'is_featured': False,
                'image': pick_image('bag_accessory3.jpg'),
            },
            # Jasuichi
            {
                'name': 'Classic Jasuichi Bracelet',
                'slug': 'classic-jasuichi-bracelet',
                'category': categories['jasuichi'],
                'description': 'Traditional Jasuichi-style bracelet with intricate woven patterns and gemstone accents.',
                'price': 159.99,
                'discount_price': 129.99,
                'is_featured': True,
                'image': pick_image('prayer_beads.jpg'),
            },
            {
                'name': 'Jasuichi Tassel Earrings',
                'slug': 'jasuichi-tassel-earrings',
                'category': categories['jasuichi'],
                'description': 'Elegant tassel earrings inspired by Jasuichi artistry. Lightweight and comfortable.',
                'price': 59.99,
                'is_featured': False,
                'image': pick_image('prayer_beads_2.jpg'),
            },
            # Solid Azon
            {
                'name': 'Solid Azon Statement Ring',
                'slug': 'solid-azon-statement-ring',
                'category': categories['solid-azon'],
                'description': 'Bold solid azon statement ring with a geometric design. Makes a lasting impression.',
                'price': 109.99,
                'is_featured': True,
                'image': pick_image('keychain1.webp'),
            },
            {
                'name': 'Solid Azon Cuff Bracelet',
                'slug': 'solid-azon-cuff-bracelet',
                'category': categories['solid-azon'],
                'description': 'Sleek solid azon cuff bracelet with hammered texture. Adjustable fit.',
                'price': 139.99,
                'discount_price': 109.99,
                'is_featured': False,
                'image': pick_image('keychain2.jpg'),
            },
            # Cute Accessories
            {
                'name': 'Mini Flower Hair Clips Set',
                'slug': 'mini-flower-hair-clips-set',
                'category': categories['cute-accessories'],
                'description': 'Set of 6 adorable mini flower hair clips in assorted pastel colors. Perfect for daily wear.',
                'price': 19.99,
                'is_featured': True,
                'image': pick_image('earring1.webp'),
            },
            {
                'name': 'Kawaii Cat Ear Headband',
                'slug': 'kawaii-cat-ear-headband',
                'category': categories['cute-accessories'],
                'description': 'Super cute cat ear headband with sparkly rhinestone details. Fun and fashionable.',
                'price': 29.99,
                'is_featured': False,
                'image': pick_image('earring2.jpeg'),
            },
            {
                'name': 'Rainbow Charm Bracelet',
                'slug': 'rainbow-charm-bracelet',
                'category': categories['cute-accessories'],
                'description': 'Colorful rainbow charm bracelet with dangling star and heart charms. Spreads joy!',
                'price': 44.99,
                'discount_price': 34.99,
                'is_featured': False,
                'image': pick_image('earring3.png'),
            },
            {
                'name': 'Lâle Pearl Tassel', 'slug': 'lale-pearl-tassel', 'category': categories['necklaces'],
                'description': 'Freshwater pearls, hand-knotted silk and a warm vermeil finish.', 'price': 189, 'discount_price': 149,
                'is_featured': True, 'colors': ['Rose', 'Ivory', 'Midnight'],
                'image': pick_image('necklace-1.webp'),
            },
            {
                'name': 'Sedef Moon Pendant', 'slug': 'sedef-moon-pendant', 'category': categories['pendants'],
                'description': 'Mother-of-pearl catches the light in a sculptural crescent setting.', 'price': 92,
                'is_featured': True, 'colors': ['Gold', 'Silver'],
                'image': pick_image('pendants1.webp'),
            },
            {
                'name': 'Bosphorus Signet', 'slug': 'bosphorus-signet', 'category': categories['rings'],
                'description': 'A softly sculpted signet with an ocean-blue enamel center.', 'price': 118,
                'is_featured': True, 'colors': ['Bosphorus blue', 'Garnet'],
                'image': pick_image('keychain3.webp'),
            },
            {
                'name': 'Mira Drop Earrings', 'slug': 'mira-drop-earrings', 'category': categories['earrings'],
                'description': 'Light-catching drops balanced for all-evening comfort.', 'price': 98, 'discount_price': 78,
                'is_featured': True, 'colors': ['Gold', 'Silver'],
                'image': pick_image('earring1.webp'),
            },
            {
                'name': 'Nazar Chain Bracelet', 'slug': 'nazar-chain-bracelet', 'category': categories['bracelets'],
                'description': 'A refined protective eye motif on a fluid paperclip chain.', 'price': 64,
                'is_featured': False, 'colors': ['Lapis', 'Pearl'],
                'image': pick_image('prayer_beads.jpg'),
            },
            {
                'name': 'Haliç Crystal Pendant', 'slug': 'halic-crystal-pendant', 'category': categories['pendants'],
                'description': 'A faceted smoky crystal suspended from a whisper-fine chain.', 'price': 106,
                'is_featured': False, 'colors': ['Smoky quartz', 'Clear quartz'], 'stock': 0,
                'image': pick_image('pendants3.jpeg'),
            },
            {
                'name': 'Ada Layered Chain', 'slug': 'ada-layered-chain', 'category': categories['necklaces'],
                'description': 'Two delicate textures meet in an effortless, pre-layered necklace.', 'price': 134,
                'is_featured': False, 'colors': ['Silver', 'Gold'],
                'image': pick_image('necklace3.webp'),
            },
            {
                'name': 'Atelier Charm No. 7', 'slug': 'atelier-charm-no-7', 'category': categories['bag-charms'],
                'description': 'Knotted silk, polished stone and a clip made for daily ritual.', 'price': 46,
                'is_featured': False, 'colors': ['Mulberry', 'Sage', 'Saffron'],
                'image': pick_image('bag_accessory1.webp'),
            },
        ]

        for prod_data in products_data:
            colors = prod_data.pop('colors', None)
            stock = prod_data.pop('stock', 18)
            prod, created = Product.objects.update_or_create(
                slug=prod_data['slug'],
                defaults=prod_data
            )
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'  ✨ Product: {prod.name} - {status}')
            for index, color in enumerate(colors or ['Atelier finish'], start=1):
                ProductVariant.objects.get_or_create(
                    sku=f'MT-{prod.slug[:30].upper()}-{index}',
                    defaults={
                        'product': prod,
                        'title': color,
                        'color': color,
                        'stock': stock,
                        'low_stock_threshold': 5,
                    },
                )

        self.stdout.write(self.style.SUCCESS(
            f'\n🎉 Done! {Category.objects.count()} categories, {Product.objects.count()} products and {ProductVariant.objects.count()} variants seeded.'
        ))

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AnimatedSection from '@/components/AnimatedSection';
import ProductCard from '@/components/ProductCard';
import { getProducts, getCategories } from '@/lib/api';

// Fallback data
const fallbackProducts = [
  { id: 1, name: 'Rose Gold Tassel Necklace', slug: 'rose-gold-tassel-necklace', category_name: 'Necklaces', price: '149.99', discount_price: '119.99', is_on_sale: true, image: null },
  { id: 2, name: 'Pearl Drop Chain Necklace', slug: 'pearl-drop-chain-necklace', category_name: 'Necklaces', price: '89.99', discount_price: null, is_on_sale: false, image: null },
  { id: 3, name: 'Boho Layered Necklace Set', slug: 'boho-layered-necklace-set', category_name: 'Necklaces', price: '199.99', discount_price: '159.99', is_on_sale: true, image: null },
  { id: 4, name: 'Crystal Moon Pendant', slug: 'crystal-moon-pendant', category_name: 'Pendants', price: '79.99', discount_price: null, is_on_sale: false, image: null },
  { id: 5, name: 'Vintage Heart Locket', slug: 'vintage-heart-locket', category_name: 'Pendants', price: '129.99', discount_price: '99.99', is_on_sale: true, image: null },
  { id: 6, name: 'Butterfly Wings Pendant', slug: 'butterfly-wings-pendant', category_name: 'Pendants', price: '69.99', discount_price: null, is_on_sale: false, image: null },
  { id: 7, name: 'Silk Tassel Bag Charm', slug: 'silk-tassel-bag-charm', category_name: 'Bag Accessories', price: '39.99', discount_price: null, is_on_sale: false, image: null },
  { id: 8, name: 'Beaded Keychain Charm', slug: 'beaded-keychain-charm', category_name: 'Bag Accessories', price: '24.99', discount_price: null, is_on_sale: false, image: null },
  { id: 9, name: 'Leather Tassel Keyring', slug: 'leather-tassel-keyring', category_name: 'Bag Accessories', price: '34.99', discount_price: null, is_on_sale: false, image: null },
  { id: 10, name: 'Classic Jasuichi Bracelet', slug: 'classic-jasuichi-bracelet', category_name: 'Jasuichi', price: '159.99', discount_price: '129.99', is_on_sale: true, image: null },
  { id: 11, name: 'Jasuichi Tassel Earrings', slug: 'jasuichi-tassel-earrings', category_name: 'Jasuichi', price: '59.99', discount_price: null, is_on_sale: false, image: null },
  { id: 12, name: 'Solid Azon Statement Ring', slug: 'solid-azon-statement-ring', category_name: 'Solid Azon', price: '109.99', discount_price: null, is_on_sale: false, image: null },
  { id: 13, name: 'Solid Azon Cuff Bracelet', slug: 'solid-azon-cuff-bracelet', category_name: 'Solid Azon', price: '139.99', discount_price: '109.99', is_on_sale: true, image: null },
  { id: 14, name: 'Mini Flower Hair Clips Set', slug: 'mini-flower-hair-clips-set', category_name: 'Cute Accessories', price: '19.99', discount_price: null, is_on_sale: false, image: null },
  { id: 15, name: 'Kawaii Cat Ear Headband', slug: 'kawaii-cat-ear-headband', category_name: 'Cute Accessories', price: '29.99', discount_price: null, is_on_sale: false, image: null },
  { id: 16, name: 'Rainbow Charm Bracelet', slug: 'rainbow-charm-bracelet', category_name: 'Cute Accessories', price: '44.99', discount_price: '34.99', is_on_sale: true, image: null },
];

const categoryList = [
  { slug: '', name: 'All Products' },
  { slug: 'necklaces', name: 'Necklaces' },
  { slug: 'pendants', name: 'Pendants' },
  { slug: 'bag-accessories', name: 'Bag Accessories' },
  { slug: 'jasuichi', name: 'Jasuichi' },
  { slug: 'solid-azon', name: 'Solid Azon' },
  { slug: 'cute-accessories', name: 'Cute Accessories' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [products, setProducts] = useState(fallbackProducts);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch products from API
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = {};
        if (activeCategory) params.category = activeCategory;
        if (searchTerm) params.search = searchTerm;
        const data = await getProducts(params);
        if (data && data.results && data.results.length > 0) {
          setProducts(data.results);
        } else if (data && Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          // Use fallback filtered
          filterFallback();
        }
      } catch (err) {
        console.log('Using fallback products:', err.message);
        filterFallback();
      } finally {
        setLoading(false);
      }
    }

    function filterFallback() {
      let filtered = [...fallbackProducts];
      if (activeCategory) {
        const catName = categoryList.find(c => c.slug === activeCategory)?.name || '';
        filtered = filtered.filter(p => p.category_name === catName);
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(term) ||
          p.category_name.toLowerCase().includes(term)
        );
      }
      setProducts(filtered);
    }

    loadProducts();
  }, [activeCategory, searchTerm]);

  // Update category from URL params
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    setActiveCategory(cat);
  }, [searchParams]);

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="floating-shape" style={{ width: 200, height: 200, top: '10%', left: '5%', animation: 'float 8s ease-in-out infinite' }}></div>
        <div className="floating-shape" style={{ width: 150, height: 150, bottom: '10%', right: '10%', animation: 'float 6s ease-in-out infinite reverse' }}></div>
        <div className="container">
          <h1>Our Collection</h1>
          <p>Discover handcrafted accessories that tell a story</p>
        </div>
      </div>

      <section className="section-mers">
        <div className="container">
          {/* Search Bar */}
          <AnimatedSection>
            <div className="row justify-content-center mb-4">
              <div className="col-lg-6 col-md-8">
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Search accessories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '16px 24px',
                      borderRadius: 'var(--radius-xl)',
                      border: '2px solid var(--gray-200)',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-body)',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--rose-gold)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                  />
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Category Filters */}
          <AnimatedSection>
            <div className="filter-buttons">
              {categoryList.map((cat) => (
                <button
                  key={cat.slug}
                  className={`filter-btn ${activeCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </AnimatedSection>

          {/* Loading */}
          {loading && <div className="spinner-mers"></div>}

          {/* Products Grid */}
          {!loading && (
            <>
              <p className="text-center mb-4" style={{ color: 'var(--gray-500)' }}>
                Showing {products.length} product{products.length !== 1 ? 's' : ''}
                {activeCategory && ` in ${categoryList.find(c => c.slug === activeCategory)?.name}`}
              </p>
              <div className="row g-4">
                {products.map((product, index) => (
                  <div className="col-lg-3 col-md-4 col-sm-6" key={product.id || index}>
                    <AnimatedSection delay={index * 80}>
                      <ProductCard product={product} />
                    </AnimatedSection>
                  </div>
                ))}
              </div>

              {products.length === 0 && (
                <div className="text-center py-5">
                  <p style={{ fontSize: '4rem', marginBottom: '16px' }}>🔍</p>
                  <h3 style={{ color: 'var(--gray-500)' }}>No products found</h3>
                  <p style={{ color: 'var(--gray-500)' }}>Try a different category or search term</p>
                  <button
                    className="btn-mers-primary mt-3"
                    onClick={() => { setActiveCategory(''); setSearchTerm(''); }}
                  >
                    View All Products
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="spinner-mers" style={{ marginTop: '200px' }}></div>}>
      <ProductsContent />
    </Suspense>
  );
}

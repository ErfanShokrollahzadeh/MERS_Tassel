'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import AnimatedSection from '@/components/AnimatedSection';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await getProductBySlug(slug);
        setProduct(data);
      } catch (err) {
        console.error('Failed to load product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  if (loading) {
    return <div className="spinner-mers" style={{ marginTop: '200px', marginBottom: '200px' }}></div>;
  }

  if (error || !product) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--gray-500)' }}>{t('product.not_found') || 'Product not found'}</h2>
        <button className="btn-mers-outline mt-4" onClick={() => router.push('/products')}>
          {t('product.back_to_products') || '← Back to Products'}
        </button>
      </div>
    );
  }

  const hasImage = product.image && !product.image.includes('undefined');
  const isOnSale = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price);

  return (
    <div className="section-mers" style={{ paddingTop: '140px' }}>
      <div className="container">
        <Link href="/products" className="d-inline-block mb-4" style={{ color: 'var(--gray-500)', textDecoration: 'none', fontWeight: '500' }}>
          {t('product.back_to_products') || '← Back to Products'}
        </Link>
        
        <div className="row">
          {/* Product Image */}
          <div className="col-lg-6 mb-5 mb-lg-0">
            <AnimatedSection>
              <div style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                backgroundColor: 'var(--gray-100)',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                aspectRatio: '1/1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isOnSale && (
                  <span className="product-card-badge" style={{ zIndex: 2, fontSize: '1rem', padding: '6px 16px' }}>
                    {t('general.sale')}
                  </span>
                )}
                {hasImage ? (
                  <img 
                    src={product.image} 
                    alt={product.image_alt || product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ fontSize: '6rem' }}>✨</div>
                )}
              </div>
            </AnimatedSection>
          </div>
          
          {/* Product Details */}
          <div className="col-lg-6">
            <AnimatedSection delay={200}>
              <div style={{ padding: '0 1rem' }}>
                <p style={{ color: 'var(--rose-gold)', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {product.category_name}
                </p>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--gray-900)', marginBottom: '16px' }}>
                  {product.name}
                </h1>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    ${isOnSale ? product.discount_price : product.price}
                  </span>
                  {isOnSale && (
                    <span style={{ fontSize: '1.25rem', color: 'var(--gray-400)', textDecoration: 'line-through' }}>
                      ${product.price}
                    </span>
                  )}
                </div>
                
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '12px' }}>
                    {t('product.description') || 'Description'}
                  </h4>
                  <p style={{ color: 'var(--gray-600)', lineHeight: '1.8' }}>
                    {product.description || 'No description available for this product.'}
                  </p>
                </div>
                
                <hr style={{ borderColor: 'var(--gray-200)', margin: '32px 0' }} />
                
                <Link href={`/checkout?product=${product.slug}`} className="btn-mers-primary w-100 text-center" style={{ padding: '16px 32px', fontSize: '1.1rem', textDecoration: 'none', display: 'block' }}>
                  {t('product.buy_now') || 'Buy Now'}
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}

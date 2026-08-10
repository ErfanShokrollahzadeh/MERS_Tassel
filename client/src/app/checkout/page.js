'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import AnimatedSection from '@/components/AnimatedSection';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productSlug = searchParams.get('product');
  const router = useRouter();
  const { t } = useLanguage();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    async function loadProduct() {
      if (!productSlug) {
        setError('No product selected');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await getProductBySlug(productSlug);
        setProduct(data);
      } catch (err) {
        console.error('Failed to load product for checkout:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [productSlug]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

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

  const isOnSale = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price);
  const finalPrice = isOnSale ? product.discount_price : product.price;

  if (isSuccess) {
    return (
      <div className="section-mers" style={{ paddingTop: '140px', minHeight: '80vh' }}>
        <div className="container text-center">
          <AnimatedSection>
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--gray-900)', marginBottom: '16px' }}>
                {t('checkout.success') || 'Payment Successful!'}
              </h2>
              <p style={{ color: 'var(--gray-600)', marginBottom: '32px', lineHeight: '1.6' }}>
                {t('checkout.success_desc') || 'Thank you for your purchase. We will process your order soon.'}
              </p>
              <Link href="/" className="btn-mers-primary" style={{ textDecoration: 'none' }}>
                {t('checkout.back_home') || 'Back to Home'}
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    );
  }

  return (
    <div className="section-mers" style={{ paddingTop: '140px' }}>
      <div className="container">
        <div className="text-center mb-5">
          <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--gray-900)' }}>{t('checkout.title') || 'Checkout'}</h1>
          <p style={{ color: 'var(--gray-500)' }}>{t('checkout.subtitle') || 'Complete your purchase'}</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-5 mb-4 order-lg-2">
            <AnimatedSection>
              <div style={{ backgroundColor: 'var(--gray-50)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '24px' }}>{t('checkout.order_summary') || 'Order Summary'}</h4>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {product.image && !product.image.includes('undefined') ? (
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '2rem' }}>✨</span>
                    )}
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{product.name}</h5>
                    <p style={{ margin: '0', color: 'var(--gray-500)', fontSize: '0.9rem' }}>{product.category_name}</p>
                  </div>
                </div>
                
                <hr style={{ borderColor: 'var(--gray-200)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                  <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{t('checkout.total') || 'Total'}</span>
                  <span style={{ fontWeight: '700', fontSize: '1.5rem', color: 'var(--rose-gold)' }}>${finalPrice}</span>
                </div>
              </div>
            </AnimatedSection>
          </div>

          <div className="col-lg-7 order-lg-1">
            <AnimatedSection delay={100}>
              <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '32px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '24px' }}>{t('checkout.payment_details') || 'Payment Details'}</h4>
                
                <div className="mb-3">
                  <label className="form-label">{t('auth.first_name') || 'Name'} *</label>
                  <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">{t('auth.email') || 'Email'} *</label>
                  <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                
                <div className="mb-4">
                  <label className="form-label">{t('checkout.address') || 'Shipping Address'} *</label>
                  <textarea className="form-control" name="address" rows="3" value={formData.address} onChange={handleInputChange} required></textarea>
                </div>
                
                <hr style={{ borderColor: 'var(--gray-200)', marginBottom: '24px' }} />
                
                <div className="mb-3">
                  <label className="form-label">{t('checkout.name_on_card') || 'Name on Card'} *</label>
                  <input type="text" className="form-control" name="nameOnCard" required />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">{t('checkout.card_number') || 'Card Number'} *</label>
                  <input type="text" className="form-control" name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} placeholder="0000 0000 0000 0000" required />
                </div>
                
                <div className="row mb-4">
                  <div className="col-6">
                    <label className="form-label">Expiry *</label>
                    <input type="text" className="form-control" name="expiry" value={formData.expiry} onChange={handleInputChange} placeholder="MM/YY" required />
                  </div>
                  <div className="col-6">
                    <label className="form-label">CVV *</label>
                    <input type="text" className="form-control" name="cvv" value={formData.cvv} onChange={handleInputChange} placeholder="123" required />
                  </div>
                </div>
                
                <button type="submit" className="btn-mers-primary w-100" disabled={isProcessing} style={{ padding: '16px', fontSize: '1.1rem' }}>
                  {isProcessing ? (t('checkout.processing') || 'Processing...') : (t('checkout.confirm_payment') || 'Confirm Payment')}
                </button>
              </form>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="spinner-mers" style={{ marginTop: '200px' }}></div>}>
      <CheckoutContent />
    </Suspense>
  );
}

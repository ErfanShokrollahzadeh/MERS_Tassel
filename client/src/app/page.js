'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import ProductCard from '@/components/ProductCard';
import VisitorStats from '@/components/VisitorStats';
import { getFeaturedProducts, getCategories } from '@/lib/api';

// Fallback data when API is not available
const fallbackProducts = [
  { id: 1, name: 'Rose Gold Tassel Necklace', slug: 'rose-gold-tassel-necklace', category_name: 'Necklaces', price: '149.99', discount_price: '119.99', is_on_sale: true, image: null },
  { id: 2, name: 'Crystal Moon Pendant', slug: 'crystal-moon-pendant', category_name: 'Pendants', price: '79.99', discount_price: null, is_on_sale: false, image: null },
  { id: 3, name: 'Silk Tassel Bag Charm', slug: 'silk-tassel-bag-charm', category_name: 'Bag Accessories', price: '39.99', discount_price: null, is_on_sale: false, image: null },
  { id: 4, name: 'Classic Jasuichi Bracelet', slug: 'classic-jasuichi-bracelet', category_name: 'Jasuichi', price: '159.99', discount_price: '129.99', is_on_sale: true, image: null },
  { id: 5, name: 'Pearl Drop Chain Necklace', slug: 'pearl-drop-chain-necklace', category_name: 'Necklaces', price: '89.99', discount_price: null, is_on_sale: false, image: null },
  { id: 6, name: 'Vintage Heart Locket', slug: 'vintage-heart-locket', category_name: 'Pendants', price: '129.99', discount_price: '99.99', is_on_sale: true, image: null },
  { id: 7, name: 'Solid Azon Statement Ring', slug: 'solid-azon-statement-ring', category_name: 'Solid Azon', price: '109.99', discount_price: null, is_on_sale: false, image: null },
  { id: 8, name: 'Mini Flower Hair Clips Set', slug: 'mini-flower-hair-clips-set', category_name: 'Cute Accessories', price: '19.99', discount_price: null, is_on_sale: false, image: null },
];

const categoryData = [
  { slug: 'necklaces', name: 'Necklaces', icon: '📿', desc: 'Elegant chain & tassel designs' },
  { slug: 'pendants', name: 'Pendants', icon: '💎', desc: 'Stunning crystal & gem pendants' },
  { slug: 'bag-accessories', name: 'Bag Accessories', icon: '👜', desc: 'Charms & keychains' },
  { slug: 'jasuichi', name: 'Jasuichi', icon: '✨', desc: 'Traditional artisan pieces' },
  { slug: 'solid-azon', name: 'Solid Azon', icon: '💍', desc: 'Bold statement pieces' },
  { slug: 'cute-accessories', name: 'Cute Accessories', icon: '🎀', desc: 'Adorable daily essentials' },
];

const testimonials = [
  {
    text: "The Rose Gold Tassel Necklace is absolutely stunning! The craftsmanship is incredible and I get compliments every time I wear it.",
    author: "Ayşe K.",
    stars: 5,
  },
  {
    text: "I ordered bag accessories for all my friends as gifts. They were thrilled! Beautiful quality and fast shipping from Turkey.",
    author: "Sarah M.",
    stars: 5,
  },
  {
    text: "MERS Tassel has the cutest accessories I've ever seen. The Jasuichi bracelet is now my everyday favorite!",
    author: "Elif D.",
    stars: 5,
  },
];

export default function HomePage() {
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFeaturedProducts();
        if (data && data.length > 0) {
          setProducts(data);
        }
      } catch (err) {
        console.log('Using fallback product data:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      {/* ====== HERO SECTION ====== */}
      <section className="hero-section">
        {/* Floating decorative elements */}
        <div className="hero-floating hero-floating-1"></div>
        <div className="hero-floating hero-floating-2"></div>
        <div className="hero-floating hero-floating-3"></div>

        <div className="container hero-content">
          <div className="row align-items-center min-vh-100">
            <div className="col-lg-7">
              <h1 className="hero-title">
                Discover the Art of<br />
                <span className="highlight">Handcrafted</span> Elegance
              </h1>
              <p className="hero-subtitle">
                Exquisite accessories crafted with love in Turkey. Each piece tells a story 
                of artistry, tradition, and modern charm.
              </p>
              <div className="d-flex gap-3 flex-wrap" style={{ animation: 'fadeInUp 1s 0.6s ease forwards', opacity: 0 }}>
                <Link href="/products" className="btn-mers-primary">
                  ✨ Explore Collection
                </Link>
                <Link href="/about" className="btn-mers-outline">
                  Our Story
                </Link>
              </div>

              {/* Stats */}
              <div className="row mt-5 pt-3" style={{ animation: 'fadeInUp 1s 0.9s ease forwards', opacity: 0 }}>
                <div className="col-4">
                  <h3 style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-heading)' }}>500+</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0 }}>Happy Customers</p>
                </div>
                <div className="col-4">
                  <h3 style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-heading)' }}>100+</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0 }}>Unique Designs</p>
                </div>
                <div className="col-4">
                  <h3 style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-heading)' }}>6</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0 }}>Categories</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURED PRODUCTS ====== */}
      <section className="section-mers">
        <div className="container">
          <AnimatedSection>
            <div className="section-title">
              <h2>Featured Collection</h2>
              <p>Handpicked favorites from our latest arrivals — each piece crafted with meticulous attention to detail</p>
            </div>
          </AnimatedSection>

          <div className="row g-4">
            {products.slice(0, 8).map((product, index) => (
              <div className="col-lg-3 col-md-4 col-sm-6" key={product.id}>
                <AnimatedSection delay={index * 100}>
                  <ProductCard product={product} />
                </AnimatedSection>
              </div>
            ))}
          </div>

          <AnimatedSection>
            <div className="text-center mt-5">
              <Link href="/products" className="btn-mers-primary">
                View All Products →
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ====== CATEGORIES ====== */}
      <section className="section-mers bg-soft">
        <div className="container">
          <AnimatedSection>
            <div className="section-title">
              <h2>Shop by Category</h2>
              <p>Browse our curated collections of handcrafted Turkish accessories</p>
            </div>
          </AnimatedSection>

          <div className="row g-4">
            {categoryData.map((cat, index) => (
              <div className="col-lg-2 col-md-4 col-6" key={cat.slug}>
                <AnimatedSection delay={index * 100}>
                  <Link href={`/products?category=${cat.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="category-card">
                      <span className="category-icon">{cat.icon}</span>
                      <h4>{cat.name}</h4>
                      <p>{cat.desc}</p>
                    </div>
                  </Link>
                </AnimatedSection>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== WHY CHOOSE US ====== */}
      <section className="section-mers">
        <div className="container">
          <AnimatedSection>
            <div className="section-title">
              <h2>Why Choose MERS Tassel</h2>
              <p>We pour our heart into every accessory we create</p>
            </div>
          </AnimatedSection>

          <div className="row g-4">
            {[
              { icon: '🎨', title: 'Handcrafted', desc: 'Each piece is carefully handcrafted by skilled artisans in Turkey using traditional techniques.' },
              { icon: '💎', title: 'Premium Quality', desc: 'We use only the finest materials — from sterling silver to natural gemstones and premium silks.' },
              { icon: '🚚', title: 'Worldwide Shipping', desc: 'We ship our accessories worldwide so everyone can enjoy Turkish craftsmanship.' },
              { icon: '💝', title: 'Gift Ready', desc: 'Every order comes beautifully packaged, perfect for gifting to your loved ones.' },
            ].map((feature, index) => (
              <div className="col-lg-3 col-md-6" key={index}>
                <AnimatedSection delay={index * 150}>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <span>{feature.icon}</span>
                    </div>
                    <h4 style={{ color: 'var(--deep-plum)', marginBottom: '12px' }}>{feature.title}</h4>
                    <p style={{ fontSize: '0.95rem' }}>{feature.desc}</p>
                  </div>
                </AnimatedSection>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="section-mers bg-soft">
        <div className="container">
          <AnimatedSection>
            <div className="section-title">
              <h2>What Our Customers Say</h2>
              <p>Join hundreds of happy customers who love MERS Tassel accessories</p>
            </div>
          </AnimatedSection>

          <div className="row g-4">
            {testimonials.map((testimonial, index) => (
              <div className="col-lg-4 col-md-6" key={index}>
                <AnimatedSection delay={index * 150}>
                  <div className="testimonial-card h-100">
                    <div className="testimonial-stars">
                      {'★'.repeat(testimonial.stars)}
                    </div>
                    <p className="testimonial-text">{testimonial.text}</p>
                    <p className="testimonial-author">— {testimonial.author}</p>
                  </div>
                </AnimatedSection>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA BANNER ====== */}
      <section className="section-mers bg-dark" style={{ textAlign: 'center' }}>
        <div className="container">
          <AnimatedSection>
            <h2 style={{ color: 'var(--white)', marginBottom: '16px' }}>
              Ready to Find Your Perfect Accessory?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '500px', margin: '0 auto 30px', fontSize: '1.1rem' }}>
              Explore our full collection and discover handcrafted treasures from Turkey.
            </p>
            <Link href="/products" className="btn-mers-gold">
              ✨ Shop the Collection
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}

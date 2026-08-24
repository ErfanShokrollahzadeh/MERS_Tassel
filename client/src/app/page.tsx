'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight, Gem, PackageCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { catalogKeys, fetchCategories, fetchFeaturedProducts, fetchSiteSettings } from '@/lib/catalog';
import { ProductTile } from '@/components/ProductTile';
import { MediaImage } from '@/components/MediaImage';
import { MagneticLink } from '@/components/MagneticLink';
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/DataStates';
import { useI18n } from '@/i18n/I18nProvider';
import { categoryName } from '@/i18n/catalog';
import { NewsletterForm } from '@/components/NewsletterForm';
import { KavanozBuilder } from '@/components/KavanozBuilder';
import { SurpriseBoxBuilder } from '@/components/SurpriseBoxBuilder';

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } };

export default function HomePage() {
  const { t, locale } = useI18n();
  const quoteVideoRef = useRef<HTMLVideoElement>(null);

  const featured = useQuery({ queryKey: catalogKeys.featured(4), queryFn: () => fetchFeaturedProducts(4) });
  const categories = useQuery({ queryKey: catalogKeys.categories(), queryFn: () => fetchCategories() });
  const settings = useQuery({ queryKey: catalogKeys.settings(), queryFn: () => fetchSiteSettings() });

  const hero = settings.data;
  const heroProduct = featured.data?.[0];
  const heroProductName = locale === 'tr' && heroProduct?.nameTr ? heroProduct.nameTr : heroProduct?.name;
  // Hero art comes from site settings, falling back to the leading product's photograph.
  const heroImage = hero?.heroImagePath || heroProduct?.image || '';

  const heroHeadline = locale === 'tr' && hero?.heroHeadlineTr ? hero.heroHeadlineTr : hero?.heroHeadline;
  const heroSub = locale === 'tr' && hero?.heroSubheadlineTr ? hero.heroSubheadlineTr : hero?.heroSubheadline;
  const heroEyebrow = locale === 'tr' && hero?.heroEyebrowTr ? hero.heroEyebrowTr : hero?.heroEyebrow;

  useEffect(() => {
    const video = quoteVideoRef.current;
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    video.muted = true;
    video.defaultMuted = true;
    const play = () => {
      if (document.visibilityState === 'visible') void video.play().catch(() => undefined);
    };
    const resumeOnVisibility = () => play();
    play();
    video.addEventListener('canplay', play);
    window.addEventListener('pageshow', play);
    document.addEventListener('visibilitychange', resumeOnVisibility);
    return () => {
      video.removeEventListener('canplay', play);
      window.removeEventListener('pageshow', play);
      document.removeEventListener('visibilitychange', resumeOnVisibility);
    };
  }, []);

  return (
    <>
      <section className="home-hero">
        <div className="ambient ambient--one" /><div className="ambient ambient--two" />
        <div className="container-wide home-hero__grid">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
            <span className="eyebrow"><i /> {heroEyebrow || t('home.eyebrow')}</span>
            <h1>{heroHeadline ? heroHeadline : <>{t('home.title1')}<br /><em>{t('home.title2')}</em></>}</h1>
            <p>{heroSub || t('home.lede')}</p>
            <div className="hero-actions"><MagneticLink className="button button--primary" href="/products">{t('common.explore')} <ArrowRight size={17} /></MagneticLink><Link className="button button--ghost" href="/about">{t('home.makers')}</Link></div>
            <div className="hero-proof"><div className="avatar-stack"><span>A</span><span>M</span><span>S</span></div><div><div className="stars">★★★★★</div><small>{t('home.proof')}</small></div></div>
          </motion.div>
          <motion.div className="hero-visual" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .9, delay: .1 }}>
            <div className="hero-image-wrap">
              {heroImage ? <MediaImage src={heroImage} alt={heroProductName || 'MERS Tassel'} sizes="(max-width: 720px) 92vw, 52vw" priority /> : <span className="skeleton-block hero-image-placeholder" />}
            </div>
            {heroProduct && (
              <div className="hero-float-card glass-panel">
                <span className="mini-label">{t('home.pick')}</span>
                <strong>{heroProductName}</strong>
                <span>{t('home.handknotted')}</span>
                <Link href={`/products/${heroProduct.slug}`} aria-label={t('home.viewProduct')}><ArrowRight size={17} /></Link>
              </div>
            )}
            <div className="hero-number">01</div>
          </motion.div>
        </div>
        <a className="scroll-cue" href="#collection"><ArrowDown size={16} /> {t('home.scroll')}</a>
      </section>

      <section className="trust-strip">
        <div className="container-wide trust-grid"><div><Sparkles /><span><strong>{t('home.handmade')}</strong><small>{t('home.handmadeSub')}</small></span></div><div><Gem /><span><strong>{t('home.materials')}</strong><small>{t('home.materialsSub')}</small></span></div><div><PackageCheck /><span><strong>{t('home.gift')}</strong><small>{t('home.giftSub')}</small></span></div></div>
      </section>

      <section className="section" id="collection">
        <div className="container-wide">
          <motion.div className="section-heading" {...reveal}><div><span className="eyebrow">{t('home.signature')}</span><h2>{t('home.keepClose')}</h2></div><Link href="/products">{t('home.shopAll')} <ArrowRight size={17} /></Link></motion.div>
          {featured.isPending && <ProductGridSkeleton count={4} />}
          {featured.isError && <ErrorState error={featured.error} onRetry={() => featured.refetch()} />}
          {featured.isSuccess && (featured.data.length
            ? <div className="product-grid">{featured.data.map((product, index) => <ProductTile key={product.id} product={product} priority={index < 2} />)}</div>
            : <EmptyState title={t('catalog.empty')} message={t('catalog.emptyCopy')} action={<Link className="button button--primary" href="/products">{t('catalog.viewAll')}</Link>} />)}
        </div>
      </section>

      <section className="section category-section">
        <div className="container-wide">
          <motion.div className="center-heading" {...reveal}><span className="eyebrow">{t('home.ritual')}</span><h2>{t('home.everyday1')}<br /><em>{t('home.everyday2')}</em></h2></motion.div>
          {categories.isPending && <ProductGridSkeleton count={4} />}
          {categories.isError && <ErrorState error={categories.error} onRetry={() => categories.refetch()} />}
          {categories.isSuccess && (
            <div className="category-grid">
              {categories.data.filter((category) => category.count > 0).map((category, index) => (
                <motion.div key={category.slug} {...reveal} transition={{ ...reveal.transition, delay: index * .08 }}>
                  <Link href={`/products?category=${category.slug}`} className="category-card">
                    {category.image ? <MediaImage src={category.image} alt="" sizes="(max-width: 720px) 50vw, 25vw" /> : <span className="skeleton-block" />}
                    <div className="category-card__veil" />
                    <div className="category-card__copy"><span>{String(index + 1).padStart(2, '0')}</span><h3>{categoryName(category, locale)}</h3><p>{t('home.pieces', { count: category.count })}</p><i><ArrowUpRight /></i></div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <KavanozBuilder />

      <SurpriseBoxBuilder />

      {heroProduct && (
        <section className="editorial-section">
          <div className="editorial-image">
            <MediaImage src={featured.data?.at(-1)?.image || heroProduct.image} alt={t('common.studioDetailAlt')} sizes="(max-width: 720px) 100vw, 55vw" />
            <span className="editorial-caption">{t('home.atelierCaption')}</span>
          </div>
          <motion.div key={`editorial-${locale}`} className="editorial-copy" {...reveal}><span className="eyebrow">{t('home.hands')}</span><h2>{t('home.slowTitle')}</h2><p>{t('home.slowCopy')}</p><blockquote>{t('home.quote')}<cite>{t('home.quoteBy')}</cite></blockquote><Link className="text-link" href="/about">{t('home.stepInside')} <ArrowRight size={17} /></Link></motion.div>
        </section>
      )}

      <section className="section quote-section">
        <video ref={quoteVideoRef} className="quote-section__video" autoPlay muted loop playsInline preload="auto" poster="/images/pearl-necklace-testimonial.webp" disablePictureInPicture aria-hidden="true" tabIndex={-1}>
          <source src="/videos/pearl-necklace-testimonial.mp4" type="video/mp4" />
        </video>
        <motion.div key={`review-${locale}`} className="container-narrow" {...reveal}><div className="quote-mark">“</div><blockquote>{t('home.review')}</blockquote><div className="quote-author"><div><strong>{t('home.reviewAuthor')}</strong><small>{t('home.reviewLocation')}</small></div></div></motion.div>
      </section>

      <section className="newsletter-band"><div className="ambient ambient--three" /><div className="container-wide newsletter-grid"><div><span className="eyebrow">{t('home.letters')}</span><h2>{t('home.inbox')}</h2><p>{t('home.inboxCopy')}</p></div><NewsletterForm source="home" /></div></section>
    </>
  );
}

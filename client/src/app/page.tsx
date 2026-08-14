'use client';

import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight, Gem, PackageCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { categories, products } from '@/data/store';
import { ProductTile } from '@/components/ProductTile';
import { MediaImage } from '@/components/MediaImage';
import { MagneticLink } from '@/components/MagneticLink';
import { useI18n } from '@/i18n/I18nProvider';
import { categoryName } from '@/i18n/catalog';

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } };

export default function HomePage() {
  const { t, locale } = useI18n();
  return (
    <>
      <section className="home-hero">
        <div className="ambient ambient--one" /><div className="ambient ambient--two" />
        <div className="container-wide home-hero__grid">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
            <span className="eyebrow"><i /> {t('home.eyebrow')}</span>
            <h1>{t('home.title1')}<br /><em>{t('home.title2')}</em></h1>
            <p>{t('home.lede')}</p>
            <div className="hero-actions"><MagneticLink className="button button--primary" href="/products">{t('common.explore')} <ArrowRight size={17} /></MagneticLink><Link className="button button--ghost" href="/about">{t('home.makers')}</Link></div>
            <div className="hero-proof"><div className="avatar-stack"><span>A</span><span>M</span><span>S</span></div><div><div className="stars">★★★★★</div><small>{t('home.proof')}</small></div></div>
          </motion.div>
          <motion.div className="hero-visual" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .9, delay: .1 }}>
            <div className="hero-image-wrap"><MediaImage src={products[0].image} alt="Lâle pearl tassel necklace" sizes="(max-width: 720px) 92vw, 52vw" priority /></div>
            <div className="hero-float-card glass-panel"><span className="mini-label">{t('home.pick')}</span><strong>Lâle Pearl Tassel</strong><span>{t('home.handknotted')}</span><Link href={`/products/${products[0].slug}`} aria-label={t('home.viewProduct')}><ArrowRight size={17} /></Link></div>
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
          <div className="product-grid">{products.filter((product) => product.isFeatured).map((product, index) => <ProductTile key={product.id} product={product} priority={index < 2} />)}</div>
        </div>
      </section>

      <section className="section category-section">
        <div className="container-wide">
          <motion.div className="center-heading" {...reveal}><span className="eyebrow">{t('home.ritual')}</span><h2>{t('home.everyday1')}<br /><em>{t('home.everyday2')}</em></h2></motion.div>
          <div className="category-grid">{categories.map((category, index) => <motion.div key={category.slug} {...reveal} transition={{ ...reveal.transition, delay: index * .08 }}><Link href={`/products?category=${category.slug}`} className="category-card"><MediaImage src={category.image} alt="" sizes="(max-width: 720px) 50vw, 25vw" /><div className="category-card__veil" /><div className="category-card__copy"><span>0{index + 1}</span><h3>{categoryName(category.name, locale)}</h3><p>{t('home.pieces', { count: category.count })}</p><i><ArrowUpRight /></i></div></Link></motion.div>)}</div>
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-image"><MediaImage src={products[7].image} alt="Details from the MERS Tassel studio" sizes="(max-width: 720px) 100vw, 55vw" /><span className="editorial-caption">{t('home.atelierCaption')}</span></div>
        <motion.div className="editorial-copy" {...reveal}><span className="eyebrow">{t('home.hands')}</span><h2>{t('home.slowTitle')}</h2><p>{t('home.slowCopy')}</p><blockquote>{t('home.quote')}<cite>{t('home.quoteBy')}</cite></blockquote><Link className="text-link" href="/about">{t('home.stepInside')} <ArrowRight size={17} /></Link></motion.div>
      </section>

      <section className="section quote-section"><motion.div className="container-narrow" {...reveal}><div className="quote-mark">“</div><blockquote>{t('home.review')}</blockquote><div className="quote-author"><span>AK</span><div><strong>Ayşe K.</strong><small>{t('home.verified')}</small></div></div></motion.div></section>

      <section className="newsletter-band"><div className="ambient ambient--three" /><div className="container-wide newsletter-grid"><div><span className="eyebrow">{t('home.letters')}</span><h2>{t('home.inbox')}</h2><p>{t('home.inboxCopy')}</p></div><form onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="newsletter-email">{t('footer.email')}</label><input id="newsletter-email" type="email" placeholder="you@example.com" required /><button className="button button--light">{t('home.join')} <ArrowRight size={17} /></button><small>{t('home.privacy')}</small></form></div></section>
    </>
  );
}

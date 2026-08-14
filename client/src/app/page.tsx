'use client';

import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight, Gem, PackageCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { categories, products } from '@/data/store';
import { ProductTile } from '@/components/ProductTile';
import { MediaImage } from '@/components/MediaImage';
import { MagneticLink } from '@/components/MagneticLink';

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } };

export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="ambient ambient--one" /><div className="ambient ambient--two" />
        <div className="container-wide home-hero__grid">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
            <span className="eyebrow"><i /> Istanbul · Est. 2018</span>
            <h1>Wear a little<br /><em>wonder.</em></h1>
            <p>Jewelry with a sense of place—hand-finished in our Istanbul atelier, made to gather stories as beautifully as it gathers light.</p>
            <div className="hero-actions"><MagneticLink className="button button--primary" href="/products">Explore the collection <ArrowRight size={17} /></MagneticLink><Link className="button button--ghost" href="/about">Meet the makers</Link></div>
            <div className="hero-proof"><div className="avatar-stack"><span>A</span><span>M</span><span>S</span></div><div><div className="stars">★★★★★</div><small>Loved by 2,400+ collectors</small></div></div>
          </motion.div>
          <motion.div className="hero-visual" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .9, delay: .1 }}>
            <div className="hero-image-wrap"><MediaImage src={products[0].image} alt="Lâle pearl tassel necklace" sizes="(max-width: 720px) 92vw, 52vw" priority /></div>
            <div className="hero-float-card glass-panel"><span className="mini-label">Atelier pick</span><strong>Lâle Pearl Tassel</strong><span>Hand-knotted silk · $149</span><Link href={`/products/${products[0].slug}`} aria-label="View Lâle Pearl Tassel"><ArrowRight size={17} /></Link></div>
            <div className="hero-number">01</div>
          </motion.div>
        </div>
        <a className="scroll-cue" href="#collection"><ArrowDown size={16} /> Scroll to discover</a>
      </section>

      <section className="trust-strip">
        <div className="container-wide trust-grid"><div><Sparkles /><span><strong>Made by hand</strong><small>In our Istanbul atelier</small></span></div><div><Gem /><span><strong>Considered materials</strong><small>Selected for beauty & longevity</small></span></div><div><PackageCheck /><span><strong>Gift-ready always</strong><small>Wrapped with a handwritten note</small></span></div></div>
      </section>

      <section className="section" id="collection">
        <div className="container-wide">
          <motion.div className="section-heading" {...reveal}><div><span className="eyebrow">The signature edit</span><h2>Pieces to keep close.</h2></div><Link href="/products">Shop all pieces <ArrowRight size={17} /></Link></motion.div>
          <div className="product-grid">{products.filter((product) => product.isFeatured).map((product, index) => <ProductTile key={product.id} product={product} priority={index < 2} />)}</div>
        </div>
      </section>

      <section className="section category-section">
        <div className="container-wide">
          <motion.div className="center-heading" {...reveal}><span className="eyebrow">Find your ritual</span><h2>Made for every day,<br /><em>and the days you remember.</em></h2></motion.div>
          <div className="category-grid">{categories.map((category, index) => <motion.div key={category.slug} {...reveal} transition={{ ...reveal.transition, delay: index * .08 }}><Link href={`/products?category=${category.slug}`} className="category-card"><MediaImage src={category.image} alt="" sizes="(max-width: 720px) 50vw, 25vw" /><div className="category-card__veil" /><div className="category-card__copy"><span>0{index + 1}</span><h3>{category.name}</h3><p>{category.count} pieces</p><i><ArrowUpRight /></i></div></Link></motion.div>)}</div>
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-image"><MediaImage src={products[7].image} alt="Details from the MERS Tassel studio" sizes="(max-width: 720px) 100vw, 55vw" /><span className="editorial-caption">The atelier · Karaköy, Istanbul</span></div>
        <motion.div className="editorial-copy" {...reveal}><span className="eyebrow">Hands before machines</span><h2>Nothing meaningful is made in a hurry.</h2><p>Every MERS piece passes between the hands of our small team—from sketch to stone selection, knotting, polishing and the final, quiet inspection.</p><blockquote>“We make each object as if it were already someone’s keepsake.”<cite>— Meral S., founder & maker</cite></blockquote><Link className="text-link" href="/about">Step inside the atelier <ArrowRight size={17} /></Link></motion.div>
      </section>

      <section className="section quote-section"><motion.div className="container-narrow" {...reveal}><div className="quote-mark">“</div><blockquote>Even lovelier in person. It feels thoughtful from the first touch—the weight, the tiny details, even the box.</blockquote><div className="quote-author"><span>AK</span><div><strong>Ayşe K.</strong><small>Verified collector · Istanbul</small></div></div></motion.div></section>

      <section className="newsletter-band"><div className="ambient ambient--three" /><div className="container-wide newsletter-grid"><div><span className="eyebrow">Letters from the atelier</span><h2>A slower kind of inbox.</h2><p>New objects, studio notes and Istanbul details. Sent sparingly.</p></div><form onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" placeholder="you@example.com" required /><button className="button button--light">Join the list <ArrowRight size={17} /></button><small>By subscribing, you agree to our privacy terms.</small></form></div></section>
    </>
  );
}

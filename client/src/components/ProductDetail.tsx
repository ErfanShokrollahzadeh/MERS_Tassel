'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronDown, Heart, Minus, PackageCheck, Plus, RotateCcw, ShieldCheck, Star } from 'lucide-react';
import { Product } from '@/types/commerce';
import { useCartStore } from '@/stores/cart';
import { ProductTile } from '@/components/ProductTile';
import { products } from '@/data/store';
import { MediaImage } from '@/components/MediaImage';
import { AnimatePresence, motion } from 'framer-motion';

export function ProductDetail({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [openDetail, setOpenDetail] = useState('story');
  const add = useCartStore((state) => state.add);
  const related = products.filter((item) => item.id !== product.id).slice(0, 4);

  const addSelected = () => { for (let i = 0; i < quantity; i += 1) add(product, color); };

  return (
    <div className="pdp-page">
      <div className="container-wide breadcrumb"><Link href="/products"><ArrowLeft size={14} /> Collection</Link><span>/</span><span>{product.category}</span><span>/</span><span>{product.name}</span></div>
      <section className="pdp-layout container-wide">
        <div className="pdp-gallery"><div className="pdp-thumbs" role="list">{product.images.map((image, index) => <button key={image} className={activeImage === index ? 'active' : ''} onClick={() => setActiveImage(index)} aria-label={`View image ${index + 1}`}><MediaImage src={image} alt="" sizes="82px" /></button>)}</div><div className="pdp-main-image"><AnimatePresence mode="wait"><motion.div className="pdp-image-motion" key={product.images[activeImage]} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .32 }}><MediaImage src={product.images[activeImage]} alt={`${product.name}, view ${activeImage + 1}`} sizes="(max-width: 900px) 100vw, 55vw" priority={activeImage === 0} /></motion.div></AnimatePresence><button className="pdp-save" aria-label="Save this piece"><Heart size={18} /></button><span>Hover to explore detail</span></div></div>
        <div className="pdp-info">
          <span className="eyebrow">{product.category} · Made by hand</span><h1>{product.name}</h1>
          <div className="pdp-rating"><span><Star size={13} fill="currentColor" /> {product.rating}</span><a href="#reviews">{product.reviews} stories</a></div>
          <div className="pdp-price"><strong>${product.price.amount}</strong>{product.compareAt && <><del>${product.compareAt.amount}</del><span>You save ${product.compareAt.amount - product.price.amount}</span></>}</div>
          <p className="pdp-lede">{product.description}</p>
          <div className="pdp-option"><div><span>Finish</span><strong>{color}</strong></div><div className="swatches">{product.colors.map((option) => <button key={option} className={color === option ? 'active' : ''} onClick={() => setColor(option)} aria-label={`Choose ${option}`}><i style={{ background: option.toLowerCase().includes('silver') || option === 'Ivory' ? '#d8d5cf' : option.toLowerCase().includes('blue') || option === 'Lapis' ? '#244760' : option === 'Garnet' || option === 'Mulberry' || option === 'Rose' ? '#81435c' : '#bd9057' }} />{color === option && <Check size={12} />}</button>)}</div></div>
          <div className="purchase-row"><div className="quantity-control quantity-control--large"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} aria-label="Increase quantity"><Plus size={15} /></button></div><button className="button button--primary pdp-add" disabled={product.stock === 0} onClick={addSelected}>{product.stock === 0 ? 'Join the waitlist' : `Add to bag · $${product.price.amount * quantity}`}</button></div>
          {product.stock > 0 && product.stock < 8 && <div className="stock-note"><i /><span>Only {product.stock} left in the atelier</span></div>}
          <div className="pdp-benefits"><div><PackageCheck /><span><strong>Complimentary delivery</strong><small>On orders over $120</small></span></div><div><RotateCcw /><span><strong>Thoughtful returns</strong><small>Within 30 days</small></span></div><div><ShieldCheck /><span><strong>Two-year care</strong><small>Repairs from our atelier</small></span></div></div>
          <div className="pdp-accordions">{[
            ['story', 'Story & details', product.story], ['materials', 'Materials & dimensions', `${product.material}. ${product.dimensions}. Each piece is finished by hand, so subtle variations are part of its character.`], ['care', 'Care guide', 'Keep dry and away from perfume. Wipe gently with the supplied soft cloth, then store in its pouch between wears.'],
          ].map(([id, title, body]) => <div key={id}><button onClick={() => setOpenDetail(openDetail === id ? '' : id)} aria-expanded={openDetail === id}><span>{title}</span><ChevronDown className={openDetail === id ? 'rotated' : ''} size={17} /></button><AnimatePresence initial={false}>{openDetail === id && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .28 }} className="accordion-panel"><p>{body}</p></motion.div>}</AnimatePresence></div>)}</div>
        </div>
      </section>
      <section className="section related-section"><div className="container-wide"><div className="section-heading"><div><span className="eyebrow">Continue exploring</span><h2>You may also love.</h2></div></div><div className="product-grid">{related.map((item) => <ProductTile key={item.id} product={item} />)}</div></div></section>
    </div>
  );
}

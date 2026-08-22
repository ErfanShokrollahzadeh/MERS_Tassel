'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Check, ChevronDown, Heart, Minus, PackageCheck, Plus, RotateCcw, ShieldCheck, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Product } from '@/types/commerce';
import { useCartStore } from '@/stores/cart';
import { ProductTile } from '@/components/ProductTile';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { colorName, colorSwatch, productCopy } from '@/i18n/catalog';
import { useAuthStore } from '@/stores/auth';

export function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState(product.colors[0] ?? '');
  const [quantity, setQuantity] = useState(1);
  const [openDetail, setOpenDetail] = useState('story');

  const add = useCartStore((state) => state.add);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const display = productCopy(product, locale);

  // Stock is per finish, so the stepper and the sold-out state follow the selected variant.
  const selectedVariant = product.variants.find((variant) => variant.color === color);
  const availableStock = selectedVariant?.stock ?? product.stock;
  const price = selectedVariant?.price ?? product.price.amount;

  const addSelected = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    void add(product.slug, color, quantity);
  };

  const images = product.images.length ? product.images : [product.image].filter(Boolean);

  return (
    <div className="pdp-page">
      <div className="container-wide breadcrumb"><Link href="/products"><ArrowLeft size={14} /> {t('pdp.collection')}</Link><span>/</span><span>{display.category}</span><span>/</span><span>{display.name}</span></div>

      <section className="pdp-layout container-wide">
        <div className="pdp-gallery">
          <div className="pdp-thumbs" role="list">
            {images.map((image, index) => (
              <button key={image} className={activeImage === index ? 'active' : ''} onClick={() => setActiveImage(index)} aria-label={`${display.name} ${index + 1}`}>
                <MediaImage src={image} alt="" sizes="82px" />
              </button>
            ))}
          </div>
          <div className="pdp-main-image">
            <AnimatePresence mode="wait">
              <motion.div className="pdp-image-motion" key={images[activeImage]} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .32 }}>
                <MediaImage src={images[activeImage]} alt={`${display.name}, ${t('pdp.viewIndex', { index: activeImage + 1 })}`} sizes="(max-width: 900px) 100vw, 55vw" priority={activeImage === 0} />
              </motion.div>
            </AnimatePresence>
            <button className="pdp-save" aria-label={t('product.savePiece', { name: display.name })}><Heart size={18} /></button>
            <span>{t('pdp.exploreDetail')}</span>
          </div>
        </div>

        <div className="pdp-info">
          <span className="eyebrow">{display.category} · {t('pdp.handmade')}</span><h1>{display.name}</h1>
          <div className="pdp-rating"><span><Star size={13} fill="currentColor" /> {product.rating}</span><a href="#reviews">{t('pdp.stories', { count: product.reviews })}</a></div>
          <div className="pdp-price"><strong>${price}</strong>{product.compareAt && <><del>${product.compareAt.amount}</del><span>{t('pdp.saveAmount', { amount: product.compareAt.amount - price })}</span></>}</div>
          <p className="pdp-lede">{display.description}</p>

          {product.colors.length > 0 && (
            <div className="pdp-option">
              <div><span>{t('pdp.finish')}</span><strong>{colorName(color, product.variants, locale)}</strong></div>
              <div className="swatches">
                {product.colors.map((option) => {
                  const variant = product.variants.find((candidate) => candidate.color === option);
                  const soldOut = (variant?.stock ?? 0) === 0;
                  return (
                    <button
                      key={option}
                      className={`${color === option ? 'active' : ''}${soldOut ? ' swatch--soldout' : ''}`}
                      onClick={() => { setColor(option); setQuantity(1); }}
                      aria-label={t('pdp.choose', { option: colorName(option, product.variants, locale) })}
                    >
                      <i style={{ background: colorSwatch(option, product.variants) }} />
                      {color === option && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="purchase-row">
            <div className="quantity-control quantity-control--large">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label={t('cart.decrease')}><Minus size={15} /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(Math.max(availableStock, 1), quantity + 1))} aria-label={t('cart.increase')}><Plus size={15} /></button>
            </div>
            <button className="button button--primary pdp-add" disabled={availableStock === 0} onClick={addSelected}>
              {availableStock === 0 ? t('pdp.waitlist') : t('pdp.add', { amount: price * quantity })}
            </button>
          </div>

          {availableStock > 0 && availableStock < 8 && <div className="stock-note"><i /><span>{t('pdp.stock', { count: availableStock })}</span></div>}

          <div className="pdp-benefits"><div><PackageCheck /><span><strong>{t('pdp.delivery')}</strong><small>{t('pdp.deliverySub')}</small></span></div><div><RotateCcw /><span><strong>{t('pdp.returns')}</strong><small>{t('pdp.returnsSub')}</small></span></div><div><ShieldCheck /><span><strong>{t('pdp.care')}</strong><small>{t('pdp.careSub')}</small></span></div></div>

          <div className="pdp-accordions">
            {([
              ['story', t('pdp.story'), display.story],
              ['materials', t('pdp.materials'), `${display.material}. ${display.dimensions}. ${t('pdp.variation')}`],
              ['care', t('pdp.careGuide'), t('pdp.careCopy')],
            ] as const).map(([id, title, body]) => (
              <div key={id}>
                <button onClick={() => setOpenDetail(openDetail === id ? '' : id)} aria-expanded={openDetail === id}><span>{title}</span><ChevronDown className={openDetail === id ? 'rotated' : ''} size={17} /></button>
                <AnimatePresence initial={false}>
                  {openDetail === id && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .28 }} className="accordion-panel"><p>{body}</p></motion.div>}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section related-section">
          <div className="container-wide">
            <div className="section-heading"><div><span className="eyebrow">{t('pdp.related')}</span><h2>{t('pdp.love')}</h2></div></div>
            <div className="product-grid">{related.map((item) => <ProductTile key={item.id} product={item} />)}</div>
          </div>
        </section>
      )}
    </div>
  );
}

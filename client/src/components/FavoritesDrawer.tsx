'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, ShoppingBag, X } from 'lucide-react';
import { MediaImage } from '@/components/MediaImage';
import { useFavoritesStore } from '@/stores/favorites';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from '@/i18n/I18nProvider';
import { formatMoney } from '@/lib/money';

export function FavoritesDrawer() {
  const { items, isOpen, close, removeFavorite } = useFavoritesStore();
  const add = useCartStore((state) => state.add);
  const user = useAuthStore((state) => state.user);
  const { t, locale } = useI18n();
  const panel = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab' || !panel.current) return;
      const controls = Array.from(panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'));
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previousFocus.current?.focus(); };
  }, [close, isOpen]);

  return <AnimatePresence>{isOpen && <motion.div className="favorites-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <button className="drawer-scrim" onClick={close} aria-label={t('favorites.close')} />
    <motion.aside ref={panel} className="favorites-drawer glass-overlay" role="dialog" aria-modal="true" aria-labelledby="favorites-title" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }}>
      <header className="drawer-header"><div><span className="eyebrow">{t('favorites.eyebrow')}</span><h2 id="favorites-title">{t('favorites.title')}</h2></div><button ref={closeButton} className="icon-button" onClick={close} aria-label={t('favorites.close')}><X /></button></header>
      {items.length === 0 ? <div className="empty-cart"><span><Heart size={28} /></span><h3>{t('favorites.empty')}</h3><p>{t('favorites.emptyCopy')}</p><Link className="button button--primary" href="/products" onClick={close}>{t('common.continueShopping')}</Link></div> :
        <div className="favorites-lines"><AnimatePresence initial={false}>{items.map((item) => {
          const name = locale === 'tr' && item.nameTr ? item.nameTr : item.name;
          const category = locale === 'tr' && item.categoryTr ? item.categoryTr : item.category;
          return <motion.article className="favorite-line" layout key={item.slug} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30, height: 0 }}>
            <Link href={`/products/${item.slug}`} onClick={close}><MediaImage src={item.image} alt="" sizes="92px" /></Link>
            <div><small>{category}</small><Link href={`/products/${item.slug}`} onClick={close}><h3>{name}</h3></Link><strong>{formatMoney(item.price, locale)}</strong>
              <div className="favorite-line__actions"><button className="button button--primary" disabled={!item.stock || !user} onClick={() => void add(item.slug, item.color)}><ShoppingBag size={14} />{item.stock ? t('favorites.quickAdd') : t('product.unavailable')}</button><button className="text-button" onClick={() => removeFavorite(item.slug)}>{t('favorites.remove')}</button></div>
              {!user && <small className="favorites-signin">{t('favorites.signIn')}</small>}
            </div>
          </motion.article>;
        })}</AnimatePresence></div>}
    </motion.aside>
  </motion.div>}</AnimatePresence>;
}

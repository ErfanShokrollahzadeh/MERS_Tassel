'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { cartSubtotal, useCartStore } from '@/stores/cart';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { colorName, productCopy } from '@/i18n/catalog';
import { useAuthStore } from '@/stores/auth';

export function CartDrawer() {
  const { lines, isOpen, close, remove, setQuantity } = useCartStore();
  const subtotal = useCartStore(cartSubtotal);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const estimatedShipping = subtotal >= 120 ? 0 : 9;
  const estimatedTax = subtotal * .08;
  const { t, locale } = useI18n();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!isOpen) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus.current?.focus();
    };
  }, [close, isOpen]);

  if (!user) return null;

  return (
    <div className={isOpen ? 'drawer-root drawer-root--open' : 'drawer-root'} aria-hidden={!isOpen}>
      <button className="drawer-scrim" onClick={close} aria-label={t('cart.close')} tabIndex={isOpen ? 0 : -1} />
      <aside ref={drawerRef} className="cart-drawer glass-overlay" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header className="drawer-header"><div><span className="eyebrow">{t('cart.eyebrow')}</span><h2 id="cart-title">{t('cart.title')}</h2></div><button ref={closeButtonRef} className="icon-button" onClick={close} aria-label={t('cart.close')}><X /></button></header>
        {lines.length === 0 ? (
          <div className="empty-cart"><span><ShoppingBag size={28} /></span><h3>{t('cart.emptyTitle')}</h3><p>{t('cart.emptyCopy')}</p><Link className="button button--primary" href="/products" onClick={close}>{t('common.explore')}</Link></div>
        ) : (
          <>
            <div className="cart-lines"><AnimatePresence initial={false}>
              {lines.map((line) => { const display = productCopy(line.product, locale); return (
                <motion.article className="cart-line" key={`${line.product.id}-${line.color}`} layout initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24, height: 0, paddingTop: 0, paddingBottom: 0 }}>
                  <MediaImage src={line.product.image} alt="" sizes="82px" />
                  <div className="cart-line__copy"><h3>{display.name}</h3><p>{colorName(line.color, locale)}</p><div className="quantity-control" aria-label={t('cart.quantity', { name: display.name })}><button onClick={() => setQuantity(line.product.id, line.color, line.quantity - 1)} aria-label={t('cart.decrease')}><Minus size={14} /></button><span>{line.quantity}</span><button onClick={() => setQuantity(line.product.id, line.color, line.quantity + 1)} aria-label={t('cart.increase')}><Plus size={14} /></button></div></div>
                  <div className="cart-line__end"><strong>${(line.product.price.amount * line.quantity).toFixed(0)}</strong><button onClick={() => remove(line.product.id, line.color)} aria-label={t('cart.remove', { name: display.name })}><Trash2 size={16} /></button></div>
                </motion.article>
              ); })}
            </AnimatePresence></div>
            <footer className="drawer-footer"><div className="cart-estimates"><p><span>{t('cart.subtotal')}</span><b>${subtotal.toFixed(0)}</b></p><p><span>{t('cart.delivery')}</span><b>{estimatedShipping ? `$${estimatedShipping}` : t('cart.complimentary')}</b></p><p><span>{t('cart.tax')}</span><b>${estimatedTax.toFixed(0)}</b></p><div><span>{t('cart.total')}</span><strong>${(subtotal + estimatedShipping + estimatedTax).toFixed(0)}</strong></div></div><small className="estimate-note">{t('cart.taxNote')}</small><Link href="/checkout" className="button button--primary button--block" onClick={close}>{t('cart.checkout')}</Link><button className="text-button" onClick={close}>{t('common.continueShopping')}</button></footer>
          </>
        )}
      </aside>
    </div>
  );
}

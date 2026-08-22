'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gift, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { cartSubtotal, useCartStore } from '@/stores/cart';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuthStore } from '@/stores/auth';

export function CartDrawer() {
  const { items, isOpen, close, remove, setQuantity } = useCartStore();
  const subtotal = useCartStore(cartSubtotal);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const estimatedShipping = subtotal >= 120 ? 0 : 9;
  const estimatedTax = subtotal * .08;
  const { t, locale } = useI18n();
  const user = useAuthStore((state) => state.user);
  const giftBoxes = Array.from(new Map(
    items
      .filter((item) => item.giftBoxKey)
      .map((item) => [item.giftBoxKey!, item]),
  ).values());

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

        {items.length === 0 ? (
          <div className="empty-cart"><span><ShoppingBag size={28} /></span><h3>{t('cart.emptyTitle')}</h3><p>{t('cart.emptyCopy')}</p><Link className="button button--primary" href="/products" onClick={close}>{t('common.explore')}</Link></div>
        ) : (
          <>
            <div className="cart-lines">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const name = locale === 'tr' && item.productNameTr ? item.productNameTr : item.productName;
                  const finish = locale === 'tr' && item.colorTr ? item.colorTr : item.color;
                  return (
                    <motion.article className="cart-line" key={item.id} layout initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24, height: 0, paddingTop: 0, paddingBottom: 0 }}>
                      <MediaImage src={item.image || ''} alt="" sizes="82px" />
                      <div className="cart-line__copy">
                        <h3>{name}</h3><p>{finish}</p>
                        {item.giftBoxKey ? <span className="cart-gift-badge"><Gift size={12} /> Kavanoz</span> : (
                          <div className="quantity-control" aria-label={t('cart.quantity', { name })}>
                            <button onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label={t('cart.decrease')}><Minus size={14} /></button>
                            <span>{item.quantity}</span>
                            <button onClick={() => setQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.availableStock} aria-label={t('cart.increase')}><Plus size={14} /></button>
                          </div>
                        )}
                      </div>
                      <div className="cart-line__end"><strong>${item.lineTotal.toFixed(0)}</strong><button onClick={() => remove(item.id)} aria-label={t('cart.remove', { name })}><Trash2 size={16} /></button></div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
            {giftBoxes.length > 0 && <div className="cart-gift-notes">{giftBoxes.map((box, index) => <section key={box.giftBoxKey}><strong><Gift /> {locale === 'tr' ? `${index + 1}. Kavanoz` : `Kavanoz ${index + 1}`}</strong>{box.giftMessage && <p><span>{locale === 'tr' ? 'Hediye mesajı' : 'Gift message'}</span>{box.giftMessage}</p>}{box.packagingNotes && <p><span>{locale === 'tr' ? 'Paketleme notu' : 'Packaging note'}</span>{box.packagingNotes}</p>}</section>)}</div>}
            <footer className="drawer-footer">
              <div className="cart-estimates"><p><span>{t('cart.subtotal')}</span><b>${subtotal.toFixed(0)}</b></p><p><span>{t('cart.delivery')}</span><b>{estimatedShipping ? `$${estimatedShipping}` : t('cart.complimentary')}</b></p><p><span>{t('cart.tax')}</span><b>${estimatedTax.toFixed(0)}</b></p><div><span>{t('cart.total')}</span><strong>${(subtotal + estimatedShipping + estimatedTax).toFixed(0)}</strong></div></div>
              <small className="estimate-note">{t('cart.taxNote')}</small>
              <Link href="/checkout" className="button button--primary button--block" onClick={close}>{t('cart.checkout')}</Link>
              <button className="text-button" onClick={close}>{t('common.continueShopping')}</button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

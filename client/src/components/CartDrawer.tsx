'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { cartSubtotal, useCartStore } from '@/stores/cart';
import { MediaImage } from '@/components/MediaImage';

export function CartDrawer() {
  const { lines, isOpen, close, remove, setQuantity } = useCartStore();
  const subtotal = useCartStore(cartSubtotal);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const estimatedShipping = subtotal >= 120 ? 0 : 9;
  const estimatedTax = subtotal * .08;

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

  return (
    <div className={isOpen ? 'drawer-root drawer-root--open' : 'drawer-root'} aria-hidden={!isOpen}>
      <button className="drawer-scrim" onClick={close} aria-label="Close shopping bag" tabIndex={isOpen ? 0 : -1} />
      <aside ref={drawerRef} className="cart-drawer glass-overlay" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header className="drawer-header"><div><span className="eyebrow">Your selection</span><h2 id="cart-title">Shopping bag</h2></div><button ref={closeButtonRef} className="icon-button" onClick={close} aria-label="Close"><X /></button></header>
        {lines.length === 0 ? (
          <div className="empty-cart"><span><ShoppingBag size={28} /></span><h3>Your bag is beautifully empty.</h3><p>Discover a piece made slowly, by hand.</p><Link className="button button--primary" href="/products" onClick={close}>Explore the collection</Link></div>
        ) : (
          <>
            <div className="cart-lines"><AnimatePresence initial={false}>
              {lines.map((line) => (
                <motion.article className="cart-line" key={`${line.product.id}-${line.color}`} layout initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24, height: 0, paddingTop: 0, paddingBottom: 0 }}>
                  <MediaImage src={line.product.image} alt="" sizes="82px" />
                  <div className="cart-line__copy"><h3>{line.product.name}</h3><p>{line.color}</p><div className="quantity-control" aria-label={`Quantity for ${line.product.name}`}><button onClick={() => setQuantity(line.product.id, line.color, line.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button><span>{line.quantity}</span><button onClick={() => setQuantity(line.product.id, line.color, line.quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button></div></div>
                  <div className="cart-line__end"><strong>${(line.product.price.amount * line.quantity).toFixed(0)}</strong><button onClick={() => remove(line.product.id, line.color)} aria-label={`Remove ${line.product.name}`}><Trash2 size={16} /></button></div>
                </motion.article>
              ))}
            </AnimatePresence></div>
            <footer className="drawer-footer"><div className="cart-estimates"><p><span>Subtotal</span><b>${subtotal.toFixed(0)}</b></p><p><span>Estimated delivery</span><b>{estimatedShipping ? `$${estimatedShipping}` : 'Complimentary'}</b></p><p><span>Estimated tax</span><b>${estimatedTax.toFixed(0)}</b></p><div><span>Estimated total</span><strong>${(subtotal + estimatedShipping + estimatedTax).toFixed(0)}</strong></div></div><small className="estimate-note">Tax is an estimate and is finalized during secure checkout.</small><Link href="/checkout" className="button button--primary button--block" onClick={close}>Continue to checkout</Link><button className="text-button" onClick={close}>Continue shopping</button></footer>
          </>
        )}
      </aside>
    </div>
  );
}

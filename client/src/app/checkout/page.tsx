'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronLeft, CreditCard, LockKeyhole, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cartSubtotal, useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';
import { createCheckoutSession } from '@/lib/stripe';
import { MediaImage } from '@/components/MediaImage';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type CheckoutFields = z.infer<typeof schema>;

export default function CheckoutPage() {
  const lines = useCartStore((state) => state.lines);
  const subtotal = useCartStore(cartSubtotal);
  const showToast = useToastStore((state) => state.show);
  const [delivery, setDelivery] = useState<'standard' | 'express'>('standard');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CheckoutFields>({ resolver: zodResolver(schema) });
  const shipping = delivery === 'express' ? 18 : subtotal >= 120 ? 0 : 9;
  const total = subtotal + shipping;

  const onSubmit = async ({ email }: CheckoutFields) => {
    if (!lines.length) {
      showToast({ tone: 'info', title: 'Your bag is empty', message: 'Choose a piece before continuing to payment.' });
      return;
    }
    try {
      const session = await createCheckoutSession(lines, email, delivery);
      window.location.assign(session.checkout_url);
    } catch (error) {
      showToast({ tone: 'error', title: 'Checkout could not start', message: error instanceof Error ? error.message : 'Please try again in a moment.' });
    }
  };

  return (
    <div className="checkout-page">
      <header className="checkout-header"><Link href="/" className="wordmark"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link><span><LockKeyhole size={13} /> Secure Stripe checkout</span></header>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Link href="/products" className="back-link"><ChevronLeft size={16} /> Continue shopping</Link>
          <div className="checkout-title"><span className="eyebrow">Almost yours</span><h1>Checkout</h1><div className="checkout-steps"><span className="active">1</span><i /><span className="active">2</span><i /><span>3</span></div></div>
          <section className="form-section"><div className="form-section__heading"><span>01</span><div><h2>Contact</h2><p>Your receipt and delivery updates will arrive here.</p></div></div><Field label="Email address" error={errors.email?.message}><input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} /></Field></section>
          <section className="form-section"><div className="form-section__heading"><span>02</span><div><h2>Delivery</h2><p>Choose your pace. Stripe securely collects the delivery address next.</p></div></div><div className="delivery-options"><label className={delivery === 'standard' ? 'active' : ''}><input type="radio" name="delivery" checked={delivery === 'standard'} onChange={() => setDelivery('standard')} /><Truck /><span><strong>Atelier standard</strong><small>4–6 business days</small></span><b>{subtotal >= 120 ? 'Complimentary' : '$9'}</b></label><label className={delivery === 'express' ? 'active' : ''}><input type="radio" name="delivery" checked={delivery === 'express'} onChange={() => setDelivery('express')} /><PackageCheck /><span><strong>Express</strong><small>1–2 business days</small></span><b>$18</b></label></div></section>
          <section className="form-section"><div className="form-section__heading"><span>03</span><div><h2>Secure payment</h2><p>You’ll finish on Stripe’s encrypted, PCI-compliant payment page.</p></div></div><div className="stripe-handoff"><div><CreditCard /><span><strong>Cards & local payment methods</strong><small>Available methods adapt to your region and device.</small></span></div><ShieldCheck /><p>MERS Tassel never sees or stores your card number.</p></div></section>
          <button className="button button--primary button--block checkout-submit" type="submit" disabled={!lines.length || isSubmitting}>{isSubmitting ? 'Opening secure checkout…' : `Continue to payment · $${total.toFixed(0)}`} <LockKeyhole size={14} /></button><p className="checkout-legal">Prices and availability are verified by the atelier server before Stripe opens. Taxes, where applicable, are finalized on the secure payment page.</p>
        </form>
        <aside className="order-summary"><div className="order-summary__inner"><span className="eyebrow">Your selection</span><h2>Order summary</h2>{lines.length ? <div className="summary-lines">{lines.map((line) => <div key={`${line.product.id}-${line.color}`} className="summary-line"><div><MediaImage src={line.product.image} alt="" sizes="68px" /><span>{line.quantity}</span></div><section><strong>{line.product.name}</strong><small>{line.color}</small></section><b>${(line.product.price.amount * line.quantity).toFixed(0)}</b></div>)}</div> : <div className="summary-empty"><p>Your bag is empty.</p><Link href="/products">Browse the collection</Link></div>}<div className="summary-totals summary-totals--checkout"><p><span>Subtotal</span><b>${subtotal.toFixed(0)}</b></p><p><span>Delivery</span><b>{shipping ? `$${shipping}` : 'Complimentary'}</b></p><div><span>Total <small>USD</small></span><strong>${total.toFixed(0)}</strong></div></div><div className="summary-trust"><LockKeyhole size={14} /> Secure checkout · 30-day returns · Atelier care</div></div></aside>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className={`field${error ? ' field--error' : ''}`}><span>{label}</span>{children}{error && <small role="alert">{error}</small>}</label>;
}

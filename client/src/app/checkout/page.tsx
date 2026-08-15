'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, LockKeyhole, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cartSubtotal, useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';
import { createCheckoutSession } from '@/lib/stripe';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { colorName, productCopy } from '@/i18n/catalog';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useAuthStore, withFreshAccess } from '@/stores/auth';

type CheckoutFields = { email: string };

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const lines = useCartStore((state) => state.lines);
  const subtotal = useCartStore(cartSubtotal);
  const showToast = useToastStore((state) => state.show);
  const { t, locale } = useI18n();
  const schema = useMemo(() => z.object({ email: z.string().email(t('checkout.emailError')) }), [t]);
  const [delivery, setDelivery] = useState<'standard' | 'express'>('standard');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CheckoutFields>({ resolver: zodResolver(schema) });
  const shipping = delivery === 'express' ? 18 : subtotal >= 120 ? 0 : 9;
  const total = subtotal + shipping;

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login?next=%2Fcheckout');
    if (user) reset({ email: user.email });
  }, [hasHydrated, reset, router, user]);

  const onSubmit = async ({ email }: CheckoutFields) => {
    if (!lines.length) {
      showToast({ tone: 'info', title: t('checkout.emptyToast'), message: t('checkout.emptyToastCopy') });
      return;
    }
    try {
      const session = await withFreshAccess((access) => createCheckoutSession(lines, email, delivery, locale, access));
      window.location.assign(session.checkout_url);
    } catch (error) {
      showToast({ tone: 'error', title: t('checkout.failed'), message: locale === 'tr' ? t('checkout.retry') : error instanceof Error ? error.message : t('checkout.retry') });
    }
  };

  if (!hasHydrated || !user) return <div className="checkout-auth-loading">{t('common.loading')}</div>;

  return (
    <div className="checkout-page">
      <header className="checkout-header"><Link href="/" className="wordmark"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link><div className="checkout-header__actions"><LanguageSwitch compact /><span><LockKeyhole size={13} /> {t('checkout.secure')}</span></div></header>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Link href="/products" className="back-link"><ChevronLeft size={16} /> {t('checkout.back')}</Link>
          <div className="checkout-title"><span className="eyebrow">{t('checkout.eyebrow')}</span><h1>{t('checkout.title')}</h1><div className="checkout-steps"><span className="active">1</span><i /><span className="active">2</span><i /><span>3</span></div></div>
          <section className="form-section"><div className="form-section__heading"><span>01</span><div><h2>{t('checkout.contact')}</h2><p>{t('checkout.contactCopy')}</p></div></div><Field label={t('checkout.email')} error={errors.email?.message}><input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} /></Field></section>
          <section className="form-section"><div className="form-section__heading"><span>02</span><div><h2>{t('checkout.delivery')}</h2><p>{t('checkout.deliveryCopy')}</p></div></div><div className="delivery-options"><label className={delivery === 'standard' ? 'active' : ''}><input type="radio" name="delivery" checked={delivery === 'standard'} onChange={() => setDelivery('standard')} /><Truck /><span><strong>{t('checkout.standard')}</strong><small>{t('checkout.standardTime')}</small></span><b>{subtotal >= 120 ? t('cart.complimentary') : '$9'}</b></label><label className={delivery === 'express' ? 'active' : ''}><input type="radio" name="delivery" checked={delivery === 'express'} onChange={() => setDelivery('express')} /><PackageCheck /><span><strong>{t('checkout.express')}</strong><small>{t('checkout.expressTime')}</small></span><b>$18</b></label></div></section>
          <section className="form-section"><div className="form-section__heading"><span>03</span><div><h2>{t('checkout.payment')}</h2><p>{t('checkout.paymentCopy')}</p></div></div><div className="stripe-handoff"><div><CreditCard /><span><strong>{t('checkout.methods')}</strong><small>{t('checkout.methodsCopy')}</small></span></div><ShieldCheck /><p>{t('checkout.neverStores')}</p></div></section>
          <button className="button button--primary button--block checkout-submit" type="submit" disabled={!lines.length || isSubmitting}>{isSubmitting ? t('checkout.opening') : t('checkout.continue', { amount: total.toFixed(0) })} <LockKeyhole size={14} /></button><p className="checkout-legal">{t('checkout.legal')}</p>
        </form>
        <aside className="order-summary"><div className="order-summary__inner"><span className="eyebrow">{t('cart.eyebrow')}</span><h2>{t('checkout.summary')}</h2>{lines.length ? <div className="summary-lines">{lines.map((line) => { const display = productCopy(line.product, locale); return <div key={`${line.product.id}-${line.color}`} className="summary-line"><div><MediaImage src={line.product.image} alt="" sizes="68px" /><span>{line.quantity}</span></div><section><strong>{display.name}</strong><small>{colorName(line.color, locale)}</small></section><b>${(line.product.price.amount * line.quantity).toFixed(0)}</b></div>; })}</div> : <div className="summary-empty"><p>{t('checkout.empty')}</p><Link href="/products">{t('checkout.browse')}</Link></div>}<div className="summary-totals summary-totals--checkout"><p><span>{t('cart.subtotal')}</span><b>${subtotal.toFixed(0)}</b></p><p><span>{t('checkout.delivery')}</span><b>{shipping ? `$${shipping}` : t('cart.complimentary')}</b></p><div><span>{t('cart.total')} <small>USD</small></span><strong>${total.toFixed(0)}</strong></div></div><div className="summary-trust"><LockKeyhole size={14} /> {t('checkout.trust')}</div></div></aside>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className={`field${error ? ' field--error' : ''}`}><span>{label}</span>{children}{error && <small role="alert">{error}</small>}</label>;
}

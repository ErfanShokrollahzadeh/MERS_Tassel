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
import { checkout, createCheckoutSession } from '@/lib/commerce';
import { ApiError } from '@/lib/apiClient';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useAuthStore } from '@/stores/auth';

type CheckoutFields = { email: string };

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(cartSubtotal);
  const loadCart = useCartStore((state) => state.load);
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
    if (!items.length) {
      showToast({ tone: 'info', title: t('checkout.emptyToast'), message: t('checkout.emptyToastCopy') });
      return;
    }

    try {
      // The order is created server-side first, so pricing and stock are settled before
      // the customer ever reaches the payment page.
      const order = await checkout({ email, delivery, locale });
      await loadCart();

      const session = await createCheckoutSession(order.number, locale);
      window.location.assign(session.checkoutUrl);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'payments_not_configured') {
        // The order exists and stock is held; only the gateway is missing.
        showToast({
          tone: 'info',
          title: t('checkout.orderPlaced'),
          message: t('checkout.paymentsUnavailable'),
        });
        router.push('/account');
        return;
      }

      showToast({
        tone: 'error',
        title: t('checkout.failed'),
        message: error instanceof ApiError ? error.message : t('checkout.retry'),
      });
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

          <button className="button button--primary button--block checkout-submit" type="submit" disabled={!items.length || isSubmitting}>{isSubmitting ? t('checkout.opening') : t('checkout.continue', { amount: total.toFixed(0) })} <LockKeyhole size={14} /></button>
          <p className="checkout-legal">{t('checkout.legal')}</p>
        </form>

        <aside className="order-summary">
          <div className="order-summary__inner">
            <span className="eyebrow">{t('cart.eyebrow')}</span><h2>{t('checkout.summary')}</h2>
            {items.length ? (
              <div className="summary-lines">
                {items.map((item) => {
                  const name = locale === 'tr' && item.productNameTr ? item.productNameTr : item.productName;
                  const finish = locale === 'tr' && item.colorTr ? item.colorTr : item.color;
                  return (
                    <div key={item.id} className="summary-line">
                      <div><MediaImage src={item.image || ''} alt="" sizes="68px" /><span>{item.quantity}</span></div>
                      <section><strong>{name}</strong><small>{finish}</small></section>
                      <b>${item.lineTotal.toFixed(0)}</b>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="summary-empty"><p>{t('checkout.empty')}</p><Link href="/products">{t('checkout.browse')}</Link></div>
            )}
            <div className="summary-totals summary-totals--checkout"><p><span>{t('cart.subtotal')}</span><b>${subtotal.toFixed(0)}</b></p><p><span>{t('checkout.delivery')}</span><b>{shipping ? `$${shipping}` : t('cart.complimentary')}</b></p><div><span>{t('cart.total')} <small>USD</small></span><strong>${total.toFixed(0)}</strong></div></div>
            <div className="summary-trust"><LockKeyhole size={14} /> {t('checkout.trust')}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className={`field${error ? ' field--error' : ''}`}><span>{label}</span>{children}{error && <small role="alert">{error}</small>}</label>;
}

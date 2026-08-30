'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, CreditCard, LockKeyhole, PackageCheck, ShieldCheck, Truck, WalletCards } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cartSubtotal, useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';
import { checkout, checkoutExchange, commerceKeys, createCheckoutSession, fetchMyExchanges, fetchWallet } from '@/lib/commerce';
import { ApiError } from '@/lib/apiClient';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useAuthStore } from '@/stores/auth';
import { PromoCode } from '@/components/PromoCode';
import { TradeInWidget } from '@/components/TradeInWidget';
import { CartItemRemoveButton } from '@/components/CartItemRemoveButton';
import { formatMoney, STORE_CURRENCY } from '@/lib/money';

type CheckoutFields = { email: string };

const surpriseRecipients = {
  en: { girlfriend: 'Girlfriend', boyfriend: 'Boyfriend', partner: 'Partner', friend: 'Friend', sister: 'Sister', brother: 'Brother', mother: 'Mother', father: 'Father' },
  tr: { girlfriend: 'Kız arkadaş', boyfriend: 'Erkek arkadaş', partner: 'Partner', friend: 'Arkadaş', sister: 'Kız kardeş', brother: 'Erkek kardeş', mother: 'Anne', father: 'Baba' },
} as const;

const surpriseVibes = {
  en: { cute: 'Cute', elegant: 'Elegant', minimalist: 'Minimalist', casual: 'Casual', 'jewelry-heavy': 'Jewelry-heavy', accessories: 'Accessories' },
  tr: { cute: 'Sevimli', elegant: 'Zarif', minimalist: 'Minimalist', casual: 'Günlük', 'jewelry-heavy': 'Takı ağırlıklı', accessories: 'Aksesuarlar' },
} as const;

function surpriseValue(labels: Record<string, string>, value: string) {
  return labels[value] || value;
}

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(cartSubtotal);
  const storedDiscount = useCartStore((state) => state.discountTotal);
  const couponDiscount = useCartStore((state) => state.couponDiscountTotal);
  const tradeInCredit = useCartStore((state) => state.tradeInCredit);
  const loadCart = useCartStore((state) => state.load);
  const showToast = useToastStore((state) => state.show);
  const { t, locale } = useI18n();

  const schema = useMemo(() => z.object({ email: z.string().email(t('checkout.emailError')) }), [t]);
  const [delivery, setDelivery] = useState<'standard' | 'express'>('standard');
  const [useWallet, setUseWallet] = useState(false);
  const [exchangeId, setExchangeId] = useState<number | null>(null);
  const exchanges = useQuery({ queryKey: commerceKeys.exchanges(), queryFn: fetchMyExchanges, enabled: Boolean(user) && exchangeId !== null });
  const exchange = exchanges.data?.find((entry) => entry.id === exchangeId);
  const walletCurrency = exchange?.currency || STORE_CURRENCY;
  const wallet = useQuery({ queryKey: commerceKeys.wallet(walletCurrency), queryFn: () => fetchWallet(walletCurrency), enabled: Boolean(user) });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CheckoutFields>({ resolver: zodResolver(schema) });

  const discount = Number.isFinite(storedDiscount) ? storedDiscount : 0;
  const payableBeforeWallet = exchange ? exchange.amountDue : Math.max(0, subtotal - discount);
  const walletApplied = useWallet ? Math.min(wallet.data?.balance || 0, payableBeforeWallet) : 0;
  const shipping = exchange ? 0 : delivery === 'express' ? 60 : subtotal >= 500 ? 0 : 30;
  const total = Math.max(0, payableBeforeWallet - walletApplied + shipping);

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login?next=%2Fcheckout');
    if (user) reset({ email: user.email });
  }, [hasHydrated, reset, router, user]);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('exchange');
    setExchangeId(value && Number.isInteger(Number(value)) ? Number(value) : null);
  }, []);

  const onSubmit = async ({ email }: CheckoutFields) => {
    if (!exchange && !items.length) {
      showToast({ tone: 'info', title: t('checkout.emptyToast'), message: t('checkout.emptyToastCopy') });
      return;
    }

    try {
      // The order is created server-side first, so pricing and stock are settled before
      // the customer ever reaches the payment page.
      const order = exchange
        ? await checkoutExchange(exchange.id, { email, locale, useWalletBalance: useWallet })
        : await checkout({ email, delivery, locale, useWalletBalance: useWallet });
      if (!exchange) await loadCart();

      if (order.total <= 0) {
        showToast({ tone: 'success', title: t('checkout.orderPlaced'), message: locale === 'tr' ? 'Siparişiniz mağaza cüzdanınızla tamamen ödendi.' : 'Your order was paid in full with your store wallet.' });
        router.push('/account');
        return;
      }

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
        message: t('checkout.retry'),
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

          <section className="form-section"><div className="form-section__heading"><span>01</span><div><h2>{t('checkout.contact')}</h2><p>{t('checkout.contactCopy')}</p></div></div><Field label={t('checkout.email')} error={errors.email?.message}><input type="email" autoComplete="email" placeholder={t('common.emailPlaceholder')} {...register('email')} /></Field></section>

          {exchange ? <section className="form-section"><div className="form-section__heading"><span>02</span><div><h2>{locale === 'tr' ? 'Değişim farkı' : 'Exchange difference'}</h2><p>{locale === 'tr' ? 'Onaylanan yeni ürün için yalnızca kalan farkı ödersiniz. Teslimat düzenlemesi atölye ekibi tarafından yapılır.' : 'You pay only the approved difference for the replacement. The atelier team coordinates delivery.'}</p></div></div><div className="payment-handoff"><div><ArrowRight /><span><strong>{exchange.originalProductName} → {exchange.newProductName}</strong><small>{exchange.newProductColor}</small></span></div><ShieldCheck /><p>{locale === 'tr' ? 'Atölye tarafından doğrulandı' : 'Verified by the atelier'}</p></div></section> : <section className="form-section"><div className="form-section__heading"><span>02</span><div><h2>{t('checkout.delivery')}</h2><p>{t('checkout.deliveryCopy')}</p></div></div><div className="delivery-options"><label className={delivery === 'standard' ? 'active' : ''}><input type="radio" name="delivery" checked={delivery === 'standard'} onChange={() => setDelivery('standard')} /><Truck /><span><strong>{t('checkout.standard')}</strong><small>{t('checkout.standardTime')}</small></span><b>{subtotal >= 500 ? t('cart.complimentary') : formatMoney(30, locale)}</b></label><label className={delivery === 'express' ? 'active' : ''}><input type="radio" name="delivery" checked={delivery === 'express'} onChange={() => setDelivery('express')} /><PackageCheck /><span><strong>{t('checkout.express')}</strong><small>{t('checkout.expressTime')}</small></span><b>{formatMoney(60, locale)}</b></label></div></section>}

          <section className="form-section"><div className="form-section__heading"><span>03</span><div><h2>{t('checkout.payment')}</h2><p>{t('checkout.paymentCopy')}</p></div></div><div className="payment-handoff"><div><CreditCard /><span><strong>{t('checkout.methods')}</strong><small>{t('checkout.methodsCopy')}</small></span></div><ShieldCheck /><p>{t('checkout.neverStores')}</p></div></section>

          <button className="button button--primary button--block checkout-submit" type="submit" disabled={(!exchange && !items.length) || (exchangeId !== null && !exchange) || isSubmitting}>{isSubmitting ? t('checkout.opening') : t('checkout.continue', { amount: formatMoney(total, locale) })} <LockKeyhole size={14} /></button>
          <p className="checkout-legal">{t('checkout.legal')}</p>
        </form>

        <aside className="order-summary">
          <div className="order-summary__inner">
            <span className="eyebrow">{t('cart.eyebrow')}</span><h2>{t('checkout.summary')}</h2>
            {exchange ? <div className="exchange-checkout-line"><span className="eyebrow">{locale === 'tr' ? 'ONAYLANAN DEĞİŞİM' : 'APPROVED EXCHANGE'}</span><strong>{exchange.newProductName}</strong><small>{exchange.newProductColor}</small><p><span>{locale === 'tr' ? 'Yeni ürün' : 'New product'}</span><b>{formatMoney(exchange.newProductValue, locale)}</b></p><p><span>{locale === 'tr' ? 'Eski ürün kredisi' : 'Original item credit'}</span><b>−{formatMoney(exchange.oldProductValue, locale)}</b></p></div> : items.length ? (
              <div className="summary-lines">
                {items.map((item) => {
                  const name = locale === 'tr' && item.productNameTr ? item.productNameTr : item.productName;
                  const finish = locale === 'tr' && item.colorTr ? item.colorTr : item.color;
                  const isSurpriseBox = item.giftBoxKey?.startsWith('SUR-') ?? false;
                  const surpriseDetails = isSurpriseBox
                    ? [
                      item.surpriseRecipient ? surpriseValue(surpriseRecipients[locale], item.surpriseRecipient) : null,
                      item.surpriseVibes?.length ? item.surpriseVibes.map((vibe) => surpriseValue(surpriseVibes[locale], vibe)).join(' · ') : null,
                    ].filter(Boolean).join(' — ')
                    : '';
                  return (
                    <div key={item.id} className="summary-line">
                      <div className="summary-line__media"><MediaImage src={item.image || ''} alt="" sizes="68px" /><span>{item.quantity}</span></div>
                      <section><strong>{name}</strong><small>{surpriseDetails || finish}</small></section>
                      <div className="summary-line__end">
                        <b>{formatMoney(item.lineTotal, locale)}</b>
                        <CartItemRemoveButton itemId={item.id} name={name} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="summary-empty"><p>{t('checkout.empty')}</p><Link href="/products">{t('checkout.browse')}</Link></div>
            )}
            {!exchange && <PromoCode />}
            {!exchange && <TradeInWidget source="checkout" compact />}
            <section className="checkout-wallet">
              <div><WalletCards /><span><strong>{locale === 'tr' ? 'Mağaza cüzdanı' : 'Store wallet'}</strong><small>{locale === 'tr' ? 'Kullanılabilir bakiye' : 'Available balance'} · {formatMoney(wallet.data?.balance || 0, locale)}</small></span></div>
              <label><input type="checkbox" checked={useWallet} onChange={(event) => setUseWallet(event.target.checked)} disabled={!wallet.data?.balance} /><span>{locale === 'tr' ? 'Bakiyeyi bu siparişe uygula' : 'Apply wallet balance to this order'}</span></label>
              {walletApplied > 0 && <p>{locale === 'tr' ? 'Bu siparişte kullanılacak' : 'Applied to this order'} <b>−{formatMoney(walletApplied, locale)}</b></p>}
            </section>
            <div className="summary-totals summary-totals--checkout"><p><span>{exchange ? (locale === 'tr' ? 'Değişim farkı' : 'Exchange difference') : t('cart.subtotal')}</span><b>{formatMoney(exchange ? exchange.amountDue : subtotal, locale)}</b></p>{!exchange && couponDiscount > 0 && <p className="summary-totals__discount"><span>{locale === 'tr' ? 'Promosyon indirimi' : 'Promo discount'}</span><b>−{formatMoney(couponDiscount, locale)}</b></p>}{!exchange && tradeInCredit > 0 && <p className="summary-totals__discount"><span>{locale === 'tr' ? 'Takas kredisi' : 'Trade-in credit'}</span><b>−{formatMoney(tradeInCredit, locale)}</b></p>}{!exchange && discount > 0 && couponDiscount === 0 && tradeInCredit === 0 && <p className="summary-totals__discount"><span>{locale === 'tr' ? 'Toplam indirim' : 'Total discount'}</span><b>−{formatMoney(discount, locale)}</b></p>}{walletApplied > 0 && <p className="summary-totals__discount"><span>{locale === 'tr' ? 'Cüzdan bakiyesi' : 'Wallet balance'}</span><b>−{formatMoney(walletApplied, locale)}</b></p>}{!exchange && <p><span>{t('checkout.delivery')}</span><b>{shipping ? formatMoney(shipping, locale) : t('cart.complimentary')}</b></p>}<div><span>{t('cart.total')} <small>{STORE_CURRENCY}</small></span><strong>{formatMoney(total, locale)}</strong></div></div>
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

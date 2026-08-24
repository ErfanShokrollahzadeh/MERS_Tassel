'use client';

import { FormEvent, useState } from 'react';
import { Check, LoaderCircle, Tag, X } from 'lucide-react';
import { ApiError } from '@/lib/apiClient';
import { useI18n } from '@/i18n/I18nProvider';
import { useCartStore } from '@/stores/cart';

const copy = {
  en: {
    label: 'Discount code', placeholder: 'Enter promo code', apply: 'Apply', applying: 'Applying',
    remove: 'Remove', applied: 'Promotion applied', saved: 'You save', invalid: 'Invalid code.',
    expired: 'This coupon has expired.', inactive: 'This coupon is not currently active.',
    notStarted: 'This coupon is not available yet.', limit: 'This coupon has reached its usage limit.',
    minimum: 'This order does not meet the coupon minimum spend.', empty: 'Add something to your bag first.',
    network: 'We could not check this code. Please try again.', success: 'Your discount has been added.',
  },
  tr: {
    label: 'İndirim kodu', placeholder: 'İndirim kodunu girin', apply: 'Uygula', applying: 'Uygulanıyor',
    remove: 'Kaldır', applied: 'Promosyon uygulandı', saved: 'Kazancınız', invalid: 'Geçersiz kod.',
    expired: 'Bu kuponun süresi dolmuş.', inactive: 'Bu kupon şu anda aktif değil.',
    notStarted: 'Bu kupon henüz kullanıma açılmadı.', limit: 'Bu kupon kullanım limitine ulaştı.',
    minimum: 'Sipariş tutarı kuponun minimum harcama koşulunu karşılamıyor.', empty: 'Önce sepetinize bir ürün ekleyin.',
    network: 'Kod şu anda kontrol edilemedi. Lütfen tekrar deneyin.', success: 'İndiriminiz sepete eklendi.',
  },
} as const;

export function PromoCode({ currency = 'USD' }: { currency?: string }) {
  const { locale } = useI18n();
  const text = copy[locale];
  const subtotal = useCartStore((state) => state.subtotal);
  const coupon = useCartStore((state) => state.coupon);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const detachCoupon = useCartStore((state) => state.removeCoupon);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const money = (amount: number) => new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(amount);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = code.trim();
    if (!normalized) {
      setError(text.invalid);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await applyCoupon(normalized);
      setCode('');
      setSuccess(text.success);
    } catch (caught) {
      const key = caught instanceof ApiError ? caught.code : undefined;
      const messages: Record<string, string> = {
        invalid_coupon: text.invalid,
        expired_coupon: text.expired,
        inactive_coupon: text.inactive,
        coupon_not_started: text.notStarted,
        coupon_limit_reached: text.limit,
        minimum_spend: locale === 'en' && caught instanceof ApiError ? caught.message : text.minimum,
        empty_cart: text.empty,
      };
      setError((key && messages[key]) || text.network);
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await detachCoupon();
    } catch {
      setError(text.network);
    } finally {
      setLoading(false);
    }
  };

  if (coupon) {
    return (
      <section className="checkout-promo checkout-promo--applied" aria-live="polite">
        <div className="checkout-promo__active">
          <span className="checkout-promo__icon"><Check size={16} /></span>
          <div><small>{text.applied}</small><strong>{coupon.code}</strong></div>
          <b>{coupon.badge}</b>
        </div>
        <div className="checkout-promo__saving">
          <span>{text.saved}</span><strong>−{money(coupon.discountAmount)}</strong>
          <button type="button" onClick={remove} disabled={loading}>
            {loading ? <LoaderCircle className="checkout-promo__spinner" size={14} /> : <X size={14} />}
            {text.remove}
          </button>
        </div>
      </section>
    );
  }

  return (
    <form className="checkout-promo" onSubmit={submit} noValidate>
      <label htmlFor="checkout-promo"><Tag size={15} /> {text.label}</label>
      <div className="checkout-promo__entry">
        <input
          id="checkout-promo"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder={text.placeholder}
          autoComplete="off"
          spellCheck={false}
          disabled={loading || subtotal <= 0}
          aria-invalid={Boolean(error)}
          aria-describedby="checkout-promo-feedback"
        />
        <button type="submit" disabled={loading || subtotal <= 0 || !code.trim()}>
          {loading && <LoaderCircle className="checkout-promo__spinner" size={15} />}
          {loading ? text.applying : text.apply}
        </button>
      </div>
      <p id="checkout-promo-feedback" className={error ? 'is-error' : success ? 'is-success' : ''} aria-live="polite">
        {error || success}
      </p>
    </form>
  );
}

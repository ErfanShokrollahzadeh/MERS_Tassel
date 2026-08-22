'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, Clock3, PackageCheck, RefreshCw } from 'lucide-react';
import { fetchOrderByStripeSession } from '@/lib/commerce';
import { useCartStore } from '@/stores/cart';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import type { Order } from '@/types/commerce';

export function CheckoutSuccess({ sessionId }: { sessionId: string }) {
  const clear = useCartStore((state) => state.clear);
  const cleared = useRef(false);
  const [order, setOrder] = useState<Order | null>(null);
  const { t, locale } = useI18n();
  const [error, setError] = useState('');

  useEffect(() => { if (!sessionId) setError(t('success.missing')); }, [sessionId, t]);

  useEffect(() => {
    if (!sessionId) return;

    const controller = new AbortController();
    let attempt = 0;
    let timeout = 0;

    // The webhook marks the order paid asynchronously, so poll briefly rather than
    // claiming success the moment Stripe redirects back.
    const load = async () => {
      try {
        const next = await fetchOrderByStripeSession(sessionId, controller.signal);
        setOrder(next);
        setError('');

        if (next.paymentStatus === 'paid' && !cleared.current) {
          clear();
          cleared.current = true;
        } else if (next.paymentStatus === 'unpaid' && attempt < 7) {
          attempt += 1;
          timeout = window.setTimeout(load, 1800);
        }
      } catch {
        if (controller.signal.aborted) return;
        setError(t('success.retrieve'));
      }
    };

    void load();
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [clear, sessionId, t]);

  const paid = order?.paymentStatus === 'paid';
  const failed = order?.paymentStatus === 'failed';
  const paymentLabel = order
    ? ({
        unpaid: locale === 'tr' ? 'bekliyor' : 'pending',
        paid: locale === 'tr' ? 'ödendi' : 'paid',
        failed: locale === 'tr' ? 'başarısız' : 'failed',
        refunded: locale === 'tr' ? 'iade edildi' : 'refunded',
      }[order.paymentStatus])
    : '';

  return (
    <div className="checkout-success">
      <div className="success-language"><LanguageSwitch /></div>
      <div className={`success-orbit${paid ? ' success-orbit--paid' : ''}`}>{paid ? <Check /> : failed ? <RefreshCw /> : <Clock3 />}</div>
      <span className="eyebrow">{order ? `${locale === 'tr' ? 'Sipariş' : 'Order'} ${order.number}` : t('success.reference')}</span>
      <h1>{paid ? t('success.paid') : failed ? t('success.failed') : t('success.confirming')}</h1>
      <p>{error || (paid ? t('success.paidCopy') : failed ? t('success.failedCopy') : t('success.confirmingCopy'))}</p>

      {order && (
        <div className="success-card glass-panel">
          <PackageCheck />
          <div>
            <strong>{paid ? t('success.started') : t('success.payment', { status: paymentLabel })}</strong>
            <span>{t(order.itemCount === 1 ? 'success.piece' : 'success.pieces', { count: order.itemCount })} · ${order.total.toFixed(0)} {order.currency.toUpperCase()}</span>
          </div>
        </div>
      )}

      <div className="success-actions">
        {failed && <Link className="button button--primary" href="/checkout">{t('success.tryAgain')}</Link>}
        <Link className={failed ? 'button button--ghost' : 'button button--primary'} href="/products">{t('pdp.related')}</Link>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, Clock3, PackageCheck, RefreshCw } from 'lucide-react';
import { getCheckoutOrder, type CheckoutOrder } from '@/lib/stripe';
import { useCartStore } from '@/stores/cart';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { withFreshAccess } from '@/stores/auth';

export function CheckoutSuccess({ sessionId }: { sessionId: string }) {
  const clear = useCartStore((state) => state.clear);
  const cleared = useRef(false);
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const { t, locale } = useI18n();
  const [error, setError] = useState('');

  useEffect(() => { if (!sessionId) setError(t('success.missing')); }, [sessionId, t]);

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();
    let attempt = 0;
    let timeout = 0;
    const load = async () => {
      try {
        const nextOrder = await withFreshAccess((access) => getCheckoutOrder(sessionId, access, controller.signal));
        setOrder(nextOrder);
        setError('');
        if (nextOrder.payment_status === 'paid' && !cleared.current) {
          clear();
          cleared.current = true;
        } else if (nextOrder.payment_status === 'unpaid' && attempt < 7) {
          attempt += 1;
          timeout = window.setTimeout(load, 1800);
        }
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(locale === 'tr' ? t('success.retrieve') : loadError instanceof Error ? loadError.message : t('success.retrieve'));
      }
    };
    load();
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [clear, locale, sessionId, t]);

  const paid = order?.payment_status === 'paid';
  const failed = order?.payment_status === 'failed';
  const paymentLabel = order ? ({ unpaid: locale === 'tr' ? 'bekliyor' : 'pending', paid: locale === 'tr' ? 'ödendi' : 'paid', failed: locale === 'tr' ? 'başarısız' : 'failed', refunded: locale === 'tr' ? 'iade edildi' : 'refunded' }[order.payment_status]) : '';
  return <div className="checkout-success">
    <div className="success-language"><LanguageSwitch /></div>
    <div className={`success-orbit${paid ? ' success-orbit--paid' : ''}`}>{paid ? <Check /> : failed ? <RefreshCw /> : <Clock3 />}</div>
    <span className="eyebrow">{order ? `${locale === 'tr' ? 'Sipariş' : 'Order'} ${order.number}` : t('success.reference')}</span>
    <h1>{paid ? t('success.paid') : failed ? t('success.failed') : t('success.confirming')}</h1>
    <p>{error || (paid ? t('success.paidCopy') : failed ? t('success.failedCopy') : t('success.confirmingCopy'))}</p>
    {order && <div className="success-card glass-panel"><PackageCheck /><div><strong>{paid ? t('success.started') : t('success.payment', { status: paymentLabel })}</strong><span>{t(order.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'success.piece' : 'success.pieces', { count: order.items.reduce((sum, item) => sum + item.quantity, 0) })} · ${Number(order.total).toFixed(0)} {order.currency.toUpperCase()}</span></div></div>}
    <div className="success-actions">{failed && <Link className="button button--primary" href="/checkout">{t('success.tryAgain')}</Link>}<Link className={failed ? 'button button--ghost' : 'button button--primary'} href="/products">{t('pdp.related')}</Link></div>
  </div>;
}

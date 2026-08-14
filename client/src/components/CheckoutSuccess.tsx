'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, Clock3, PackageCheck, RefreshCw } from 'lucide-react';
import { getCheckoutOrder, type CheckoutOrder } from '@/lib/stripe';
import { useCartStore } from '@/stores/cart';

export function CheckoutSuccess({ sessionId }: { sessionId: string }) {
  const clear = useCartStore((state) => state.clear);
  const cleared = useRef(false);
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [error, setError] = useState(!sessionId ? 'This confirmation link is missing its secure session reference.' : '');

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();
    let attempt = 0;
    let timeout = 0;
    const load = async () => {
      try {
        const nextOrder = await getCheckoutOrder(sessionId, controller.signal);
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
        setError(loadError instanceof Error ? loadError.message : 'We could not retrieve this order yet.');
      }
    };
    load();
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [clear, sessionId]);

  const paid = order?.payment_status === 'paid';
  const failed = order?.payment_status === 'failed';
  return <div className="checkout-success">
    <div className={`success-orbit${paid ? ' success-orbit--paid' : ''}`}>{paid ? <Check /> : failed ? <RefreshCw /> : <Clock3 />}</div>
    <span className="eyebrow">{order ? `Order ${order.number}` : 'Secure confirmation'}</span>
    <h1>{paid ? 'It’s yours.' : failed ? 'Payment needs another try.' : 'Confirming your piece…'}</h1>
    <p>{error || (paid ? 'Thank you. Your piece is now being prepared at the atelier, and the receipt is on its way to your inbox.' : failed ? 'No charge was completed. Your bag remains ready whenever you would like to try again.' : 'Stripe has returned you safely. We’re waiting for the signed payment confirmation—this usually takes only a moment.')}</p>
    {order && <div className="success-card glass-panel"><PackageCheck /><div><strong>{paid ? 'Atelier preparation started' : `Payment ${order.payment_status}`}</strong><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} {order.items.length === 1 ? 'piece' : 'pieces'} · ${Number(order.total).toFixed(0)} {order.currency.toUpperCase()}</span></div></div>}
    <div className="success-actions">{failed && <Link className="button button--primary" href="/checkout">Try payment again</Link>}<Link className={failed ? 'button button--ghost' : 'button button--primary'} href="/products">Continue exploring</Link></div>
  </div>;
}

import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

export default async function CheckoutCancelPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return <div className="checkout-success checkout-cancel"><div className="success-orbit"><ShoppingBag /></div><span className="eyebrow">{order ? `Order ${order}` : 'Checkout paused'}</span><h1>Your bag is still here.</h1><p>No payment was completed and nothing in your persisted bag was removed. Return to checkout when the moment feels right.</p><div className="success-actions"><Link className="button button--primary" href="/checkout">Return to secure checkout</Link><Link className="button button--ghost" href="/products"><ArrowLeft /> Keep exploring</Link></div></div>;
}

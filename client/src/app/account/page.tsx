'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, LogOut, PackageCheck, ShoppingBag, UserRound } from 'lucide-react';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { fetchAccountOrders, type AccountOrder } from '@/lib/account';
import { useAuthStore, withFreshAccess } from '@/stores/auth';
import { cartCount, cartSubtotal, useCartStore } from '@/stores/cart';
import { colorName, productCopy } from '@/i18n/catalog';

export default function AccountPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const signOut = useAuthStore((state) => state.signOut);
  const lines = useCartStore((state) => state.lines);
  const count = useCartStore(cartCount);
  const subtotal = useCartStore(cartSubtotal);
  const openBag = useCartStore((state) => state.open);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace('/login?next=%2Faccount');
      return;
    }
    let active = true;
    withFreshAccess(fetchAccountOrders)
      .then((next) => { if (active) { setOrders(next); setError(''); } })
      .catch(() => { if (active) setError(t('account.ordersError')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [hasHydrated, router, t, user]);

  const handleSignOut = async () => {
    await signOut();
    useCartStore.getState().clear();
    router.replace('/login');
  };

  if (!hasHydrated || !user) return <div className="account-loading">{t('common.loading')}</div>;

  return <div className="account-page"><section className="account-hero"><div className="container-wide"><span className="eyebrow">{t('account.eyebrow')}</span><h1>{t('account.greeting', { name: user.first_name })}</h1><p>{t('account.lede')}</p></div></section><div className="account-layout container-wide"><aside className="account-profile glass-panel"><div className="account-avatar"><UserRound /></div><h2>{user.first_name} {user.last_name}</h2><p>{user.email}</p><dl><div><dt>{t('account.memberSince')}</dt><dd>{new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(user.date_joined))}</dd></div><div><dt>{t('account.membership')}</dt><dd>{t('account.collector')}</dd></div></dl><button className="text-button account-signout" onClick={handleSignOut}><LogOut /> {t('auth.signOut')}</button></aside><main className="account-main"><section className="account-card"><header><div><span className="account-icon"><ShoppingBag /></span><div><span className="eyebrow">{t('account.bagEyebrow')}</span><h2>{t('account.bag')}</h2></div></div><button className="text-button" onClick={openBag}>{t('account.viewBag')} <ArrowRight /></button></header>{lines.length ? <div className="account-bag-lines">{lines.slice(0, 3).map((line) => { const display = productCopy(line.product, locale); return <article key={`${line.product.id}-${line.color}`}><MediaImage src={line.product.image} alt="" sizes="58px" /><div><strong>{display.name}</strong><span>{colorName(line.color, locale)} · {t('account.quantity', { count: line.quantity })}</span></div><b>${(line.product.price.amount * line.quantity).toFixed(0)}</b></article>; })}<footer><span>{t('account.bagSummary', { count })}</span><strong>${subtotal.toFixed(0)}</strong></footer></div> : <div className="account-empty"><p>{t('account.emptyBag')}</p><Link href="/products">{t('common.explore')} <ArrowRight /></Link></div>}</section><section className="account-card"><header><div><span className="account-icon"><PackageCheck /></span><div><span className="eyebrow">{t('account.ordersEyebrow')}</span><h2>{t('account.orders')}</h2></div></div></header>{loading ? <div className="account-empty"><p>{t('account.loadingOrders')}</p></div> : error ? <div className="account-empty"><p role="alert">{error}</p></div> : orders.length ? <div className="account-orders">{orders.map((order) => <article key={order.id}><div><strong>{order.number}</strong><span><CalendarDays /> {new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(order.created_at))}</span></div><div><span className={`status status--${order.status}`}>{t(`account.status.${order.status}` as Parameters<typeof t>[0])}</span><small>{t('account.items', { count: order.items.reduce((sum, item) => sum + item.quantity, 0) })}</small></div><b>${Number(order.total).toFixed(0)} {order.currency}</b></article>)}</div> : <div className="account-empty"><p>{t('account.noOrders')}</p><Link href="/products">{t('account.startShopping')} <ArrowRight /></Link></div>}</section></main></div></div>;
}

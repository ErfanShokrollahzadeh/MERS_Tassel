'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowRight, CalendarDays, LogOut, PackageCheck, ShoppingBag, UserRound } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { commerceKeys, fetchMyOrders } from '@/lib/commerce';
import { useAuthStore } from '@/stores/auth';
import { cartCount, cartSubtotal, useCartStore } from '@/stores/cart';
import { PanelSkeleton } from '@/components/DataStates';

export default function AccountPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const signOut = useAuthStore((state) => state.signOut);
  const items = useCartStore((state) => state.items);
  const count = useCartStore(cartCount);
  const subtotal = useCartStore(cartSubtotal);
  const openBag = useCartStore((state) => state.open);

  const orders = useQuery({
    queryKey: commerceKeys.orders(),
    queryFn: () => fetchMyOrders(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login?next=%2Faccount');
  }, [hasHydrated, router, user]);

  const handleSignOut = async () => {
    await signOut();
    useCartStore.getState().clear();
    router.replace('/login');
  };

  if (!hasHydrated || !user) return <div className="account-loading">{t('common.loading')}</div>;

  const dateFormat = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="account-page">
      <section className="account-hero"><div className="container-wide"><span className="eyebrow">{t('account.eyebrow')}</span><h1>{t('account.greeting', { name: user.firstName })}</h1><p>{t('account.lede')}</p></div></section>

      <div className="account-layout container-wide">
        <aside className="account-profile glass-panel">
          <div className="account-avatar"><UserRound /></div>
          <h2>{user.firstName} {user.lastName}</h2>
          <p>{user.email}</p>
          <dl>
            <div><dt>{t('account.memberSince')}</dt><dd>{new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(user.dateJoined))}</dd></div>
            <div><dt>{t('account.membership')}</dt><dd>{t('account.collector')}</dd></div>
          </dl>
          {user.role === 'admin' && <Link className="button button--ghost account-admin-link" href="/admin">{t('account.openAtelier')} <ArrowRight size={15} /></Link>}
          <button className="text-button account-signout" onClick={handleSignOut}><LogOut /> {t('auth.signOut')}</button>
        </aside>

        <main className="account-main">
          <section className="account-card">
            <header>
              <div><span className="account-icon"><ShoppingBag /></span><div><span className="eyebrow">{t('account.bagEyebrow')}</span><h2>{t('account.bag')}</h2></div></div>
              <button className="text-button" onClick={openBag}>{t('account.viewBag')} <ArrowRight /></button>
            </header>
            {items.length ? (
              <div className="account-bag-lines">
                {items.slice(0, 3).map((item) => {
                  const name = locale === 'tr' && item.productNameTr ? item.productNameTr : item.productName;
                  const finish = locale === 'tr' && item.colorTr ? item.colorTr : item.color;
                  return (
                    <article key={item.id}>
                      <MediaImage src={item.image || ''} alt="" sizes="58px" />
                      <div><strong>{name}</strong><span>{finish} · {t('account.quantity', { count: item.quantity })}</span></div>
                      <b>${item.lineTotal.toFixed(0)}</b>
                    </article>
                  );
                })}
                <footer><span>{t('account.bagSummary', { count })}</span><strong>${subtotal.toFixed(0)}</strong></footer>
              </div>
            ) : (
              <div className="account-empty"><p>{t('account.emptyBag')}</p><Link href="/products">{t('common.explore')} <ArrowRight /></Link></div>
            )}
          </section>

          <section className="account-card">
            <header><div><span className="account-icon"><PackageCheck /></span><div><span className="eyebrow">{t('account.ordersEyebrow')}</span><h2>{t('account.orders')}</h2></div></div></header>

            {orders.isPending && <PanelSkeleton lines={3} />}
            {orders.isError && <div className="account-empty"><p role="alert">{t('account.ordersError')}</p><button className="text-button" onClick={() => orders.refetch()}>{t('common.retry')}</button></div>}
            {orders.isSuccess && (orders.data.length ? (
              <div className="account-orders">
                {orders.data.map((order) => (
                  <article key={order.id}>
                    <div><strong>{order.number}</strong><span><CalendarDays /> {dateFormat.format(new Date(order.createdAt))}</span></div>
                    <div>
                      <span className={`status status--${order.status}`}>{t(`account.status.${order.status}` as Parameters<typeof t>[0])}</span>
                      <small>{t('account.items', { count: order.itemCount })}</small>
                    </div>
                    <b>${order.total.toFixed(0)} {order.currency}</b>
                  </article>
                ))}
              </div>
            ) : (
              <div className="account-empty"><p>{t('account.noOrders')}</p><Link href="/products">{t('account.startShopping')} <ArrowRight /></Link></div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftRight, ArrowRight, CalendarDays, History, LogOut, PackageCheck, ShoppingBag, UserRound, WalletCards } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { commerceKeys, fetchMyExchanges, fetchMyOrders, fetchWallet } from '@/lib/commerce';
import { useAuthStore } from '@/stores/auth';
import { cartCount, cartSubtotal, useCartStore } from '@/stores/cart';
import { PanelSkeleton } from '@/components/DataStates';
import { ExchangePolicyNotice } from '@/components/ExchangePolicyNotice';
import { ExchangeRequestModal } from '@/components/ExchangeRequestModal';
import type { OrderItem } from '@/types/commerce';
import { formatMoney, STORE_CURRENCY } from '@/lib/money';

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
  const [exchangeItem, setExchangeItem] = useState<{ item: OrderItem; currency: string } | null>(null);

  const orders = useQuery({
    queryKey: commerceKeys.orders(),
    queryFn: () => fetchMyOrders(),
    enabled: Boolean(user),
  });
  const wallet = useQuery({ queryKey: commerceKeys.wallet(STORE_CURRENCY), queryFn: () => fetchWallet(STORE_CURRENCY), enabled: Boolean(user) });
  const exchanges = useQuery({ queryKey: commerceKeys.exchanges(), queryFn: fetchMyExchanges, enabled: Boolean(user) });

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
  const money = (amount: number, _currency: string = STORE_CURRENCY) => formatMoney(amount, locale);
  const tr = locale === 'tr';

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
          <section className="account-card wallet-card">
            <header>
              <div><span className="account-icon"><WalletCards /></span><div><span className="eyebrow">{tr ? 'MAĞAZA CÜZDANI' : 'STORE WALLET'}</span><h2>{tr ? 'Kullanılabilir bakiyeniz' : 'Your available balance'}</h2></div></div>
              <strong className="wallet-card__balance">{wallet.isPending ? '—' : money(wallet.data?.balance || 0, wallet.data?.currency || STORE_CURRENCY)}</strong>
            </header>
            <div className="wallet-card__body">
              <p>{tr ? 'Onaylanan değişim ve takas farkları burada güvenle saklanır. Bakiyenizi ödeme adımında tek dokunuşla kullanabilirsiniz.' : 'Approved exchange and trade-in differences are stored here securely. Apply your balance with one tap at checkout.'}</p>
              <Link className="button button--ghost" href="/checkout">{tr ? 'Ödemede kullan' : 'Use at checkout'} <ArrowRight /></Link>
            </div>
            {wallet.data?.transactions.length ? <div className="wallet-ledger">
              <h3><History /> {tr ? 'Son hareketler' : 'Recent activity'}</h3>
              {wallet.data.transactions.map((entry) => <article key={entry.id}><div><strong>{entry.description}</strong><span>{dateFormat.format(new Date(entry.createdAt))}</span></div><b className={entry.amount >= 0 ? 'wallet-credit' : 'wallet-debit'}>{entry.amount >= 0 ? '+' : '−'}{money(Math.abs(entry.amount), wallet.data.currency)}</b></article>)}
            </div> : null}
          </section>

          <ExchangePolicyNotice compact />

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
                      <b>{money(item.lineTotal)}</b>
                    </article>
                  );
                })}
                <footer><span>{t('account.bagSummary', { count })}</span><strong>{money(subtotal)}</strong></footer>
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
                  <article key={order.id} className="account-order">
                    <div className="account-order__summary"><div><strong>{order.number}</strong><span><CalendarDays /> {dateFormat.format(new Date(order.createdAt))}</span></div><div><span className={`status status--${order.status}`}>{t(`account.status.${order.status}` as Parameters<typeof t>[0])}</span><small>{t('account.items', { count: order.itemCount })}</small></div><b>{money(order.total, order.currency)}</b></div>
                    <div className="account-order__items">
                      {order.items.map((item) => {
                        const exchangeOpen = order.status === 'delivered' && Boolean(order.exchangeEligibleUntil) && new Date(order.exchangeEligibleUntil!).getTime() >= Date.now();
                        return <div key={item.id} className="account-order-item"><MediaImage src={item.image || ''} alt="" sizes="48px" /><span><strong>{item.productName}</strong><small>{item.color}</small></span>{exchangeOpen && <button type="button" className="button button--ghost" onClick={() => setExchangeItem({ item, currency: order.currency })}><ArrowLeftRight /> {tr ? 'Değişim iste' : 'Request exchange'}</button>}</div>;
                      })}
                      {order.status === 'delivered' && order.returnEligibleUntil && <p className="account-order__deadline">{tr ? 'Cayma hakkı son tarihi' : 'Withdrawal deadline'}: <strong>{dateFormat.format(new Date(order.returnEligibleUntil))}</strong></p>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="account-empty"><p>{t('account.noOrders')}</p><Link href="/products">{t('account.startShopping')} <ArrowRight /></Link></div>
            ))}
          </section>

          {exchanges.data?.length ? <section className="account-card">
            <header><div><span className="account-icon"><ArrowLeftRight /></span><div><span className="eyebrow">{tr ? 'KONTROL BEKLİYOR' : 'PENDING VERIFICATION'}</span><h2>{tr ? 'Değişim talepleriniz' : 'Your exchange requests'}</h2></div></div></header>
            <div className="exchange-list">{exchanges.data.map((exchange) => <article key={exchange.id}><div><strong>{exchange.originalProductName} → {exchange.newProductName}</strong><span>{exchange.newProductColor} · {dateFormat.format(new Date(exchange.createdAt))}</span>{exchange.status === 'approved' && exchange.amountDue > 0 && !exchange.settlementOrderNumber && <Link className="text-button" href={`/checkout?exchange=${exchange.id}`}>{tr ? 'Farkı öde' : 'Pay the difference'} <ArrowRight /></Link>}</div><span className={`status status--${exchange.status}`}>{exchange.status.replaceAll('_', ' ')}</span><b>{exchange.walletCredit > 0 ? `+${money(exchange.walletCredit, exchange.currency)}` : exchange.amountDue > 0 ? `${money(exchange.amountDue, exchange.currency)} ${tr ? 'ödenecek' : 'due'}` : money(0, exchange.currency)}</b></article>)}</div>
          </section> : null}
        </main>
      </div>
      <ExchangeRequestModal item={exchangeItem?.item || null} currency={exchangeItem?.currency || STORE_CURRENCY} onClose={() => setExchangeItem(null)} />
    </div>
  );
}

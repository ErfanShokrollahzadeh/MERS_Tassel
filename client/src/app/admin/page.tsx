'use client';

import Link from 'next/link';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Box, CircleDollarSign, Eye, PackageCheck, ShoppingBag, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminKeys, fetchDashboard } from '@/lib/admin';
import { ErrorState, PanelSkeleton, TableSkeleton } from '@/components/DataStates';
import { mediaUrl } from '@/lib/apiClient';
import type { Dashboard } from '@/types/commerce';
import { formatMoney } from '@/lib/money';

const money = (value: number) => formatMoney(value, 'tr', { maximumFractionDigits: 0 });

function Trend({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={up ? 'trend-up' : 'trend-down'}>
      {up ? <ArrowUpRight /> : <ArrowDownRight />}{up ? '+' : ''}{value}%
    </span>
  );
}

function metricsOf(data: Dashboard) {
  return [
    { label: 'Net revenue', value: money(data.netRevenue), trend: data.revenueChangePct, icon: CircleDollarSign },
    { label: 'Orders', value: String(data.orderCount), trend: data.orderChangePct, icon: ShoppingBag },
    { label: 'Average order value', value: money(data.averageOrderValue), trend: data.aovChangePct, icon: Eye },
    { label: 'Returning customers', value: `${data.returningCustomerPct}%`, trend: 0, icon: Users },
  ];
}

export default function AdminOverview() {
  const dashboard = useQuery({ queryKey: adminKeys.dashboard(), queryFn: fetchDashboard });

  const today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <>
      <div className="admin-page-heading">
        <div><span className="admin-kicker">{today}</span><h1>Atelier overview</h1><p>Everything below is measured from your live orders and catalog.</p></div>
        <div><Link href="/admin/products" className="admin-button admin-button--primary">Add product</Link></div>
      </div>

      {dashboard.isPending && <PanelSkeleton lines={4} />}
      {dashboard.isError && <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />}

      {dashboard.isSuccess && (() => {
        const data = dashboard.data;
        const hasRevenue = data.revenueSeries.some((point) => point.revenue > 0);

        return (
          <>
            <section className="metric-grid">
              {metricsOf(data).map((metric) => (
                <article className="metric-card glass-panel" key={metric.label}>
                  <header><span>{metric.label}</span><metric.icon size={17} /></header>
                  <div className="metric-value"><strong>{metric.value}</strong><Trend value={metric.trend} /></div>
                  <small>Last 7 days vs the 7 before</small>
                </article>
              ))}
            </section>

            <section className="inventory-stats">
              <div className="admin-card"><span>Active products</span><strong>{data.activeProducts}</strong><small>Published to the storefront</small></div>
              <div className="admin-card"><span>Low stock</span><strong className={data.lowStockCount ? 'warning-text' : ''}>{data.lowStockCount}</strong><small>Fewer than 8 in stock</small></div>
              <div className="admin-card"><span>Inventory value</span><strong>{money(data.inventoryValue)}</strong><small>At retail price</small></div>
              <div className="admin-card"><span>Out of stock</span><strong className={data.outOfStockCount ? 'danger-text' : ''}>{data.outOfStockCount}</strong><small>Needs replenishing</small></div>
            </section>

            <section className="dashboard-grid">
              <article className="admin-card revenue-card">
                <header className="card-heading"><div><span>Revenue pulse</span><h2>{money(data.netRevenue)} <small>last 7 days</small></h2></div></header>
                <div className="chart-wrap">
                  {hasRevenue ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.revenueSeries}>
                        <defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8f506f" stopOpacity={.3} /><stop offset="1" stopColor="#8f506f" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid vertical={false} stroke="var(--line)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--ink-faint)' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--ink-faint)' }} tickFormatter={(v) => `${v} TL`} />
                        <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 11 }} formatter={(value) => money(Number(value ?? 0))} />
                        <Area type="monotone" dataKey="revenue" stroke="#8f506f" strokeWidth={2.4} fill="url(#revenue-fill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="chart-empty"><p>No paid orders in the last seven days.</p><small>The chart fills in as orders are paid.</small></div>
                  )}
                </div>
              </article>

              <article className="admin-card sales-card">
                <header className="card-heading"><div><span>Customers</span><h2>{data.customerCount}</h2></div></header>
                <p className="sales-card__body">{data.returningCustomerPct}% of paying customers have ordered more than once.</p>
              </article>
            </section>

            <section className="dashboard-grid dashboard-grid--lower">
              <article className="admin-card recent-orders">
                <header className="card-heading"><div><span>Recent orders</span><h2>Latest activity</h2></div><Link href="/admin/orders">View all <ArrowRight size={14} /></Link></header>
                {data.recentOrders.length ? (
                  <div className="admin-table">
                    <table>
                      <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
                      <tbody>
                        {data.recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td><strong>{order.number}</strong><small>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(order.createdAt))}</small></td>
                            <td>{order.customerName || order.email}</td>
                            <td><span className={`status status--${order.status}`}>{order.status}</span></td>
                            <td><strong>{money(order.total)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="admin-empty-note">No orders yet.</p>}
              </article>

              <article className="admin-card top-products">
                <header className="card-heading"><div><span>Product pulse</span><h2>Top pieces</h2></div><Link href="/admin/products">Manage <ArrowRight size={14} /></Link></header>
                {data.topProducts.length ? data.topProducts.map((product, index) => (
                  <div className="top-product" key={product.slug}>
                    {product.image ? <img src={mediaUrl(product.image)} alt="" /> : <span className="skeleton-block top-product__placeholder" />}
                    <div><strong>{product.name}</strong><small>{product.unitsSold} sold · {money(product.revenue)}</small></div>
                    <span>{index === 0 ? <PackageCheck /> : <Box />}</span>
                  </div>
                )) : <p className="admin-empty-note">No paid orders yet, so there is nothing to rank.</p>}
              </article>
            </section>
          </>
        );
      })()}

      {dashboard.isPending && <TableSkeleton rows={4} columns={4} />}
    </>
  );
}

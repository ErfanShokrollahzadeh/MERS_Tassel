'use client';

import { Fragment, useEffect, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys, fetchAdminOrders, updateOrderStatus } from '@/lib/admin';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/DataStates';
import { useToastStore } from '@/stores/toast';
import type { Order, OrderStatus } from '@/types/commerce';

const PAGE_SIZE = 15;
const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [debounced, status]);

  const query = { search: debounced || undefined, status: status || undefined, page, pageSize: PAGE_SIZE };

  const orders = useQuery({
    queryKey: adminKeys.orders(query),
    queryFn: () => fetchAdminOrders(query),
    placeholderData: keepPreviousData,
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, next }: { id: number; next: OrderStatus }) => updateOrderStatus(id, next),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      // Cancelling or refunding returns stock, so the catalog view is stale too.
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast({ tone: 'success', title: `${order.number} → ${order.status}`, message: 'Order updated.' });
    },
    onError: (error) => showToast({ tone: 'error', title: 'Could not update the order', message: error instanceof Error ? error.message : '' }),
  });

  const result = orders.data;
  const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="admin-page-heading">
        <div><span className="admin-kicker">Operations</span><h1>Orders</h1><p>Track, fulfil and care for every order in one place.</p></div>
      </div>

      <div className="admin-card table-card">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order number, customer or email" />
            {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
          </label>
          <div className="status-tabs">
            <button onClick={() => setStatus('')} className={status === '' ? 'active' : ''}>All{result && <span>{result.total}</span>}</button>
            {STATUSES.map((item) => (
              <button key={item} onClick={() => setStatus(item)} className={status === item ? 'active' : ''}>{item}</button>
            ))}
          </div>
        </div>

        {orders.isPending && <TableSkeleton rows={8} columns={7} />}
        {orders.isError && <ErrorState error={orders.error} onRetry={() => orders.refetch()} />}

        {result && (result.items.length ? (
          <>
            <div className="admin-table admin-table--large">
              <table>
                <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Payment</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {result.items.map((order: Order) => (
                    <Fragment key={order.id}>
                      <tr key={order.id} onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="row-clickable">
                        <td><strong>{order.number}</strong></td>
                        <td>{dateFormat.format(new Date(order.createdAt))}</td>
                        <td>
                          <div className="customer-cell">
                            <span>{(order.customerName || order.email).split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
                            <section><strong>{order.customerName || '—'}</strong><small>{order.email}</small></section>
                          </div>
                        </td>
                        <td><span className={`status status--${order.paymentStatus === 'paid' ? 'delivered' : order.paymentStatus === 'failed' ? 'cancelled' : 'pending'}`}>{order.paymentStatus}</span></td>
                        <td>{order.itemCount}</td>
                        <td><strong>{money(order.total)}</strong></td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <label className="status-select">
                            <select
                              value={order.status}
                              onChange={(event) => changeStatus.mutate({ id: order.id, next: event.target.value as OrderStatus })}
                              disabled={changeStatus.isPending}
                              aria-label={`Status for ${order.number}`}
                            >
                              {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <ChevronDown size={13} />
                          </label>
                        </td>
                      </tr>
                      {expanded === order.id && (
                        <tr key={`${order.id}-detail`} className="row-detail">
                          <td colSpan={7}>
                            <div className="order-detail">
                              <div>
                                <h4>Items</h4>
                                <ul>
                                  {order.items.map((item) => (
                                    <li key={item.id}><span>{item.quantity} × {item.productName}{item.color ? ` · ${item.color}` : ''}</span><b>{money(item.lineTotal)}</b></li>
                                  ))}
                                </ul>
                              </div>
                              <dl>
                                <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
                                <div><dt>Delivery</dt><dd>{order.shippingTotal ? money(order.shippingTotal) : 'Complimentary'}</dd></div>
                                <div><dt>Total</dt><dd><strong>{money(order.total)}</strong></dd></div>
                                <div><dt>Channel</dt><dd>{order.channel}</dd></div>
                              </dl>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>Showing {result.items.length} of {result.total} orders</span>
              <div>
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                {Array.from({ length: result.totalPages }).map((_, index) => (
                  <button key={index} className={page === index + 1 ? 'active' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>
                ))}
                <button disabled={page >= result.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title={debounced || status ? 'No orders match those filters' : 'No orders yet'}
            message={debounced || status ? 'Try a different search or status.' : 'Orders placed on the storefront appear here.'}
          />
        ))}
      </div>
    </>
  );
}

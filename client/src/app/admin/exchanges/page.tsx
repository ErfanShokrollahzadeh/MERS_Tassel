'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, CheckCircle2, FileCheck2, PackageCheck, XCircle } from 'lucide-react';
import { adminKeys, fetchAdminExchanges, updateExchangeStatus } from '@/lib/admin';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/DataStates';
import { useToastStore } from '@/stores/toast';
import type { ExchangeRequest, ExchangeStatus } from '@/types/commerce';

const money = (amount: number, currency: string) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);

export default function AdminExchangesPage() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const exchanges = useQuery({ queryKey: adminKeys.exchanges(), queryFn: fetchAdminExchanges });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Exclude<ExchangeStatus, 'pending_verification'> }) => updateExchangeStatus(id, status),
    onSuccess: (exchange) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.exchanges() });
      showToast({ tone: 'success', title: 'Exchange updated', message: `${exchange.originalProductName} → ${exchange.status.replaceAll('_', ' ')}` });
    },
    onError: (error) => showToast({ tone: 'error', title: 'Exchange could not be updated', message: error instanceof Error ? error.message : '' }),
  });

  const pending = exchanges.data?.filter((entry) => entry.status === 'pending_verification').length || 0;
  const credits = exchanges.data?.filter((entry) => entry.status === 'approved' || entry.status === 'completed').reduce((sum, entry) => sum + entry.walletCredit, 0) || 0;

  return <>
    <div className="admin-page-heading"><div><span className="admin-kicker">After-sales care</span><h1>Product exchanges</h1><p>Verify the sales document and packaging before approving wallet credit or collecting an amount due.</p></div></div>
    <section className="inventory-stats"><div className="admin-card"><span>Total requests</span><strong>{exchanges.data?.length ?? '—'}</strong><small>All exchange records</small></div><div className="admin-card"><span>Pending verification</span><strong>{pending}</strong><small>Needs atelier review</small></div><div className="admin-card"><span>Approved wallet credit</span><strong>{money(credits, 'USD')}</strong><small>Posted through the immutable ledger</small></div></section>
    <section className="admin-card table-card">
      {exchanges.isPending && <TableSkeleton rows={6} columns={7} />}
      {exchanges.isError && <ErrorState error={exchanges.error} onRetry={() => exchanges.refetch()} />}
      {exchanges.data && (exchanges.data.length ? <div className="admin-table admin-table--large"><table><thead><tr><th>Request</th><th>Exchange</th><th>Checks</th><th>Value</th><th>Settlement</th><th>Status</th><th>Action</th></tr></thead><tbody>{exchanges.data.map((entry: ExchangeRequest) => <tr key={entry.id}>
        <td><strong>EX-{String(entry.id).padStart(5, '0')}</strong><small>{new Date(entry.createdAt).toLocaleDateString('en-GB')}</small></td>
        <td><strong>{entry.originalProductName}</strong><small>→ {entry.newProductName} · {entry.newProductColor}</small></td>
        <td><span className={entry.invoiceIntact ? 'check-ok' : 'check-missing'}>{entry.invoiceIntact ? <FileCheck2 /> : <XCircle />} Invoice</span><span className={entry.packagingIntact ? 'check-ok' : 'check-missing'}>{entry.packagingIntact ? <PackageCheck /> : <XCircle />} Packaging</span></td>
        <td><small>{money(entry.oldProductValue, entry.currency)} → {money(entry.newProductValue, entry.currency)}</small></td>
        <td><strong>{entry.walletCredit > 0 ? `Wallet +${money(entry.walletCredit, entry.currency)}` : entry.amountDue > 0 ? `Collect ${money(entry.amountDue, entry.currency)}` : 'Even exchange'}</strong></td>
        <td><span className={`status status--${entry.status}`}>{entry.status.replaceAll('_', ' ')}</span></td>
        <td>{entry.status === 'pending_verification' ? <div className="exchange-admin-actions"><button className="admin-button admin-button--primary" disabled={update.isPending} onClick={() => update.mutate({ id: entry.id, status: 'approved' })}><CheckCircle2 /> Approve</button><button className="admin-button" disabled={update.isPending} onClick={() => update.mutate({ id: entry.id, status: 'rejected' })}><XCircle /> Reject</button></div> : entry.status === 'approved' ? <button className="admin-button" disabled={update.isPending} onClick={() => update.mutate({ id: entry.id, status: 'completed' })}><ArrowLeftRight /> Complete</button> : '—'}</td>
      </tr>)}</tbody></table></div> : <EmptyState title="No exchange requests" message="Customer exchange requests will appear here after delivery." />)}
    </section>
  </>;
}

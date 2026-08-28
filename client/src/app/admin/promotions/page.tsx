'use client';

import { FormEvent, useState } from 'react';
import { BadgeDollarSign, CalendarRange, Pencil, Percent, Plus, Tag, Trash2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminKeys, createPromotion, deletePromotion, fetchPromotions, updatePromotion, type CouponDraft,
} from '@/lib/admin';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/DataStates';
import { useToastStore } from '@/stores/toast';
import type { Coupon } from '@/types/commerce';
import { formatMoney } from '@/lib/money';

type EditorDraft = Omit<CouponDraft, 'startsAt' | 'expiresAt' | 'usageLimit'> & {
  startsAt: string; expiresAt: string; usageLimit: number | '';
};
const blank: EditorDraft = { name: '', code: '', discountType: 'percentage', value: 15, minimumSpend: 0, isActive: true, startsAt: '', expiresAt: '', usageLimit: '' };
const money = (value: number) => formatMoney(value, 'tr');
const localDate = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 16) : '';

export default function PromotionsPage() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [draft, setDraft] = useState<EditorDraft>(blank);
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null);
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const promotions = useQuery({ queryKey: adminKeys.promotions(), queryFn: fetchPromotions });

  const save = useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: CouponDraft }) => id ? updatePromotion(id, payload) : createPromotion(payload),
    onSuccess: (coupon) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.promotions() });
      setEditorOpen(false); setEditing(null);
      showToast({ tone: 'success', title: editing ? 'Promotion updated' : 'Promotion created', message: `${coupon.code} is ready.` });
    },
    onError: (error) => showToast({ tone: 'error', title: 'Could not save promotion', message: error instanceof Error ? error.message : '' }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => deletePromotion(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.promotions() }); setPendingDelete(null);
      showToast({ tone: 'success', title: 'Promotion removed', message: 'Open carts no longer reference this code.' });
    },
    onError: (error) => showToast({ tone: 'error', title: 'Could not remove promotion', message: error instanceof Error ? error.message : '' }),
  });

  const openNew = () => { setEditing(null); setDraft(blank); setEditorOpen(true); };
  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setDraft({ name: coupon.name, code: coupon.code, discountType: coupon.discountType, value: coupon.value, minimumSpend: coupon.minimumSpend, isActive: coupon.isActive, startsAt: localDate(coupon.startsAt), expiresAt: localDate(coupon.expiresAt), usageLimit: coupon.usageLimit ?? '' });
    setEditorOpen(true);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate({ id: editing?.id, payload: { ...draft, code: draft.code.trim().toUpperCase(), startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null, expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null, usageLimit: draft.usageLimit === '' ? null : draft.usageLimit } });
  };

  const entries = promotions.data ?? [];
  const now = Date.now();
  const active = entries.filter((coupon) => coupon.isActive && (!coupon.startsAt || new Date(coupon.startsAt).getTime() <= now) && (!coupon.expiresAt || new Date(coupon.expiresAt).getTime() > now) && (!coupon.usageLimit || coupon.redemptionCount < coupon.usageLimit)).length;
  const scheduled = entries.filter((coupon) => coupon.startsAt && new Date(coupon.startsAt).getTime() > now).length;
  const redemptions = entries.reduce((total, coupon) => total + coupon.redemptionCount, 0);

  return <>
    <div className="admin-page-heading"><div><span className="admin-kicker">Campaigns</span><h1>Promotions</h1><p>Create the codes customers can validate securely at checkout.</p></div><div><button className="admin-button admin-button--primary" onClick={openNew}><Plus size={15} /> New promotion</button></div></div>
    <section className="inventory-stats promotion-stats"><div className="admin-card"><span>Total codes</span><strong>{promotions.isPending ? '—' : entries.length}</strong><small>Persisted in the database</small></div><div className="admin-card"><span>Active now</span><strong>{active}</strong><small>Eligible at checkout</small></div><div className="admin-card"><span>Scheduled</span><strong>{scheduled}</strong><small>Starts in the future</small></div><div className="admin-card"><span>Redemptions</span><strong>{redemptions}</strong><small>Orders using a code</small></div></section>
    <div className="admin-card table-card">
      {promotions.isPending && <TableSkeleton rows={6} columns={7} />}
      {promotions.isError && <ErrorState error={promotions.error} onRetry={() => promotions.refetch()} />}
      {promotions.data && (entries.length ? <div className="admin-table admin-table--large"><table><thead><tr><th>Promotion</th><th>Discount</th><th>Minimum</th><th>Window</th><th>Usage</th><th>Status</th><th /></tr></thead><tbody>{entries.map((coupon) => {
        const expired = Boolean(coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= now);
        const future = Boolean(coupon.startsAt && new Date(coupon.startsAt).getTime() > now);
        const exhausted = Boolean(coupon.usageLimit && coupon.redemptionCount >= coupon.usageLimit);
        const status = !coupon.isActive ? 'Paused' : expired ? 'Expired' : future ? 'Scheduled' : exhausted ? 'Used up' : 'Active';
        return <tr key={coupon.id}><td><div className="promotion-code-cell"><Tag size={16} /><section><strong>{coupon.code}</strong><small>{coupon.name}</small></section></div></td><td><strong>{coupon.discountType === 'percentage' ? `${coupon.value}%` : money(coupon.value)}</strong><small>{coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed amount'}</small></td><td>{coupon.minimumSpend ? money(coupon.minimumSpend) : 'None'}</td><td><small>{coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString('en-GB') : 'Immediately'} → {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-GB') : 'No expiry'}</small></td><td>{coupon.redemptionCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</td><td><span className={`status ${status === 'Active' ? 'status--active' : status === 'Scheduled' ? 'status--scheduled' : 'status--draft'}`}>{status}</span></td><td><div className="row-actions"><button onClick={() => openEdit(coupon)} title={`Edit ${coupon.code}`}><Pencil size={15} /></button><button onClick={() => setPendingDelete(coupon)} title={`Delete ${coupon.code}`}><Trash2 size={15} /></button></div></td></tr>;
      })}</tbody></table></div> : <EmptyState title="No promotion codes yet" message="Create a percentage or fixed-amount offer for checkout." action={<button className="admin-button admin-button--primary" onClick={openNew}><Plus size={15} /> New promotion</button>} />)}
    </div>
    {editorOpen && <div className="modal-root"><button className="panel-scrim" onClick={() => setEditorOpen(false)} aria-label="Close promotion editor" /><form className="editor-panel glass-overlay" onSubmit={submit}><header><div><span className="admin-kicker">{editing ? 'Edit campaign' : 'New campaign'}</span><h2>{editing?.code || 'Promotion code'}</h2></div><button type="button" className="icon-button" onClick={() => setEditorOpen(false)}><X /></button></header><div className="editor-body">
      <section className="editor-section"><h3>Identity</h3><div className="editor-grid"><label>Internal name<input required maxLength={120} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Welcome offer" /></label><label>Customer code<input required maxLength={40} pattern="[A-Za-z0-9_-]+" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="WELCOME15" /></label></div></section>
      <section className="editor-section"><h3>Discount</h3><div className="promotion-type-grid"><button type="button" className={draft.discountType === 'percentage' ? 'active' : ''} onClick={() => setDraft({ ...draft, discountType: 'percentage' })}><Percent /><span><strong>Percentage</strong><small>A share of the cart subtotal</small></span></button><button type="button" className={draft.discountType === 'fixed_amount' ? 'active' : ''} onClick={() => setDraft({ ...draft, discountType: 'fixed_amount' })}><BadgeDollarSign /><span><strong>Fixed amount</strong><small>A precise TRY saving</small></span></button></div><div className="editor-grid"><label>{draft.discountType === 'percentage' ? 'Percent off' : 'Amount off (TL)'}<input required type="number" min="0.01" max={draft.discountType === 'percentage' ? 100 : undefined} step="0.01" value={draft.value} onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })} /></label><label>Minimum spend (TL)<input type="number" min="0" step="0.01" value={draft.minimumSpend} onChange={(e) => setDraft({ ...draft, minimumSpend: Number(e.target.value) })} /></label></div></section>
      <section className="editor-section"><h3>Schedule &amp; limits</h3><div className="editor-grid"><label><CalendarRange size={13} /> Starts at<input type="datetime-local" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} /></label><label><CalendarRange size={13} /> Expires at<input type="datetime-local" value={draft.expiresAt} onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })} /></label><label>Usage limit<input type="number" min="1" value={draft.usageLimit} onChange={(e) => setDraft({ ...draft, usageLimit: e.target.value ? Number(e.target.value) : '' })} placeholder="Unlimited" /></label><label className="promotion-active"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /><span><strong>Active</strong><small>Customers can apply this code</small></span></label></div></section>
    </div><footer><button type="button" className="admin-button admin-button--secondary" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" className="admin-button admin-button--primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create promotion'}</button></footer></form></div>}
    {pendingDelete && <div className="modal-root"><button className="modal-scrim" onClick={() => setPendingDelete(null)} aria-label="Close" /><div className="invite-modal glass-overlay" role="dialog" aria-modal="true"><header><div><span className="admin-kicker">Delete code</span><h2>{pendingDelete.code}</h2></div><button className="icon-button" onClick={() => setPendingDelete(null)}><X /></button></header><p>This permanently disables the code and detaches it from open carts. Historical orders keep their discount snapshot.</p><div><button className="admin-button admin-button--secondary" onClick={() => setPendingDelete(null)}>Cancel</button><button className="admin-button admin-button--danger" onClick={() => remove.mutate(pendingDelete.id)} disabled={remove.isPending}>{remove.isPending ? 'Removing…' : 'Remove promotion'}</button></div></div></div>}
  </>;
}

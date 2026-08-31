'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Search, Send, StickyNote } from 'lucide-react';
import { adminKeys, fetchSupportTickets, replySupportTicket, updateSupportTicket } from '@/lib/admin';
import { EmptyState, ErrorState, PanelSkeleton } from '@/components/DataStates';
import { useToastStore } from '@/stores/toast';
import type { SupportTicket } from '@/types/commerce';

export default function SupportPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<number>();
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.show);
  const query = useMemo(() => ({ search: search || undefined, status: status || undefined }), [search, status]);
  const tickets = useQuery({ queryKey: adminKeys.support(query), queryFn: () => fetchSupportTickets(query) });
  const selected = tickets.data?.items.find((x) => x.id === selectedId) ?? tickets.data?.items[0];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'support'] });
  const send = useMutation({ mutationFn: () => replySupportTicket(selected!.id, reply, internal), onSuccess: () => { setReply(''); setInternal(false); void refresh(); toast({ tone: 'success', title: internal ? 'Internal note added' : 'Reply sent' }); }, onError: (e) => toast({ tone: 'error', title: 'Message not sent', message: e instanceof Error ? e.message : '' }) });
  const update = useMutation({ mutationFn: (changes: Parameters<typeof updateSupportTicket>[1]) => updateSupportTicket(selected!.id, changes), onSuccess: () => void refresh(), onError: (e) => toast({ tone: 'error', title: 'Ticket not updated', message: e instanceof Error ? e.message : '' }) });

  return <>
    <div className="admin-page-heading"><div><span className="admin-kicker">Customer care</span><h1>Support inbox</h1><p>Reply to customers, collaborate with private notes, and keep every request accountable.</p></div></div>
    {tickets.isPending && <PanelSkeleton lines={8} />}
    {tickets.isError && <ErrorState error={tickets.error} onRetry={() => tickets.refetch()} />}
    {tickets.data && !tickets.data.items.length && <EmptyState title="Inbox clear" message="New customer requests will appear here." />}
    {tickets.data && tickets.data.items.length > 0 && <section className="admin-card support-workspace">
      <aside className="ticket-list">
        <div className="ticket-list__toolbar"><label><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets" /></label></div>
        <div className="ticket-list__filters">{['', 'open', 'in_progress', 'pending_customer', 'resolved'].map((value) => <button key={value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{value ? value.replaceAll('_', ' ') : 'All'}</button>)}</div>
        <div className="ticket-scroll">{tickets.data.items.map((ticket) => <button className={selected?.id === ticket.id ? 'active' : ''} key={ticket.id} onClick={() => setSelectedId(ticket.id)}><div><span className={`priority-dot priority-dot--${ticket.priority}`} /><strong>{ticket.customerName}</strong><small>{new Date(ticket.updatedAt).toLocaleDateString()}</small></div><h3>{ticket.subject}</h3><p>{ticket.messages.at(-1)?.body}</p><footer><span className={`priority priority--${ticket.priority}`}>{ticket.priority}</span><span><MessageSquare /> {ticket.messages.length}</span></footer></button>)}</div>
      </aside>
      {selected && <main className="thread-panel">
        <header className="thread-header"><div><small>{selected.number}</small><h2>{selected.subject}</h2><span>{selected.customerName} · {selected.customerEmail}</span></div><div><select aria-label="Priority" value={selected.priority} onChange={(e) => update.mutate({ priority: e.target.value as SupportTicket['priority'] })}>{['low','normal','high','urgent'].map(x => <option key={x}>{x}</option>)}</select><select aria-label="Status" value={selected.status} onChange={(e) => update.mutate({ status: e.target.value as SupportTicket['status'] })}>{['open','in_progress','pending_customer','resolved','closed'].map(x => <option key={x} value={x}>{x.replaceAll('_',' ')}</option>)}</select></div></header>
        <div className="thread-scroll">{selected.messages.map((message) => <article key={message.id} className={`message ${message.authorId === selected.customerId ? 'message--customer' : 'message--staff'} ${message.isInternal ? 'message--internal' : ''}`}><header><strong>{message.authorName}</strong>{message.isInternal && <span><StickyNote /> Internal note</span>}<time>{new Date(message.createdAt).toLocaleString()}</time></header><p>{message.body}</p></article>)}</div>
        <footer className="reply-box"><textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={internal ? 'Private note for the support team…' : 'Reply to the customer…'} /><div><label><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note</label><button className="admin-button admin-button--primary" disabled={!reply.trim() || send.isPending} onClick={() => send.mutate()}><Send /> {internal ? 'Add note' : 'Send reply'}</button></div></footer>
      </main>}
      {selected && <aside className="customer-context"><header><span>{selected.customerName.slice(0, 2).toUpperCase()}</span><h3>{selected.customerName}</h3><p>{selected.customerEmail}</p></header><section><h4>Ticket</h4><p><span>Category</span>{selected.category}</p><p><span>Opened</span>{new Date(selected.createdAt).toLocaleDateString()}</p><p><span>First response</span>{selected.firstRespondedAt ? new Date(selected.firstRespondedAt).toLocaleString() : 'Waiting'}</p></section>{selected.orderNumber && <section><h4>Related order</h4><div className="context-order"><MessageSquare /><span><strong>{selected.orderNumber}</strong><small>Customer order</small></span></div></section>}</aside>}
    </section>}
  </>;
}

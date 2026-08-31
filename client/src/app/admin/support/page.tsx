'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Download, FileText, Filter, MessageSquareText, Paperclip, RefreshCw, Search, Send, ShoppingBag, UserRound, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorState, PanelSkeleton } from '@/components/DataStates';
import {
  addAdminTicketMessage,
  downloadTicketAttachment,
  fetchAdminTicket,
  fetchAdminTickets,
  fetchSupportAgents,
  supportKeys,
  updateAdminTicket,
  type AdminTicketQuery,
} from '@/lib/support';
import { formatMoney } from '@/lib/money';
import { useToastStore } from '@/stores/toast';
import type { TicketDetail, TicketPriority, TicketStatus } from '@/types/support';
import type { Paged } from '@/lib/apiClient';
import type { TicketSummary } from '@/types/support';

const STATUS_OPTIONS: Array<{ value: TicketStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_for_customer', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];
const PRIORITIES: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];
const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'];
const CANNED_RESPONSES = [
  { label: 'Choose a saved reply…', value: '' },
  { label: 'Order update', value: 'Thank you for checking in. We are reviewing your order now and will update you with the next delivery milestone shortly.' },
  { label: 'More details needed', value: 'Thank you for your message. Could you share a little more detail or attach a clear photo so our atelier can review this properly?' },
  { label: 'Resolution confirmation', value: 'We have completed the requested action. Please let us know if everything now looks right, and we will close this conversation.' },
];

const titleCase = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

export default function SupportPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | 'all'>('all');
  const [assignment, setAssignment] = useState<AdminTicketQuery['assignment']>('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replyMode, setReplyMode] = useState<'reply' | 'note'>('reply');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [status, assignment, debouncedSearch]);

  const listQuery: AdminTicketQuery = {
    status,
    assignment,
    search: debouncedSearch || undefined,
    page,
    pageSize: 30,
  };
  const tickets = useQuery({
    queryKey: supportKeys.adminList(listQuery),
    queryFn: () => fetchAdminTickets(listQuery),
  });
  const agents = useQuery({ queryKey: supportKeys.agents(), queryFn: fetchSupportAgents });
  const detail = useQuery({
    queryKey: supportKeys.adminDetail(selectedId || 0),
    queryFn: () => fetchAdminTicket(selectedId!),
    enabled: selectedId !== null,
  });

  useEffect(() => {
    const items = tickets.data?.items || [];
    if (!items.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !items.some((ticket) => ticket.id === selectedId)) setSelectedId(items[0].id);
  }, [selectedId, tickets.data]);

  useEffect(() => {
    if (!detail.data) return;
    queryClient.setQueryData<Paged<TicketSummary>>(supportKeys.adminList(listQuery), (current) => current ? {
      ...current,
      items: current.items.map((ticket) => ticket.id === detail.data!.id ? { ...ticket, isUnread: false } : ticket),
    } : current);
  }, [detail.data, queryClient]);

  const refreshTicket = (ticket: TicketDetail) => {
    queryClient.setQueryData(supportKeys.adminDetail(ticket.id), ticket);
    void queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] });
    void queryClient.invalidateQueries({ queryKey: supportKeys.agents() });
  };

  const updateTicket = useMutation({
    mutationFn: ({ ticket, changes }: { ticket: TicketDetail; changes: Partial<Pick<TicketDetail, 'status' | 'priority' | 'assignedToUserId'>> }) =>
      updateAdminTicket(ticket.id, {
        status: changes.status ?? ticket.status,
        priority: changes.priority ?? ticket.priority,
        assignedToUserId: changes.assignedToUserId === undefined ? ticket.assignedToUserId : changes.assignedToUserId,
      }),
    onSuccess: (ticket) => {
      refreshTicket(ticket);
      showToast({ tone: 'success', title: 'Ticket updated' });
    },
    onError: (error) => showToast({ tone: 'error', title: 'Could not update ticket', message: error instanceof Error ? error.message : '' }),
  });

  const sendMessage = useMutation({
    mutationFn: ({ id, message, internal, attachments }: { id: number; message: string; internal: boolean; attachments: File[] }) =>
      addAdminTicketMessage(id, message, internal, attachments),
    onSuccess: (ticket) => {
      refreshTicket(ticket);
      setBody('');
      setFiles([]);
      if (fileInput.current) fileInput.current.value = '';
      showToast({ tone: 'success', title: replyMode === 'note' ? 'Internal note added' : 'Reply sent' });
    },
    onError: (error) => showToast({ tone: 'error', title: 'Message was not sent', message: error instanceof Error ? error.message : '' }),
  });

  const submitReply = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId || !body.trim()) return;
    sendMessage.mutate({ id: selectedId, message: body.trim(), internal: replyMode === 'note', attachments: files });
  };

  const selected = detail.data;
  const replyBlocked = selected?.status === 'closed' && replyMode === 'reply';
  const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const relative = (value: string) => {
    const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60_000);
    if (Math.abs(minutes) < 60) return relativeFormat.format(minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return relativeFormat.format(hours, 'hour');
    return relativeFormat.format(Math.round(hours / 24), 'day');
  };

  return (
    <>
      <div className="admin-page-heading support-heading">
        <div><span className="admin-kicker">Customer care</span><h1>Support inbox</h1><p>Customer conversations, private notes, assignments, and order context in one place.</p></div>
        <div>
          <label className="support-assignment-filter"><Filter size={14} /><span className="sr-only">Assignment filter</span><select value={assignment} onChange={(event) => setAssignment(event.target.value)}><option value="all">All assignments</option><option value="mine">Assigned to me</option><option value="unassigned">Unassigned</option>{agents.data?.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
          <button type="button" className="admin-button" onClick={() => tickets.refetch()}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      <section className="support-workspace admin-card">
        <aside className="ticket-list">
          <div className="ticket-list__toolbar">
            <label><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tickets or customers" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={12} /></button>}</label>
          </div>
          <div className="ticket-list__filters" role="tablist" aria-label="Ticket status">
            {STATUS_OPTIONS.map((option) => <button type="button" role="tab" aria-selected={status === option.value} className={status === option.value ? 'active' : ''} key={option.value} onClick={() => setStatus(option.value)}>{option.label}</button>)}
          </div>

          {tickets.isPending && <PanelSkeleton lines={7} />}
          {tickets.isError && <ErrorState error={tickets.error} onRetry={() => tickets.refetch()} title="Could not load support tickets" />}
          {tickets.data && <div className="ticket-scroll">
            {tickets.data.items.map((ticket) => (
              <button type="button" className={selectedId === ticket.id ? 'active' : ''} key={ticket.id} onClick={() => setSelectedId(ticket.id)}>
                <div><i className={`priority-dot priority-dot--${ticket.priority}`} /><strong>{ticket.customerName}{ticket.isUnread && <span className="ticket-unread" aria-label="Unread" />}</strong><small>{relative(ticket.lastMessageAt)}</small></div>
                <h3>{ticket.subject}</h3><p>{ticket.preview}</p>
                <footer><span className={`priority priority--${ticket.priority}`}>{ticket.priority}</span><span><MessageSquareText size={11} /> {ticket.messageCount} · {titleCase(ticket.status)}</span></footer>
              </button>
            ))}
            {!tickets.data.items.length && <div className="ticket-list-empty"><MessageSquareText /><strong>No tickets here</strong><span>Try another filter or search.</span></div>}
          </div>}
          {tickets.data && tickets.data.totalPages > 1 && <div className="ticket-pagination"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>{page} / {tickets.data.totalPages}</span><button type="button" disabled={page >= tickets.data.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
        </aside>

        <main className="thread-panel">
          {selectedId && detail.isPending && <PanelSkeleton lines={8} />}
          {detail.isError && <ErrorState error={detail.error} onRetry={() => detail.refetch()} title="Could not open this ticket" />}
          {!selectedId && !tickets.isPending && <div className="support-no-selection"><MessageSquareText /><h2>Select a ticket</h2><p>Choose a customer conversation from the inbox.</p></div>}
          {selected && <>
            <header className="thread-header">
              <div><span className="admin-kicker">{selected.number} · {titleCase(selected.category)}</span><h2>{selected.subject}</h2><p>Opened {dateTime.format(new Date(selected.createdAt))}{selected.orderNumber ? ` · Order ${selected.orderNumber}` : ''}</p></div>
              <div>
                <label><span className="sr-only">Assigned agent</span><select value={selected.assignedToUserId || ''} disabled={updateTicket.isPending} onChange={(event) => updateTicket.mutate({ ticket: selected, changes: { assignedToUserId: event.target.value || null } })}><option value="">Unassigned</option>{agents.data?.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
                <label><span className="sr-only">Priority</span><select value={selected.priority} disabled={updateTicket.isPending} onChange={(event) => updateTicket.mutate({ ticket: selected, changes: { priority: event.target.value as TicketPriority } })}>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{titleCase(priority)} priority</option>)}</select></label>
                <label><span className="sr-only">Status</span><select value={selected.status} disabled={updateTicket.isPending} onChange={(event) => updateTicket.mutate({ ticket: selected, changes: { status: event.target.value as TicketStatus } })}>{TICKET_STATUSES.map((ticketStatus) => <option key={ticketStatus} value={ticketStatus}>{titleCase(ticketStatus)}</option>)}</select></label>
              </div>
            </header>

            <div className="thread-scroll">
              {selected.messages.map((message) => (
                <article className={`message${message.isInternal ? ' message--internal' : message.isStaff ? ' message--staff' : ''}`} key={message.id}>
                  <span>{initials(message.authorName)}</span>
                  <div>{message.isInternal && <small>PRIVATE NOTE · {message.authorName}</small>}<p>{message.body}</p>
                    {message.attachments.length > 0 && <div className="message-attachments">{message.attachments.map((attachment) => <button type="button" key={attachment.id} onClick={() => void downloadTicketAttachment(selected.id, attachment).catch((error) => showToast({ tone: 'error', title: 'Could not download attachment', message: error instanceof Error ? error.message : '' }))}><FileText size={13} /><span>{attachment.fileName}</span><Download size={12} /></button>)}</div>}
                    <time>{message.authorName} · {dateTime.format(new Date(message.createdAt))}</time>
                  </div>
                </article>
              ))}
            </div>

            <form className={`reply-box${replyMode === 'note' ? ' reply-box--note' : ''}`} onSubmit={submitReply}>
              <div className="reply-tabs"><button type="button" className={replyMode === 'reply' ? 'active' : ''} onClick={() => setReplyMode('reply')}>Reply to customer</button><button type="button" className={replyMode === 'note' ? 'active' : ''} onClick={() => setReplyMode('note')}>Internal note</button></div>
              <textarea required minLength={2} maxLength={4000} disabled={replyBlocked} value={body} onChange={(event) => setBody(event.target.value)} placeholder={replyMode === 'note' ? 'Add a private note for the support team…' : replyBlocked ? 'Reopen this ticket before replying to the customer.' : 'Write a helpful reply…'} />
              {files.length > 0 && <div className="reply-files">{files.map((file) => <span key={`${file.name}-${file.lastModified}`}>{file.name}</span>)}</div>}
              <footer>
                <div>
                  <button type="button" onClick={() => fileInput.current?.click()}><Paperclip /> Attach<input ref={fileInput} hidden type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 5))} /></button>
                  {replyMode === 'reply' && <label className="canned-response"><span className="sr-only">Saved reply</span><select value="" onChange={(event) => { if (event.target.value) setBody(event.target.value); }} disabled={sendMessage.isPending}>{CANNED_RESPONSES.map((response) => <option key={response.label} value={response.value}>{response.label}</option>)}</select></label>}
                </div>
                <button type="submit" disabled={replyBlocked || sendMessage.isPending || body.trim().length < 2}>{sendMessage.isPending ? 'Sending…' : replyMode === 'note' ? 'Add note' : 'Send reply'} <Send /></button>
              </footer>
            </form>
          </>}
        </main>

        {selected && <aside className="customer-context">
          <header><span>{initials(selected.customerName)}</span><h3>{selected.customerName}</h3><p>{selected.customerEmail}</p></header>
          <div className="context-metrics"><div><strong>{selected.customerContext?.orderCount ?? 0}</strong><span>ORDERS</span></div><div><strong>{formatMoney(selected.customerContext?.lifetimeSpend ?? 0, 'tr')}</strong><span>LIFETIME SPEND</span></div></div>
          <section><h4>Assignment</h4><label className="context-select"><UserRound size={14} /><select value={selected.assignedToUserId || ''} disabled={updateTicket.isPending} onChange={(event) => updateTicket.mutate({ ticket: selected, changes: { assignedToUserId: event.target.value || null } })}><option value="">Unassigned</option>{agents.data?.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.openTicketCount} open</option>)}</select></label></section>
          <section><h4>Recent orders</h4>{selected.customerContext?.recentOrders.length ? selected.customerContext.recentOrders.map((order) => <article className="context-order" key={order.number}><ShoppingBag size={16} /><span><strong>{order.number}</strong><small>{titleCase(order.status)} · {formatMoney(order.total, 'tr')}</small></span></article>) : <p className="context-empty">No order history</p>}</section>
          <section><h4>Ticket details</h4><p><span>Category</span><strong>{titleCase(selected.category)}</strong></p><p><span>Priority</span><strong>{titleCase(selected.priority)}</strong></p><p><span>Messages</span><strong>{selected.messageCount}</strong></p>{selected.orderNumber && <p><span>Order</span><strong>{selected.orderNumber}</strong></p>}</section>
        </aside>}
      </section>
    </>
  );
}

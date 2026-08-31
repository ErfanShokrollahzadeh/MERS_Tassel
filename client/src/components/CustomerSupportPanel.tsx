'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Download, FileText, LifeBuoy, MessageSquareText, Paperclip, Plus, Send, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorState, PanelSkeleton } from '@/components/DataStates';
import {
  createTicket,
  downloadTicketAttachment,
  fetchMyTicket,
  fetchMyTickets,
  replyToTicket,
  supportKeys,
} from '@/lib/support';
import { useToastStore } from '@/stores/toast';
import type { Order } from '@/types/commerce';
import type { TicketCategory, TicketDetail, TicketSummary } from '@/types/support';

const CATEGORIES: TicketCategory[] = ['order', 'product', 'shipping', 'return', 'repair', 'account', 'other'];
const titleCase = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const TR_LABELS: Record<string, string> = {
  order: 'Sipariş', product: 'Ürün', shipping: 'Teslimat', return: 'İade', repair: 'Onarım', account: 'Hesap', other: 'Diğer',
  open: 'Açık', in_progress: 'İşlemde', waiting_for_customer: 'Yanıtınız bekleniyor', resolved: 'Çözüldü', closed: 'Kapalı',
};

export function CustomerSupportPanel({ orders, tr }: { orders: Order[]; tr: boolean }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('order');
  const [message, setMessage] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [reply, setReply] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const createFiles = useRef<HTMLInputElement>(null);
  const responseFiles = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);

  const tickets = useQuery({ queryKey: supportKeys.mine(), queryFn: fetchMyTickets });
  const detail = useQuery({
    queryKey: supportKeys.mineDetail(selectedId || 0),
    queryFn: () => fetchMyTicket(selectedId!),
    enabled: selectedId !== null && !creating,
  });

  useEffect(() => {
    if (creating) return;
    const items = tickets.data || [];
    if (!items.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !items.some((ticket) => ticket.id === selectedId)) setSelectedId(items[0].id);
  }, [creating, selectedId, tickets.data]);

  useEffect(() => {
    if (!detail.data) return;
    queryClient.setQueryData<TicketSummary[]>(supportKeys.mine(), (current) =>
      current?.map((ticket) => ticket.id === detail.data!.id ? { ...ticket, isUnread: false } : ticket));
  }, [detail.data, queryClient]);

  const refresh = (ticket: TicketDetail) => {
    queryClient.setQueryData(supportKeys.mineDetail(ticket.id), ticket);
    void queryClient.invalidateQueries({ queryKey: supportKeys.mine() });
    setSelectedId(ticket.id);
  };

  const create = useMutation({
    mutationFn: () => createTicket({ subject, category, message, orderNumber: orderNumber || undefined }, files),
    onSuccess: (ticket) => {
      refresh(ticket);
      setCreating(false);
      setSubject(''); setMessage(''); setOrderNumber(''); setFiles([]);
      if (createFiles.current) createFiles.current.value = '';
      showToast({ tone: 'success', title: tr ? 'Destek talebiniz açıldı' : 'Support request opened', message: ticket.number });
    },
    onError: (error) => showToast({ tone: 'error', title: tr ? 'Talep açılamadı' : 'Could not open request', message: error instanceof Error ? error.message : '' }),
  });

  const respond = useMutation({
    mutationFn: () => replyToTicket(selectedId!, reply, replyFiles),
    onSuccess: (ticket) => {
      refresh(ticket);
      setReply(''); setReplyFiles([]);
      if (responseFiles.current) responseFiles.current.value = '';
      showToast({ tone: 'success', title: tr ? 'Yanıtınız gönderildi' : 'Reply sent' });
    },
    onError: (error) => showToast({ tone: 'error', title: tr ? 'Yanıt gönderilemedi' : 'Could not send reply', message: error instanceof Error ? error.message : '' }),
  });

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };
  const submitReply = (event: FormEvent) => {
    event.preventDefault();
    if (reply.trim().length >= 2) respond.mutate();
  };

  const dateTime = new Intl.DateTimeFormat(tr ? 'tr-TR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const label = (value: string) => tr ? TR_LABELS[value] || titleCase(value) : titleCase(value);
  const selected = detail.data;

  return (
    <section className="account-card customer-support-card">
      <header>
        <div><span className="account-icon"><LifeBuoy /></span><div><span className="eyebrow">{tr ? 'MERS DESTEK' : 'MERS SUPPORT'}</span><h2>{tr ? 'Size nasıl yardımcı olabiliriz?' : 'How can we help?'}</h2></div></div>
        <button type="button" className="button button--ghost" onClick={() => setCreating(true)}><Plus /> {tr ? 'Yeni talep' : 'New request'}</button>
      </header>

      <div className="customer-support-layout">
        <aside className="customer-ticket-list">
          {tickets.isPending && <PanelSkeleton lines={4} />}
          {tickets.isError && <ErrorState error={tickets.error} onRetry={() => tickets.refetch()} />}
          {tickets.data?.map((ticket) => <button type="button" key={ticket.id} className={!creating && selectedId === ticket.id ? 'active' : ''} onClick={() => { setCreating(false); setSelectedId(ticket.id); }}><span><strong>{ticket.subject}</strong>{ticket.isUnread && <i aria-label={tr ? 'Okunmamış yanıt' : 'Unread reply'} />}</span><small>{ticket.number} · {label(ticket.status)}</small><p>{ticket.preview}</p></button>)}
          {tickets.data && !tickets.data.length && <div className="customer-ticket-empty"><MessageSquareText /><span>{tr ? 'Henüz bir destek talebiniz yok.' : 'You have no support requests yet.'}</span></div>}
        </aside>

        <main className="customer-ticket-thread">
          {creating && <form className="customer-ticket-form" onSubmit={submitCreate}>
            <div className="customer-ticket-form__heading"><div><span className="eyebrow">{tr ? 'YENİ TALEP' : 'NEW REQUEST'}</span><h3>{tr ? 'Bize neler olduğunu anlatın' : 'Tell us what happened'}</h3></div><button type="button" aria-label={tr ? 'Kapat' : 'Close'} onClick={() => setCreating(false)}><X /></button></div>
            <div className="customer-ticket-fields">
              <label>{tr ? 'Konu' : 'Subject'}<input required minLength={4} maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={tr ? 'Kısaca nasıl yardımcı olabiliriz?' : 'A short summary of what you need'} /></label>
              <div><label>{tr ? 'Kategori' : 'Category'}<select value={category} onChange={(event) => setCategory(event.target.value as TicketCategory)}>{CATEGORIES.map((item) => <option value={item} key={item}>{label(item)}</option>)}</select></label><label>{tr ? 'İlgili sipariş' : 'Related order'}<select value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)}><option value="">{tr ? 'Sipariş seçilmedi' : 'No order selected'}</option>{orders.map((order) => <option key={order.id} value={order.number}>{order.number}</option>)}</select></label></div>
              <label>{tr ? 'Mesajınız' : 'Your message'}<textarea required minLength={10} maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={tr ? 'Ne olduğunu ve sizin için en iyi çözümün ne olacağını paylaşın.' : 'Share what happened and what a good resolution would look like.'} /></label>
            </div>
            {files.length > 0 && <div className="customer-selected-files">{files.map((file) => <span key={`${file.name}-${file.lastModified}`}><FileText /> {file.name}</span>)}</div>}
            <footer><button type="button" className="button button--ghost" onClick={() => createFiles.current?.click()}><Paperclip /> {tr ? 'Dosya ekle' : 'Attach files'}<input ref={createFiles} hidden type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 5))} /></button><button type="submit" className="button button--primary" disabled={create.isPending}>{create.isPending ? (tr ? 'Açılıyor…' : 'Opening…') : (tr ? 'Talebi aç' : 'Open request')} <Send /></button></footer>
          </form>}

          {!creating && selectedId && detail.isPending && <PanelSkeleton lines={6} />}
          {!creating && detail.isError && <ErrorState error={detail.error} onRetry={() => detail.refetch()} />}
          {!creating && !selectedId && !tickets.isPending && <div className="customer-ticket-welcome"><LifeBuoy /><h3>{tr ? 'Atölye ekibi burada' : 'The atelier team is here'}</h3><p>{tr ? 'Sipariş, ürün, teslimat veya bakım konusunda bize yazın.' : 'Write to us about an order, product, delivery, or repair.'}</p><button type="button" className="button button--primary" onClick={() => setCreating(true)}>{tr ? 'İlk talebinizi açın' : 'Open your first request'}</button></div>}

          {!creating && selected && <>
            <header className="customer-thread-header"><div><span>{selected.number} · {label(selected.category)}</span><h3>{selected.subject}</h3></div><b className={`status status--${selected.status}`}>{label(selected.status)}</b></header>
            <div className="customer-thread-messages">{selected.messages.map((item) => <article className={item.isStaff ? 'from-support' : 'from-customer'} key={item.id}><div><strong>{item.authorName}</strong><p>{item.body}</p>{item.attachments.length > 0 && <div className="customer-message-files">{item.attachments.map((attachment) => <button type="button" key={attachment.id} onClick={() => void downloadTicketAttachment(selected.id, attachment).catch((error) => showToast({ tone: 'error', title: tr ? 'Dosya indirilemedi' : 'Could not download file', message: error instanceof Error ? error.message : '' }))}><FileText /><span>{attachment.fileName}</span><Download /></button>)}</div>}<time>{dateTime.format(new Date(item.createdAt))}</time></div></article>)}</div>
            {selected.status !== 'closed' ? <form className="customer-reply-form" onSubmit={submitReply}><textarea required minLength={2} maxLength={4000} value={reply} onChange={(event) => setReply(event.target.value)} placeholder={tr ? 'Yanıtınızı yazın…' : 'Write your reply…'} />{replyFiles.length > 0 && <div className="customer-selected-files">{replyFiles.map((file) => <span key={`${file.name}-${file.lastModified}`}>{file.name}</span>)}</div>}<footer><button type="button" onClick={() => responseFiles.current?.click()}><Paperclip /> {tr ? 'Ekle' : 'Attach'}<input ref={responseFiles} hidden type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(event) => setReplyFiles(Array.from(event.target.files || []).slice(0, 5))} /></button><button type="submit" disabled={respond.isPending || reply.trim().length < 2}>{respond.isPending ? (tr ? 'Gönderiliyor…' : 'Sending…') : (tr ? 'Yanıtla' : 'Reply')} <Send /></button></footer></form> : <p className="customer-ticket-closed">{tr ? 'Bu görüşme kapatıldı. Yeni bir konuda yardıma ihtiyacınız varsa yeni talep açın.' : 'This conversation is closed. Open a new request if you need help with something else.'}</p>}
          </>}
        </main>
      </div>
    </section>
  );
}

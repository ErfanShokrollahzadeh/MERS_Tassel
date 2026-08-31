'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Headphones, MessageSquare, Send } from 'lucide-react';
import { commerceKeys, createSupportTicket, fetchMySupportTickets, replyToSupportTicket } from '@/lib/commerce';
import { useToastStore } from '@/stores/toast';

export function AccountSupport({ tr }: { tr: boolean }) {
  const [subject, setSubject] = useState(''); const [message, setMessage] = useState(''); const [reply, setReply] = useState(''); const [open, setOpen] = useState<number>();
  const qc = useQueryClient(); const toast = useToastStore((s) => s.show);
  const tickets = useQuery({ queryKey: commerceKeys.support(), queryFn: fetchMySupportTickets });
  const refresh = () => qc.invalidateQueries({ queryKey: commerceKeys.support() });
  const create = useMutation({ mutationFn: () => createSupportTicket({ subject, message, category: 'general', priority: 'normal' }), onSuccess: () => { setSubject(''); setMessage(''); void refresh(); toast({ tone: 'success', title: tr ? 'Talebiniz alındı' : 'Request received' }); } });
  const send = useMutation({ mutationFn: () => replyToSupportTicket(open!, reply), onSuccess: () => { setReply(''); void refresh(); } });
  const selected = tickets.data?.find((x) => x.id === open);
  return <section className="account-card account-support"><header><div><span className="account-icon"><Headphones /></span><div><span className="eyebrow">{tr ? 'MÜŞTERİ DESTEĞİ' : 'CUSTOMER CARE'}</span><h2>{tr ? 'Size nasıl yardımcı olabiliriz?' : 'How can we help?'}</h2></div></div></header>
    <div className="support-create"><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={tr ? 'Konu' : 'Subject'} /><textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={tr ? 'Mesajınızı yazın…' : 'Tell us what happened…'} /><button className="button button--primary" disabled={subject.trim().length < 3 || !message.trim() || create.isPending} onClick={() => create.mutate()}><Send /> {tr ? 'Talep oluştur' : 'Create ticket'}</button></div>
    {tickets.data?.length ? <div className="account-ticket-list">{tickets.data.map((ticket) => <button key={ticket.id} onClick={() => setOpen(open === ticket.id ? undefined : ticket.id)}><span><strong>{ticket.subject}</strong><small>{ticket.number}</small></span><span className={`status status--${ticket.status}`}>{ticket.status.replaceAll('_',' ')}</span><MessageSquare /> {ticket.messages.length}</button>)}</div> : null}
    {selected && <div className="account-ticket-thread">{selected.messages.map((m) => <article key={m.id}><strong>{m.authorName}</strong><p>{m.body}</p><time>{new Date(m.createdAt).toLocaleString()}</time></article>)}{selected.status !== 'closed' && <div><input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={tr ? 'Yanıt yazın…' : 'Write a reply…'} /><button className="button button--ghost" disabled={!reply.trim() || send.isPending} onClick={() => send.mutate()}><Send /></button></div>}</div>}
  </section>;
}

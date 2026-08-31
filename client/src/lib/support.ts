import { api, queryString, type Paged } from '@/lib/apiClient';
import type { SupportAgent, TicketAttachment, TicketCategory, TicketDetail, TicketPriority, TicketStatus, TicketSummary } from '@/types/support';

function appendFiles(form: FormData, files: File[]) {
  for (const file of files) form.append('attachments', file);
  return form;
}

export function fetchMyTickets() {
  return api.get<TicketSummary[]>('/tickets', { auth: true, cache: 'no-store' });
}

export function fetchMyTicket(id: number) {
  return api.get<TicketDetail>(`/tickets/${id}`, { auth: true, cache: 'no-store' });
}

export function createTicket(
  payload: { subject: string; category: TicketCategory; message: string; orderNumber?: string },
  files: File[] = [],
) {
  const form = new FormData();
  form.append('Subject', payload.subject);
  form.append('Category', payload.category);
  form.append('Message', payload.message);
  if (payload.orderNumber) form.append('OrderNumber', payload.orderNumber);
  return api.postForm<TicketDetail>('/tickets', appendFiles(form, files), { auth: true });
}

export function replyToTicket(id: number, body: string, files: File[] = []) {
  const form = new FormData();
  form.append('Body', body);
  return api.postForm<TicketDetail>(`/tickets/${id}/messages`, appendFiles(form, files), { auth: true });
}

export type AdminTicketQuery = {
  status?: TicketStatus | 'all';
  priority?: TicketPriority | 'all';
  assignment?: 'all' | 'mine' | 'unassigned' | string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export function fetchAdminTickets(query: AdminTicketQuery = {}) {
  return api.get<Paged<TicketSummary>>(`/admin/support/tickets${queryString(query)}`, { auth: true, cache: 'no-store' });
}

export function fetchAdminTicket(id: number) {
  return api.get<TicketDetail>(`/admin/support/tickets/${id}`, { auth: true, cache: 'no-store' });
}

export function updateAdminTicket(
  id: number,
  payload: { status: TicketStatus; priority: TicketPriority; assignedToUserId?: string | null },
) {
  return api.patch<TicketDetail>(`/admin/support/tickets/${id}`, payload, { auth: true });
}

export function addAdminTicketMessage(id: number, body: string, isInternal: boolean, files: File[] = []) {
  const form = new FormData();
  form.append('Body', body);
  form.append('IsInternal', String(isInternal));
  return api.postForm<TicketDetail>(`/admin/support/tickets/${id}/messages`, appendFiles(form, files), { auth: true });
}

export function fetchSupportAgents() {
  return api.get<SupportAgent[]>('/admin/support/agents', { auth: true, cache: 'no-store' });
}

export function fetchTicketAttachment(ticketId: number, attachment: TicketAttachment) {
  return api.getBlob(`/tickets/${ticketId}/attachments/${attachment.id}`);
}

export async function downloadTicketAttachment(ticketId: number, attachment: TicketAttachment) {
  const blob = await fetchTicketAttachment(ticketId, attachment);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = attachment.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const supportKeys = {
  mine: () => ['support', 'mine'] as const,
  mineDetail: (id: number) => ['support', 'mine', id] as const,
  adminList: (query: AdminTicketQuery) => ['admin', 'support', 'tickets', query] as const,
  adminDetail: (id: number) => ['admin', 'support', 'ticket', id] as const,
  agents: () => ['admin', 'support', 'agents'] as const,
};

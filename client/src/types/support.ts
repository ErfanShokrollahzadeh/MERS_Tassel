export type TicketStatus = 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketCategory = 'order' | 'product' | 'shipping' | 'return' | 'repair' | 'account' | 'other';

export type TicketAttachment = {
  id: number;
  fileName: string;
  contentType: string;
  size: number;
};

export type TicketMessage = {
  id: number;
  authorName: string;
  isStaff: boolean;
  isInternal: boolean;
  body: string;
  createdAt: string;
  attachments: TicketAttachment[];
};

export type TicketSummary = {
  id: number;
  number: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  customerName: string;
  customerEmail: string;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  orderNumber?: string | null;
  preview: string;
  messageCount: number;
  isUnread: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
};

export type TicketOrderContext = {
  number: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
};

export type TicketDetail = TicketSummary & {
  messages: TicketMessage[];
  customerContext?: {
    orderCount: number;
    lifetimeSpend: number;
    customerSince?: string | null;
    recentOrders: TicketOrderContext[];
  } | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
};

export type SupportAgent = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  openTicketCount: number;
};

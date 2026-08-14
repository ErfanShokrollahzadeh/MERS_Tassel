export type Money = { amount: number; currency: 'USD' | 'TRY' };

export type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  description: string;
  story: string;
  price: Money;
  compareAt?: Money;
  image: string;
  images: string[];
  colors: string[];
  material: string;
  dimensions: string;
  rating: number;
  reviews: number;
  stock: number;
  isNew?: boolean;
  isFeatured?: boolean;
};

export type CartLine = {
  product: Product;
  quantity: number;
  color: string;
};

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type Order = {
  id: string;
  customer: string;
  email: string;
  total: number;
  items: number;
  status: OrderStatus;
  date: string;
  channel: string;
};

export type TicketStatus = 'Open' | 'In progress' | 'Resolved';
export type TicketPriority = 'Urgent' | 'High' | 'Normal' | 'Low';

export type Ticket = {
  id: string;
  subject: string;
  customer: string;
  email: string;
  status: TicketStatus;
  priority: TicketPriority;
  updated: string;
  sla: string;
  orderId?: string;
  spend: number;
  messages: Array<{ id: number; from: 'customer' | 'staff'; body: string; time: string; internal?: boolean }>;
};

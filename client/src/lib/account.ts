import { ApiError } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export type AccountOrder = {
  id: number;
  number: string;
  email: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'unpaid' | 'paid' | 'failed' | 'refunded';
  currency: string;
  subtotal: string;
  shipping_total: string;
  total: string;
  created_at: string;
  items: Array<{ id: number; product_name: string; sku: string; quantity: number; unit_price: string }>;
};

export async function fetchAccountOrders(access: string) {
  const response = await fetch(`${API_URL}/v1/commerce/orders/`, {
    headers: { Authorization: `Bearer ${access}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(typeof body.detail === 'string' ? body.detail : 'Orders could not be loaded.', response.status, body);
  }
  return (Array.isArray(body) ? body : body.results || []) as AccountOrder[];
}

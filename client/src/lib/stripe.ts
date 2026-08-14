import type { CartLine } from '@/types/commerce';
import type { Locale } from '@/i18n/I18nProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export type CheckoutSessionResponse = { checkout_url: string; session_id: string; order_number: string };
export type CheckoutOrder = {
  id: number; number: string; email: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'unpaid' | 'paid' | 'failed' | 'refunded';
  currency: string; subtotal: string; shipping_total: string; total: string;
  items: Array<{ id: number; product_name: string; sku: string; quantity: number; unit_price: string }>;
  created_at: string;
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body.detail === 'string' ? body.detail : body.items?.[0] || body.items || 'Something went wrong while preparing checkout.';
    throw new Error(String(message));
  }
  return body as T;
}

export function createCheckoutSession(lines: CartLine[], email: string, shippingTier: 'standard' | 'express', locale: Locale) {
  return apiRequest<CheckoutSessionResponse>('/v1/commerce/stripe/checkout-session/', {
    method: 'POST',
    body: JSON.stringify({ email, shipping_tier: shippingTier, locale, items: lines.map((line) => ({ slug: line.product.slug, color: line.color, quantity: line.quantity })) }),
  });
}

export function getCheckoutOrder(sessionId: string, signal?: AbortSignal) {
  return apiRequest<CheckoutOrder>(`/v1/commerce/stripe/session/${encodeURIComponent(sessionId)}/`, { signal });
}

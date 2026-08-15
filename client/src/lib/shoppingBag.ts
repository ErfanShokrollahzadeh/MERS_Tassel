import { ApiError } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export type ShoppingBagItem = {
  id: number;
  variant_id: number;
  product_name: string;
  product_slug: string;
  sku: string;
  color: string;
  quantity: number;
  unit_price: string;
  added_at: string;
  updated_at: string;
};

export type ShoppingBag = {
  id: string;
  user_id: number;
  email: string;
  status: 'open';
  currency: string;
  items: ShoppingBagItem[];
  subtotal: string;
  created_at: string;
  updated_at: string;
};

async function bagRequest(path: string, access: string, init: RequestInit = {}) {
  const response = await fetch(`${API_URL}/v1/commerce${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}`, ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof body.detail === 'string' ? body.detail : body.quantity?.[0] || body.product_slug?.[0] || 'Shopping bag could not be updated.';
    throw new ApiError(String(detail), response.status, body);
  }
  return body as ShoppingBag;
}

export function fetchShoppingBag(access: string) {
  return bagRequest('/shopping-bag/', access);
}

export function addShoppingBagItem(access: string, productSlug: string, color: string, quantity = 1) {
  return bagRequest('/shopping-bag/items/', access, { method: 'POST', body: JSON.stringify({ product_slug: productSlug, color, quantity }) });
}

export function updateShoppingBagItem(access: string, itemId: number, quantity: number) {
  return bagRequest(`/shopping-bag/items/${itemId}/`, access, { method: 'PATCH', body: JSON.stringify({ quantity }) });
}

export function removeShoppingBagItem(access: string, itemId: number) {
  return bagRequest(`/shopping-bag/items/${itemId}/`, access, { method: 'DELETE' });
}

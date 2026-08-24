import { api, ApiError } from '@/lib/apiClient';
import type { Cart, Order } from '@/types/commerce';

// ── Bag ─────────────────────────────────────────────────────────────────────

export function fetchCart() {
  return api.get<Cart>('/cart', { auth: true });
}

export function addCartItem(productSlug: string, color: string, quantity = 1) {
  return api.post<Cart>('/cart/items', { productSlug, color, quantity }, { auth: true });
}

export type GiftBoxPayload = {
  items: Array<{ productSlug: string; color: string }>;
  giftMessage?: string;
  packagingNotes?: string;
};

export function addGiftBox(payload: GiftBoxPayload) {
  return api.post<Cart>('/cart/gift-boxes', payload, { auth: true });
}

export type SurpriseBoxPayload = {
  recipient: string;
  budget: 30 | 50 | 100;
  vibes: string[];
  giftMessage?: string;
  specialInstructions?: string;
};

export function addSurpriseBox(payload: SurpriseBoxPayload) {
  return api.post<Cart>('/cart/surprise-boxes', payload, { auth: true });
}

export function updateCartItem(itemId: number, quantity: number) {
  return api.patch<Cart>(`/cart/items/${itemId}`, { quantity }, { auth: true });
}

export function removeCartItem(itemId: number) {
  return api.delete<Cart>(`/cart/items/${itemId}`, { auth: true });
}

export function clearCart() {
  return api.delete<null>('/cart', { auth: true });
}

// ── Orders ──────────────────────────────────────────────────────────────────

export type CheckoutPayload = {
  email: string;
  delivery: 'standard' | 'express';
  locale: string;
};

export function checkout(payload: CheckoutPayload) {
  return api.post<Order>('/orders/checkout', payload, { auth: true });
}

export function fetchMyOrders() {
  return api.get<Order[]>('/orders', { auth: true });
}

export function fetchOrder(number: string) {
  return api.get<Order>(`/orders/${encodeURIComponent(number)}`, { auth: true });
}

// ── Payments ────────────────────────────────────────────────────────────────

export type CheckoutSession = { checkoutUrl: string; sessionId: string; orderNumber: string };

export async function createCheckoutSession(orderNumber: string, locale: string) {
  const payload = { orderNumber, locale };
  try {
    return await api.post<CheckoutSession>('/payments/checkout-session', payload, { auth: true });
  } catch (error) {
    // Compatibility during rolling deployments: older API instances expose the Stripe-
    // named path only. New instances accept both while the storefront stays provider-neutral.
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    return api.post<CheckoutSession>('/payments/stripe/checkout-session', payload, { auth: true });
  }
}

export async function fetchOrderByPaymentSession(sessionId: string, signal?: AbortSignal) {
  const encoded = encodeURIComponent(sessionId);
  try {
    return await api.get<Order>(`/payments/session/${encoded}`, { auth: true, signal });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    return api.get<Order>(`/payments/stripe/session/${encoded}`, { auth: true, signal });
  }
}

export const commerceKeys = {
  cart: () => ['cart'] as const,
  orders: () => ['orders'] as const,
  order: (number: string) => ['order', number] as const,
};

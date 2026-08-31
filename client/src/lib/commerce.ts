import { api, ApiError } from '@/lib/apiClient';
import type { Cart, ExchangeRequest, Order, SupportTicket, TradeInEstimate, Wallet } from '@/types/commerce';
import { STORE_CURRENCY } from '@/lib/money';

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

export function validateCoupon(code: string, subtotal: number) {
  return api.post<Cart>('/coupons/validate', { code, subtotal }, { auth: true });
}

export function removeCoupon() {
  return api.delete<Cart>('/coupons/current', { auth: true });
}

// ── Trade-in ───────────────────────────────────────────────────────────────

export type TradeInEstimatePayload = {
  category: string;
  condition: 'like_new' | 'good' | 'fair';
  targetProductSlug?: string;
  targetProductPrice?: number;
};

export type ApplyTradeInPayload = TradeInEstimatePayload & {
  brandModel: string;
  handoffMethod: 'pickup' | 'drop_off';
  image: File;
};

export function estimateTradeIn(payload: TradeInEstimatePayload) {
  return api.post<TradeInEstimate>('/trade-ins/estimate', payload);
}

export function applyTradeIn(payload: ApplyTradeInPayload) {
  const form = new FormData();
  form.set('category', payload.category);
  form.set('condition', payload.condition);
  form.set('brandModel', payload.brandModel);
  form.set('handoffMethod', payload.handoffMethod);
  if (payload.targetProductSlug) form.set('targetProductSlug', payload.targetProductSlug);
  if (payload.targetProductPrice !== undefined) form.set('targetProductPrice', String(payload.targetProductPrice));
  form.set('image', payload.image);
  return api.postForm<Cart>('/trade-ins/apply', form, { auth: true });
}

export function removeTradeIn() {
  return api.delete<Cart>('/trade-ins/current', { auth: true });
}

// ── Orders ──────────────────────────────────────────────────────────────────

export type CheckoutPayload = {
  email: string;
  delivery: 'standard' | 'express';
  locale: string;
  useWalletBalance?: boolean;
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

export function fetchMySupportTickets() { return api.get<SupportTicket[]>('/support/tickets', { auth: true, cache: 'no-store' }); }
export function createSupportTicket(input: { subject: string; category: string; priority: string; orderId?: number; message: string }) { return api.post<SupportTicket>('/support/tickets', input, { auth: true }); }
export function replyToSupportTicket(id: number, body: string) { return api.post<SupportTicket>(`/support/tickets/${id}/messages`, { body }, { auth: true }); }

// ── Wallet & exchanges ─────────────────────────────────────────────────────

export function fetchWallet(currency: string = STORE_CURRENCY) {
  return api.get<Wallet>(`/wallet?currency=${encodeURIComponent(currency)}`, { auth: true });
}

export type CreateExchangePayload = {
  orderItemId: number;
  newProductVariantId: number;
  invoiceIntact: boolean;
  packagingIntact: boolean;
  customerNote?: string;
};

export function fetchMyExchanges() {
  return api.get<ExchangeRequest[]>('/exchanges', { auth: true });
}

export function createExchange(payload: CreateExchangePayload) {
  return api.post<ExchangeRequest>('/exchanges', payload, { auth: true });
}

export function checkoutExchange(id: number, payload: { email: string; locale: string; useWalletBalance?: boolean }) {
  return api.post<Order>(`/exchanges/${id}/checkout`, payload, { auth: true });
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
  wallet: (currency: string = STORE_CURRENCY) => ['wallet', currency] as const,
  exchanges: () => ['exchanges'] as const,
  support: () => ['support', 'tickets'] as const,
};

'use client';

import { create } from 'zustand';
import {
  addCartItem,
  addGiftBox,
  addSurpriseBox,
  applyTradeIn as applyTradeInRequest,
  fetchCart,
  removeCoupon as removeCouponRequest,
  removeTradeIn as removeTradeInRequest,
  removeCartItem,
  updateCartItem,
  validateCoupon,
} from '@/lib/commerce';
import type { ApplyTradeInPayload, GiftBoxPayload, SurpriseBoxPayload } from '@/lib/commerce';
import { ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import type { AppliedCoupon, Cart, CartItem, TradeIn } from '@/types/commerce';
import { translate, type Locale, type TranslationKey } from '@/i18n/I18nProvider';

type CartState = {
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  couponDiscountTotal: number;
  tradeInCredit: number;
  totalAfterDiscount: number;
  coupon: AppliedCoupon | null;
  tradeIn: TradeIn | null;
  isOpen: boolean;
  isLoading: boolean;
  load: () => Promise<void>;
  add: (productSlug: string, color: string, quantity?: number) => Promise<void>;
  addGiftBox: (payload: GiftBoxPayload) => Promise<boolean>;
  addSurpriseBox: (payload: SurpriseBoxPayload) => Promise<boolean>;
  remove: (itemId: number) => Promise<void>;
  setQuantity: (itemId: number, quantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<Cart>;
  removeCoupon: () => Promise<Cart>;
  applyTradeIn: (payload: ApplyTradeInPayload) => Promise<Cart>;
  removeTradeIn: () => Promise<Cart>;
  clear: () => void;
  open: () => void;
  close: () => void;
};

function apply(cart: Cart) {
  // Older API instances may not include the coupon totals until they are restarted
  // with the coupon migration. Keep checkout arithmetic valid during that handover.
  const discountTotal = Number.isFinite(cart.discountTotal) ? cart.discountTotal : 0;
  const tradeInCredit = Number.isFinite(cart.tradeInCredit) ? cart.tradeInCredit : 0;
  const couponDiscountTotal = Number.isFinite(cart.couponDiscountTotal)
    ? cart.couponDiscountTotal
    : Math.max(0, discountTotal - tradeInCredit);
  const totalAfterDiscount = Number.isFinite(cart.totalAfterDiscount)
    ? cart.totalAfterDiscount
    : Math.max(0, cart.subtotal - discountTotal);

  return {
    items: cart.items,
    subtotal: cart.subtotal,
    discountTotal,
    couponDiscountTotal,
    tradeInCredit,
    totalAfterDiscount,
    coupon: cart.coupon ?? null,
    tradeIn: cart.tradeIn ?? null,
    isLoading: false,
  };
}

function activeLocale(): Locale {
  return typeof window !== 'undefined' && window.localStorage.getItem('mers-locale') === 'tr' ? 'tr' : 'en';
}

function reportError(error: unknown, fallback: TranslationKey) {
  const locale = activeLocale();
  // API domain errors are currently English. Keep their detail in English mode, but never
  // leak an untranslated server sentence into the Turkish storefront.
  const message = locale === 'en' && error instanceof ApiError ? error.message : translate(locale, fallback);
  useToastStore.getState().show({ tone: 'error', title: translate(locale, 'cart.updateFailed'), message });
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  subtotal: 0,
  discountTotal: 0,
  couponDiscountTotal: 0,
  tradeInCredit: 0,
  totalAfterDiscount: 0,
  coupon: null,
  tradeIn: null,
  isOpen: false,
  isLoading: false,

  load: async () => {
    if (!useAuthStore.getState().access) {
      set({ items: [], subtotal: 0, discountTotal: 0, couponDiscountTotal: 0, tradeInCredit: 0, totalAfterDiscount: 0, coupon: null, tradeIn: null, isLoading: false, isOpen: false });
      return;
    }

    set({ isLoading: true });
    try {
      set(apply(await fetchCart()));
    } catch {
      // A failed load must not wipe a bag the server still holds.
      set({ isLoading: false });
    }
  },

  add: async (productSlug, color, quantity = 1) => {
    if (!useAuthStore.getState().access) return;

    set({ isOpen: true, isLoading: true });
    try {
      set(apply(await addCartItem(productSlug, color, quantity)));
    } catch (error) {
      set({ isLoading: false });
      reportError(error, 'cart.addFailed');
    }
  },

  addGiftBox: async (payload) => {
    if (!useAuthStore.getState().access) return false;

    set({ isOpen: true, isLoading: true });
    try {
      set(apply(await addGiftBox(payload)));
      return true;
    } catch (error) {
      set({ isLoading: false });
      reportError(error, 'cart.addFailed');
      return false;
    }
  },

  addSurpriseBox: async (payload) => {
    if (!useAuthStore.getState().access) return false;

    // Surprise Box has a guided checkout handoff. Keep the drawer closed while the
    // request runs so an API error never presents a misleading empty-bag state.
    set({ isOpen: false, isLoading: true });
    try {
      set(apply(await addSurpriseBox(payload)));
      return true;
    } catch (error) {
      set({ isOpen: false, isLoading: false });
      reportError(error, 'cart.addFailed');
      return false;
    }
  },

  remove: async (itemId) => {
    const previous = get().items;
    // Optimistic: drop the line immediately, restore it if the server disagrees.
    set({ items: previous.filter((item) => item.id !== itemId) });

    try {
      set(apply(await removeCartItem(itemId)));
    } catch (error) {
      set({ items: previous });
      reportError(error, 'cart.removeFailed');
    }
  },

  setQuantity: async (itemId, quantity) => {
    if (quantity <= 0) {
      await get().remove(itemId);
      return;
    }

    const previous = get().items;
    set({ items: previous.map((item) => (item.id === itemId ? { ...item, quantity } : item)) });

    try {
      set(apply(await updateCartItem(itemId, quantity)));
    } catch (error) {
      set({ items: previous });
      reportError(error, 'cart.quantityFailed');
    }
  },

  applyCoupon: async (code) => {
    const cart = await validateCoupon(code, get().subtotal);
    set(apply(cart));
    return cart;
  },

  removeCoupon: async () => {
    const cart = await removeCouponRequest();
    set(apply(cart));
    return cart;
  },

  applyTradeIn: async (payload) => {
    const cart = await applyTradeInRequest(payload);
    set(apply(cart));
    return cart;
  },

  removeTradeIn: async () => {
    const cart = await removeTradeInRequest();
    set(apply(cart));
    return cart;
  },

  clear: () => set({ items: [], subtotal: 0, discountTotal: 0, couponDiscountTotal: 0, tradeInCredit: 0, totalAfterDiscount: 0, coupon: null, tradeIn: null, isOpen: false }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

export const cartCount = (state: CartState) => state.items.reduce((total, item) => total + item.quantity, 0);
export const cartSubtotal = (state: CartState) => state.subtotal;

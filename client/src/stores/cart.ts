'use client';

import { create } from 'zustand';
import {
  addCartItem,
  addGiftBox,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '@/lib/commerce';
import type { GiftBoxPayload } from '@/lib/commerce';
import { ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import type { Cart, CartItem } from '@/types/commerce';
import { translate, type Locale, type TranslationKey } from '@/i18n/I18nProvider';

type CartState = {
  items: CartItem[];
  subtotal: number;
  isOpen: boolean;
  isLoading: boolean;
  load: () => Promise<void>;
  add: (productSlug: string, color: string, quantity?: number) => Promise<void>;
  addGiftBox: (payload: GiftBoxPayload) => Promise<boolean>;
  remove: (itemId: number) => Promise<void>;
  setQuantity: (itemId: number, quantity: number) => Promise<void>;
  clear: () => void;
  open: () => void;
  close: () => void;
};

function apply(cart: Cart) {
  return { items: cart.items, subtotal: cart.subtotal, isLoading: false };
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
  isOpen: false,
  isLoading: false,

  load: async () => {
    if (!useAuthStore.getState().access) {
      set({ items: [], subtotal: 0, isLoading: false, isOpen: false });
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

  clear: () => set({ items: [], subtotal: 0, isOpen: false }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

export const cartCount = (state: CartState) => state.items.reduce((total, item) => total + item.quantity, 0);
export const cartSubtotal = (state: CartState) => state.subtotal;

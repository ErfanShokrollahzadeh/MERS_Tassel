'use client';

import { create } from 'zustand';
import {
  addCartItem,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '@/lib/commerce';
import { ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import type { Cart, CartItem } from '@/types/commerce';

type CartState = {
  items: CartItem[];
  subtotal: number;
  isOpen: boolean;
  isLoading: boolean;
  load: () => Promise<void>;
  add: (productSlug: string, color: string, quantity?: number) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
  setQuantity: (itemId: number, quantity: number) => Promise<void>;
  clear: () => void;
  open: () => void;
  close: () => void;
};

function apply(cart: Cart) {
  return { items: cart.items, subtotal: cart.subtotal, isLoading: false };
}

function reportError(error: unknown, fallback: string) {
  const message = error instanceof ApiError ? error.message : fallback;
  useToastStore.getState().show({ tone: 'error', title: 'Bag not updated', message });
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
      reportError(error, 'This piece could not be added to your bag.');
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
      reportError(error, 'This piece could not be removed.');
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
      reportError(error, 'The quantity could not be updated.');
    }
  },

  clear: () => set({ items: [], subtotal: 0, isOpen: false }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

export const cartCount = (state: CartState) => state.items.reduce((total, item) => total + item.quantity, 0);
export const cartSubtotal = (state: CartState) => state.subtotal;

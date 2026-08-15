'use client';

import { create } from 'zustand';
import { products } from '@/data/store';
import { addShoppingBagItem, fetchShoppingBag, removeShoppingBagItem, updateShoppingBagItem, type ShoppingBag } from '@/lib/shoppingBag';
import { useAuthStore, withFreshAccess } from '@/stores/auth';
import type { CartLine, Product } from '@/types/commerce';

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  isLoading: boolean;
  load: () => Promise<void>;
  add: (product: Product, color?: string, quantity?: number) => Promise<void>;
  remove: (productId: number, color: string) => Promise<void>;
  setQuantity: (productId: number, color: string, quantity: number) => Promise<void>;
  clear: () => void;
  open: () => void;
  close: () => void;
};

function linesFromBag(bag: ShoppingBag): CartLine[] {
  return bag.items.flatMap((item) => {
    const product = products.find((candidate) => candidate.slug === item.product_slug);
    return product ? [{ itemId: item.id, product, color: item.color || product.colors[0], quantity: item.quantity }] : [];
  });
}

export const useCartStore = create<CartState>()((set, get) => ({
  lines: [],
  isOpen: false,
  isLoading: false,
  load: async () => {
    if (!useAuthStore.getState().access) {
      set({ lines: [], isLoading: false, isOpen: false });
      return;
    }
    set({ isLoading: true });
    try {
      const bag = await withFreshAccess((access) => fetchShoppingBag(access));
      set({ lines: linesFromBag(bag), isLoading: false });
    } catch {
      set({ lines: [], isLoading: false, isOpen: false });
    }
  },
  add: async (product, color = product.colors[0], quantity = 1) => {
    if (!useAuthStore.getState().access) return;
    const previous = get().lines;
    const existing = previous.find((line) => line.product.id === product.id && line.color === color);
    const lines = existing
      ? previous.map((line) => line === existing ? { ...line, quantity: Math.min(line.quantity + quantity, product.stock, 10) } : line)
      : [...previous, { product, color, quantity: Math.min(quantity, product.stock, 10) }];
    set({ lines, isOpen: true });
    try {
      const bag = await withFreshAccess((access) => addShoppingBagItem(access, product.slug, color, quantity));
      set({ lines: linesFromBag(bag) });
    } catch {
      set({ lines: previous });
    }
  },
  remove: async (productId, color) => {
    const previous = get().lines;
    const target = previous.find((line) => line.product.id === productId && line.color === color);
    if (!target?.itemId) return;
    set({ lines: previous.filter((line) => line !== target) });
    try {
      const bag = await withFreshAccess((access) => removeShoppingBagItem(access, target.itemId!));
      set({ lines: linesFromBag(bag) });
    } catch {
      set({ lines: previous });
    }
  },
  setQuantity: async (productId, color, quantity) => {
    if (quantity <= 0) {
      await get().remove(productId, color);
      return;
    }
    const previous = get().lines;
    const target = previous.find((line) => line.product.id === productId && line.color === color);
    if (!target?.itemId) return;
    set({ lines: previous.map((line) => line === target ? { ...line, quantity: Math.min(quantity, line.product.stock, 10) } : line) });
    try {
      const bag = await withFreshAccess((access) => updateShoppingBagItem(access, target.itemId!, quantity));
      set({ lines: linesFromBag(bag) });
    } catch {
      set({ lines: previous });
    }
  },
  clear: () => set({ lines: [], isOpen: false }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

export const cartCount = (state: CartState) => state.lines.reduce((total, line) => total + line.quantity, 0);
export const cartSubtotal = (state: CartState) => state.lines.reduce((total, line) => total + line.product.price.amount * line.quantity, 0);

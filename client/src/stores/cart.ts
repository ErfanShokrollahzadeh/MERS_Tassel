'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartLine, Product } from '@/types/commerce';

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  add: (product: Product, color?: string) => void;
  remove: (productId: number, color: string) => void;
  setQuantity: (productId: number, color: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      add: (product, color = product.colors[0]) => set((state) => {
        const existing = state.lines.find((line) => line.product.id === product.id && line.color === color);
        const lines = existing
          ? state.lines.map((line) => line === existing ? { ...line, quantity: Math.min(line.quantity + 1, product.stock) } : line)
          : [...state.lines, { product, color, quantity: 1 }];
        return { lines, isOpen: true };
      }),
      remove: (productId, color) => set((state) => ({ lines: state.lines.filter((line) => !(line.product.id === productId && line.color === color)) })),
      setQuantity: (productId, color, quantity) => set((state) => ({
        lines: quantity <= 0
          ? state.lines.filter((line) => !(line.product.id === productId && line.color === color))
          : state.lines.map((line) => line.product.id === productId && line.color === color ? { ...line, quantity: Math.min(quantity, line.product.stock) } : line),
      })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    { name: 'mers-cart', partialize: (state) => ({ lines: state.lines }) },
  ),
);

export const cartCount = (state: CartState) => state.lines.reduce((total, line) => total + line.quantity, 0);
export const cartSubtotal = (state: CartState) => state.lines.reduce((total, line) => total + line.product.price.amount * line.quantity, 0);

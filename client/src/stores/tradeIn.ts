'use client';

import { create } from 'zustand';

export type TradeInSource = 'announcement' | 'pdp' | 'cart' | 'checkout';
export type TradeInTarget = { slug: string; name: string; price: number };

type TradeInModalState = {
  isOpen: boolean;
  source: TradeInSource;
  target: TradeInTarget | null;
  open: (source: TradeInSource, target?: TradeInTarget) => void;
  close: () => void;
};

export const useTradeInModalStore = create<TradeInModalState>((set) => ({
  isOpen: false,
  source: 'announcement',
  target: null,
  open: (source, target) => set({ isOpen: true, source, target: target ?? null }),
  close: () => set({ isOpen: false }),
}));

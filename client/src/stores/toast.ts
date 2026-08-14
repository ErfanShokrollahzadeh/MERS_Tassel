'use client';

import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';
export type ToastMessage = { id: string; title: string; message?: string; tone: ToastTone };
type ToastState = { toasts: ToastMessage[]; show: (toast: Omit<ToastMessage, 'id'>) => void; dismiss: (id: string) => void };

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts.slice(-2), { ...toast, id }] }));
    window.setTimeout(() => get().dismiss(id), 5200);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

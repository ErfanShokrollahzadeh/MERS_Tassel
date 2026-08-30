'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types/commerce';
import { translate, type Locale } from '@/i18n/I18nProvider';
import { useToastStore } from '@/stores/toast';

export type FavoriteItem = {
  slug: string;
  name: string;
  nameTr?: string | null;
  category: string;
  categoryTr?: string | null;
  price: number;
  image: string;
  color: string;
  stock: number;
};

type FavoritesState = {
  items: FavoriteItem[];
  isOpen: boolean;
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (product: Product) => void;
  removeFavorite: (slug: string) => void;
  clearFavorites: () => void;
  open: () => void;
  close: () => void;
};

const locale = (): Locale => typeof window !== 'undefined' && localStorage.getItem('mers-locale') === 'tr' ? 'tr' : 'en';
const notify = (key: 'favorites.added' | 'favorites.removed') => useToastStore.getState().show({ tone: 'success', title: translate(locale(), key) });

export const useFavoritesStore = create<FavoritesState>()(persist((set, get) => ({
  items: [],
  isOpen: false,
  isFavorite: (slug) => get().items.some((item) => item.slug === slug),
  toggleFavorite: (product) => {
    if (get().isFavorite(product.slug)) {
      set((state) => ({ items: state.items.filter((item) => item.slug !== product.slug) }));
      notify('favorites.removed');
      return;
    }
    const variant = product.variants.find((item) => item.stock > 0) ?? product.variants[0];
    set((state) => ({ items: [...state.items, { slug: product.slug, name: product.name, nameTr: product.nameTr, category: product.category, categoryTr: product.categoryTr, price: variant?.price ?? product.price.amount, image: product.image, color: variant?.color ?? '', stock: variant?.stock ?? product.stock }] }));
    notify('favorites.added');
  },
  removeFavorite: (slug) => {
    if (!get().isFavorite(slug)) return;
    set((state) => ({ items: state.items.filter((item) => item.slug !== slug) }));
    notify('favorites.removed');
  },
  clearFavorites: () => set({ items: [] }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}), { name: 'mers_favorites', partialize: (state) => ({ items: state.items }) }));

export const favoritesCount = (state: FavoritesState) => state.items.length;

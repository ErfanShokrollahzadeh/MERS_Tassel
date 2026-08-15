import { api, queryString, type Paged } from '@/lib/apiClient';
import type { Category, Product, SiteSettings } from '@/types/commerce';

export type CatalogSort = 'featured' | 'newest' | 'price-low' | 'price-high' | 'name';

export type CatalogQuery = {
  category?: string;
  search?: string;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
};

export function fetchProducts(query: CatalogQuery = {}, signal?: AbortSignal) {
  return api.get<Paged<Product>>(`/products${queryString({ ...query })}`, { signal });
}

export function fetchFeaturedProducts(take = 8, signal?: AbortSignal) {
  return api.get<Product[]>(`/products/featured${queryString({ take })}`, { signal });
}

export function fetchProduct(slug: string, signal?: AbortSignal) {
  return api.get<Product>(`/products/${encodeURIComponent(slug)}`, { signal });
}

export function fetchRelatedProducts(slug: string, take = 4, signal?: AbortSignal) {
  return api.get<Product[]>(`/products/${encodeURIComponent(slug)}/related${queryString({ take })}`, { signal });
}

export function fetchCategories(signal?: AbortSignal) {
  return api.get<Category[]>('/categories', { signal });
}

export function fetchSiteSettings(signal?: AbortSignal) {
  return api.get<SiteSettings>('/settings', { signal });
}

/** Shared React Query keys, so mutations can invalidate precisely. */
export const catalogKeys = {
  products: (query: CatalogQuery = {}) => ['products', query] as const,
  featured: (take: number) => ['products', 'featured', take] as const,
  product: (slug: string) => ['product', slug] as const,
  related: (slug: string) => ['product', slug, 'related'] as const,
  categories: () => ['categories'] as const,
  settings: () => ['settings'] as const,
};

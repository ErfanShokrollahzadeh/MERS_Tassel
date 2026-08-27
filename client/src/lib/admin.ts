import { api, queryString, type Paged } from '@/lib/apiClient';
import type {
  AdminUser,
  Category,
  Coupon,
  Dashboard,
  ExchangeRequest,
  ExchangeStatus,
  Order,
  OrderStatus,
  TradeIn,
  TradeInStatus,
  Product,
  SiteSettings,
} from '@/types/commerce';

// ── Dashboard ───────────────────────────────────────────────────────────────

export function fetchDashboard() {
  return api.get<Dashboard>('/admin/dashboard', { auth: true });
}

// ── Products ────────────────────────────────────────────────────────────────

export type AdminProductQuery = {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export function fetchAdminProducts(query: AdminProductQuery = {}) {
  return api.get<Paged<Product>>(`/admin/products${queryString({ ...query })}`, { auth: true });
}

export function fetchAdminProduct(id: number) {
  return api.get<Product>(`/admin/products/${id}`, { auth: true });
}

export type VariantDraft = {
  id?: number;
  title: string;
  color: string;
  colorTr?: string;
  swatchHex?: string;
  priceOverride?: number | null;
  stock: number;
  lowStockThreshold?: number;
  isActive: boolean;
};

export type ProductDraft = {
  name: string;
  nameTr?: string;
  slug?: string;
  categoryId: number;
  description: string;
  descriptionTr?: string;
  story?: string;
  storyTr?: string;
  material?: string;
  materialTr?: string;
  dimensions?: string;
  dimensionsTr?: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  sku?: string;
  isFeatured: boolean;
  isNew: boolean;
  isActive: boolean;
  seoTitle?: string;
  metaDescription?: string;
  variants: VariantDraft[];
};

/**
 * Builds the multipart body. Files are appended only when the admin picked new ones —
 * an edit that leaves the gallery alone sends no `images` part, and the server keeps
 * the existing media.
 */
function productForm(draft: ProductDraft, images: File[]): FormData {
  const form = new FormData();

  form.append('Name', draft.name);
  if (draft.nameTr) form.append('NameTr', draft.nameTr);
  if (draft.slug) form.append('Slug', draft.slug);
  form.append('CategoryId', String(draft.categoryId));
  form.append('Description', draft.description);
  if (draft.descriptionTr) form.append('DescriptionTr', draft.descriptionTr);
  form.append('Story', draft.story ?? '');
  if (draft.storyTr) form.append('StoryTr', draft.storyTr);
  form.append('Material', draft.material ?? '');
  if (draft.materialTr) form.append('MaterialTr', draft.materialTr);
  form.append('Dimensions', draft.dimensions ?? '');
  if (draft.dimensionsTr) form.append('DimensionsTr', draft.dimensionsTr);
  form.append('Price', String(draft.price));
  if (draft.compareAtPrice != null) form.append('CompareAtPrice', String(draft.compareAtPrice));
  form.append('Currency', draft.currency);
  if (draft.sku) form.append('Sku', draft.sku);
  form.append('IsFeatured', String(draft.isFeatured));
  form.append('IsNew', String(draft.isNew));
  form.append('IsActive', String(draft.isActive));
  form.append('SeoTitle', draft.seoTitle ?? '');
  form.append('MetaDescription', draft.metaDescription ?? '');

  if (draft.variants.length) {
    form.append('VariantsJson', JSON.stringify(draft.variants));
  }

  for (const image of images) form.append('images', image);

  return form;
}

export function createProduct(draft: ProductDraft, images: File[] = []) {
  return api.postForm<Product>('/admin/products', productForm(draft, images), { auth: true });
}

export function updateProduct(id: number, draft: ProductDraft, images: File[] = []) {
  return api.putForm<Product>(`/admin/products/${id}`, productForm(draft, images), { auth: true });
}

export function deleteProduct(id: number) {
  return api.delete<null>(`/admin/products/${id}`, { auth: true });
}

export function addProductMedia(id: number, images: File[]) {
  const form = new FormData();
  for (const image of images) form.append('images', image);
  return api.postForm<Product>(`/admin/products/${id}/media`, form, { auth: true });
}

export function deleteProductMedia(id: number, mediaId: number) {
  return api.delete<Product>(`/admin/products/${id}/media/${mediaId}`, { auth: true });
}

export function reorderProductMedia(id: number, mediaIds: number[]) {
  return api.put<Product>(`/admin/products/${id}/media/reorder`, { mediaIds }, { auth: true });
}

// ── Categories ──────────────────────────────────────────────────────────────

export type CategoryDraft = {
  name: string;
  nameTr?: string;
  slug?: string;
  description: string;
  descriptionTr?: string;
  sortOrder: number;
};

function categoryForm(draft: CategoryDraft, image?: File | null): FormData {
  const form = new FormData();
  form.append('Name', draft.name);
  if (draft.nameTr) form.append('NameTr', draft.nameTr);
  if (draft.slug) form.append('Slug', draft.slug);
  form.append('Description', draft.description);
  if (draft.descriptionTr) form.append('DescriptionTr', draft.descriptionTr);
  form.append('SortOrder', String(draft.sortOrder));
  if (image) form.append('image', image);
  return form;
}

export function fetchAdminCategories() {
  return api.get<Category[]>('/admin/categories', { auth: true });
}

export function createCategory(draft: CategoryDraft, image?: File | null) {
  return api.postForm<Category>('/admin/categories', categoryForm(draft, image), { auth: true });
}

export function updateCategory(id: number, draft: CategoryDraft, image?: File | null) {
  return api.putForm<Category>(`/admin/categories/${id}`, categoryForm(draft, image), { auth: true });
}

export function deleteCategory(id: number) {
  return api.delete<null>(`/admin/categories/${id}`, { auth: true });
}

// ── Orders ──────────────────────────────────────────────────────────────────

export type AdminOrderQuery = {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export function fetchAdminOrders(query: AdminOrderQuery = {}) {
  return api.get<Paged<Order>>(`/admin/orders${queryString({ ...query })}`, { auth: true });
}

export function updateOrderStatus(id: number, status: OrderStatus) {
  return api.patch<Order>(`/admin/orders/${id}/status`, { status }, { auth: true });
}

export function updateTradeInStatus(id: number, status: TradeInStatus, adminNote?: string) {
  return api.patch<TradeIn>(`/admin/trade-ins/${id}/status`, { status, adminNote }, { auth: true });
}

export function fetchAdminExchanges() {
  return api.get<ExchangeRequest[]>('/admin/exchanges', { auth: true });
}

export function updateExchangeStatus(id: number, status: Exclude<ExchangeStatus, 'pending_verification'>, adminNote?: string) {
  return api.patch<ExchangeRequest>(`/admin/exchanges/${id}/status`, { status, adminNote }, { auth: true });
}

// ── Promotions ──────────────────────────────────────────────────────────────

export type CouponDraft = {
  name: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number;
  minimumSpend: number;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
};

export function fetchPromotions() {
  return api.get<Coupon[]>('/admin/promotions', { auth: true });
}

export function createPromotion(draft: CouponDraft) {
  return api.post<Coupon>('/admin/promotions', draft, { auth: true });
}

export function updatePromotion(id: number, draft: CouponDraft) {
  return api.put<Coupon>(`/admin/promotions/${id}`, draft, { auth: true });
}

export function deletePromotion(id: number) {
  return api.delete<null>(`/admin/promotions/${id}`, { auth: true });
}

// ── Users ───────────────────────────────────────────────────────────────────

export function fetchAdminUsers(query: { search?: string; page?: number; pageSize?: number } = {}) {
  return api.get<Paged<AdminUser>>(`/admin/users${queryString({ ...query })}`, { auth: true });
}

export function updateUserRole(id: string, role: 'Admin' | 'Staff' | 'Customer') {
  return api.patch<AdminUser>(`/admin/users/${id}/role`, { role }, { auth: true });
}

// ── Settings ────────────────────────────────────────────────────────────────

export function fetchAdminSettings() {
  return api.get<SiteSettings>('/admin/settings', { auth: true });
}

/** Logo and hero are sent only when replaced; omitting them preserves the stored files. */
export function updateSettings(draft: SiteSettings, logo?: File | null, hero?: File | null) {
  const form = new FormData();

  const fields: Array<[string, string | null | undefined]> = [
    ['SiteName', draft.siteName],
    ['HeroEyebrow', draft.heroEyebrow],
    ['HeroEyebrowTr', draft.heroEyebrowTr],
    ['HeroHeadline', draft.heroHeadline],
    ['HeroHeadlineTr', draft.heroHeadlineTr],
    ['HeroSubheadline', draft.heroSubheadline],
    ['HeroSubheadlineTr', draft.heroSubheadlineTr],
    ['ContactEmail', draft.contactEmail],
    ['ContactPhone', draft.contactPhone],
    ['ContactAddress', draft.contactAddress],
    ['InstagramUrl', draft.instagramUrl],
    ['TiktokUrl', draft.tiktokUrl],
    ['WhatsappPhone', draft.whatsappPhone],
    ['PinterestUrl', draft.pinterestUrl],
    ['AboutHeadline', draft.aboutHeadline],
    ['AboutHeadlineTr', draft.aboutHeadlineTr],
    ['AboutBody', draft.aboutBody],
    ['AboutBodyTr', draft.aboutBodyTr],
  ];

  for (const [key, value] of fields) form.append(key, value ?? '');

  if (logo) form.append('logo', logo);
  if (hero) form.append('hero', hero);

  return api.putForm<SiteSettings>('/admin/settings', form, { auth: true });
}

export const adminKeys = {
  dashboard: () => ['admin', 'dashboard'] as const,
  products: (query: AdminProductQuery = {}) => ['admin', 'products', query] as const,
  categories: () => ['admin', 'categories'] as const,
  orders: (query: AdminOrderQuery = {}) => ['admin', 'orders', query] as const,
  exchanges: () => ['admin', 'exchanges'] as const,
  users: (query: { search?: string; page?: number } = {}) => ['admin', 'users', query] as const,
  settings: () => ['admin', 'settings'] as const,
  promotions: () => ['admin', 'promotions'] as const,
};

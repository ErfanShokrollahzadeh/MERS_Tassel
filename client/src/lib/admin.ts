import { api, queryString, type Paged } from '@/lib/apiClient';
import type {
  AdminUser,
  Category,
  Coupon,
  Dashboard,
  Marketing,
  ExchangeRequest,
  ExchangeStatus,
  Order,
  OrderStatus,
  TradeIn,
  TradeInStatus,
  Product,
  SiteSettings,
  AdminPopup,
  PopupDraft,
} from '@/types/commerce';

// ── Dashboard ───────────────────────────────────────────────────────────────



export function fetchDashboard() {
  return api.get<Dashboard>('/admin/dashboard', { auth: true });
}

export function fetchMarketing() {
  return api.get<Marketing>('/admin/marketing', { auth: true });
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

export type ProductModelDraft = {
  variantId?: number | null;
  alt: string;
  placement: 'floor' | 'wall';
  supportedPlacements: Array<'floor' | 'wall'>;
  scaleMode: 'fixed';
  widthMm: number;
  heightMm: number;
  depthMm: number;
};

function modelForm(draft: ProductModelDraft, glb?: File | null, usdz?: File | null, poster?: File | null) {
  const form = new FormData();
  if (draft.variantId) form.append('VariantId', String(draft.variantId));
  form.append('Alt', draft.alt);
  form.append('Placement', draft.placement);
  form.append('SupportedPlacements', draft.supportedPlacements.join(','));
  form.append('ScaleMode', draft.scaleMode);
  form.append('WidthMm', String(draft.widthMm));
  form.append('HeightMm', String(draft.heightMm));
  form.append('DepthMm', String(draft.depthMm));
  if (glb) form.append('glb', glb);
  if (usdz) form.append('usdz', usdz);
  if (poster) form.append('poster', poster);
  return form;
}

export function addProductModel(id: number, draft: ProductModelDraft, glb: File, usdz?: File | null, poster?: File | null) {
  return api.postForm<Product>(`/admin/products/${id}/models`, modelForm(draft, glb, usdz, poster), { auth: true });
}

export function updateProductModel(id: number, modelId: number, draft: ProductModelDraft, glb?: File | null, usdz?: File | null, poster?: File | null) {
  return api.putForm<Product>(`/admin/products/${id}/models/${modelId}`, modelForm(draft, glb, usdz, poster), { auth: true });
}

export function deleteProductModel(id: number, modelId: number) {
  return api.delete<Product>(`/admin/products/${id}/models/${modelId}`, { auth: true });
}

export type ModelGenerationStatus = 'draft_capture' | 'queued' | 'reconstructing' | 'optimizing' | 'awaiting_review' | 'approved' | 'failed' | 'cancelled';
export type ModelGenerationJob = {
  id: number;
  productId: number;
  productName: string;
  variantId?: number | null;
  provider: string;
  status: ModelGenerationStatus;
  progressPercent: number;
  stage: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  captureCount: number;
  supportedPlacements: Array<'floor' | 'wall'>;
  defaultPlacement: 'floor' | 'wall';
  validationReportJson?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  canRetry: boolean;
  canApprove: boolean;
  createdAt: string;
  completedAt?: string | null;
};

export type CreateModelGenerationResult = {
  job: ModelGenerationJob;
  captureToken: string;
  expiresAt: string;
};

export function fetchModelGenerationJobs(productId: number) {
  return api.get<ModelGenerationJob[]>(`/admin/products/${productId}/model-generation-jobs`, { auth: true, cache: 'no-store' });
}

export function createModelGenerationJob(productId: number, variantId?: number | null) {
  return api.post<CreateModelGenerationResult>(`/admin/products/${productId}/model-generation-jobs`, { variantId: variantId ?? null, provider: 'meshy' }, { auth: true });
}

export function retryModelGenerationJob(jobId: number) {
  return api.post<ModelGenerationJob>(`/admin/model-generation-jobs/${jobId}/retry`, {}, { auth: true });
}

export function cancelModelGenerationJob(jobId: number) {
  return api.post<ModelGenerationJob>(`/admin/model-generation-jobs/${jobId}/cancel`, {}, { auth: true });
}

export function approveModelGenerationJob(jobId: number) {
  return api.post<ModelGenerationJob>(`/admin/model-generation-jobs/${jobId}/approve`, { scaleVerified: true }, { auth: true });
}

export function rejectModelGenerationJob(jobId: number, reason: string) {
  return api.post<ModelGenerationJob>(`/admin/model-generation-jobs/${jobId}/reject`, { reason }, { auth: true });
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
    ['CrispWebsiteId', draft.crispWebsiteId],
    ['AboutHeadline', draft.aboutHeadline],
    ['AboutHeadlineTr', draft.aboutHeadlineTr],
    ['AboutBody', draft.aboutBody],
    ['AboutBodyTr', draft.aboutBodyTr],
  ];

  for (const [key, value] of fields) form.append(key, value ?? '');
  form.append('CrispEnabled', String(draft.crispEnabled));

  if (logo) form.append('logo', logo);
  if (hero) form.append('hero', hero);

  return api.putForm<SiteSettings>('/admin/settings', form, { auth: true });
}

// ── Popups ─────────────────────────────────────────────────────────────────

function popupForm(draft: PopupDraft, image?: File | null): FormData {
  const form = new FormData();
  form.append('Name', draft.name);
  form.append('Type', draft.type);
  form.append('Placement', draft.placement);
  form.append('TriggerType', draft.triggerType);
  form.append('TriggerValue', String(draft.triggerValue));
  form.append('TargetAudience', draft.targetAudience);
  if (draft.targetPages) form.append('TargetPages', draft.targetPages);
  form.append('DeviceTarget', draft.deviceTarget);
  form.append('CooldownDays', String(draft.cooldownDays));
  form.append('Priority', String(draft.priority));
  form.append('IsActive', String(draft.isActive));
  if (draft.startsAt) form.append('StartsAt', draft.startsAt);
  if (draft.expiresAt) form.append('ExpiresAt', draft.expiresAt);
  if (draft.badge) form.append('Badge', draft.badge);
  if (draft.badgeTr) form.append('BadgeTr', draft.badgeTr);
  form.append('Title', draft.title);
  if (draft.titleTr) form.append('TitleTr', draft.titleTr);
  if (draft.description) form.append('Description', draft.description);
  if (draft.descriptionTr) form.append('DescriptionTr', draft.descriptionTr);
  if (draft.primaryCtaText) form.append('PrimaryCtaText', draft.primaryCtaText);
  if (draft.primaryCtaTextTr) form.append('PrimaryCtaTextTr', draft.primaryCtaTextTr);
  if (draft.primaryCtaUrl) form.append('PrimaryCtaUrl', draft.primaryCtaUrl);
  if (draft.secondaryCtaText) form.append('SecondaryCtaText', draft.secondaryCtaText);
  if (draft.secondaryCtaTextTr) form.append('SecondaryCtaTextTr', draft.secondaryCtaTextTr);
  if (draft.couponCode) form.append('CouponCode', draft.couponCode);

  if (image) form.append('image', image);
  return form;
}

export function fetchAdminPopups() {
  return api.get<AdminPopup[]>('/admin/popups', { auth: true });
}

export function fetchAdminPopup(id: number) {
  return api.get<AdminPopup>(`/admin/popups/${id}`, { auth: true });
}

export function createPopup(draft: PopupDraft, image?: File | null) {
  return api.postForm<AdminPopup>('/admin/popups', popupForm(draft, image), { auth: true });
}

export function updatePopup(id: number, draft: PopupDraft, image?: File | null) {
  return api.putForm<AdminPopup>(`/admin/popups/${id}`, popupForm(draft, image), { auth: true });
}

export function togglePopupStatus(id: number, isActive: boolean) {
  return api.patch<null>(`/admin/popups/${id}/status`, { isActive }, { auth: true });
}

export function deletePopup(id: number) {
  return api.delete<null>(`/admin/popups/${id}`, { auth: true });
}

export const adminKeys = {
  dashboard: () => ['admin', 'dashboard'] as const,
  marketing: () => ['admin', 'marketing'] as const,
  products: (query: AdminProductQuery = {}) => ['admin', 'products', query] as const,
  categories: () => ['admin', 'categories'] as const,
  orders: (query: AdminOrderQuery = {}) => ['admin', 'orders', query] as const,
  exchanges: () => ['admin', 'exchanges'] as const,
  users: (query: { search?: string; page?: number } = {}) => ['admin', 'users', query] as const,
  settings: () => ['admin', 'settings'] as const,
  promotions: () => ['admin', 'promotions'] as const,
  popups: () => ['admin', 'popups'] as const,
};

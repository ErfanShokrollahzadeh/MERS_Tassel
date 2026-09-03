export type Money = { amount: number; currency: string };

export type ProductVariant = {
  id: number;
  title: string;
  sku: string;
  color: string;
  colorTr?: string | null;
  swatchHex?: string | null;
  price: number;
  priceOverride?: number | null;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
};

export type ProductMedia = {
  id: number;
  imagePath: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type ProductModelAsset = {
  id: number;
  variantId?: number | null;
  glbPath: string;
  usdzPath?: string | null;
  posterPath?: string | null;
  alt: string;
  placement: 'floor' | 'wall';
  supportedPlacements: Array<'floor' | 'wall'>;
  scaleMode: 'fixed';
  dimensionsMm: { width: number; height: number; depth: number };
};

/**
 * Mirrors the API's ProductDto. Turkish copy travels on the record itself, so a product
 * created in the admin panel is localizable without touching the frontend.
 */
export type Product = {
  id: number;
  name: string;
  nameTr?: string | null;
  slug: string;
  category: string;
  categoryTr?: string | null;
  categorySlug: string;
  categoryId: number;
  description: string;
  descriptionTr?: string | null;
  story: string;
  storyTr?: string | null;
  material: string;
  materialTr?: string | null;
  dimensions: string;
  dimensionsTr?: string | null;
  price: Money;
  compareAt?: Money | null;
  image: string;
  images: string[];
  colors: string[];
  rating: number;
  reviews: number;
  stock: number;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  sku: string;
  seoTitle: string;
  metaDescription: string;
  variants: ProductVariant[];
  mediaItems: ProductMedia[];
  modelAssets: ProductModelAsset[];
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: number;
  name: string;
  nameTr?: string | null;
  slug: string;
  description: string;
  descriptionTr?: string | null;
  image?: string | null;
  sortOrder: number;
  count: number;
};

export type CartItem = {
  id: number;
  variantId: number;
  productId: number;
  productName: string;
  productNameTr?: string | null;
  productSlug: string;
  sku: string;
  color: string;
  colorTr?: string | null;
  image?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
  giftBoxKey?: string | null;
  giftMessage?: string | null;
  packagingNotes?: string | null;
  surpriseRecipient?: string | null;
  surpriseVibes?: string[];
  surpriseInstructions?: string | null;
};

export type Cart = {
  id: number;
  currency: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  couponDiscountTotal: number;
  tradeInCredit: number;
  totalAfterDiscount: number;
  coupon?: AppliedCoupon | null;
  tradeIn?: TradeIn | null;
  count: number;
};

export type TradeInCondition = 'like_new' | 'good' | 'fair';
export type TradeInHandoffMethod = 'pickup' | 'drop_off';
export type TradeInStatus = 'estimate' | 'draft' | 'pending_verification' | 'approved' | 'rejected' | 'cancelled';

export type TradeInEstimate = {
  estimatedCredit: number;
  currency: string;
  estimatedPriceAfterTradeIn?: number | null;
  status: TradeInStatus;
};

export type TradeIn = TradeInEstimate & {
  id: number;
  category: string;
  brandModel: string;
  condition: TradeInCondition;
  imagePath: string;
  targetProductSlug?: string | null;
  targetProductName?: string | null;
  targetProductPrice?: number | null;
  handoffMethod: TradeInHandoffMethod;
  adminNote?: string | null;
  createdAt: string;
};

export type AppliedCoupon = {
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number;
  minimumSpend: number;
  discountAmount: number;
  badge: string;
};

export type Coupon = {
  id: number;
  name: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number;
  minimumSpend: number;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  redemptionCount: number;
  createdAt: string;
};

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';

export type OrderItem = {
  id: number;
  productName: string;
  productSlug: string;
  sku: string;
  color: string;
  image?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  giftBoxKey?: string | null;
  giftMessage?: string | null;
  packagingNotes?: string | null;
  surpriseRecipient?: string | null;
  surpriseVibes?: string[];
  surpriseInstructions?: string | null;
};

export type WalletTransaction = {
  id: number;
  type: 'exchange_credit' | 'checkout_debit' | 'order_reversal' | 'admin_adjustment';
  amount: number;
  balanceAfter: number;
  description: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
};

export type Wallet = {
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
};

export type ExchangeStatus = 'pending_verification' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export type ExchangeRequest = {
  id: number;
  orderItemId: number;
  originalProductName: string;
  newProductVariantId: number;
  newProductName: string;
  newProductSlug: string;
  newProductColor: string;
  oldProductValue: number;
  newProductValue: number;
  difference: number;
  walletCredit: number;
  amountDue: number;
  currency: string;
  invoiceIntact: boolean;
  packagingIntact: boolean;
  customerNote?: string | null;
  adminNote?: string | null;
  status: ExchangeStatus;
  createdAt: string;
  reviewedAt?: string | null;
  settlementOrderNumber?: string | null;
};

export type Order = {
  id: number;
  number: string;
  email: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotal: number;
  discountTotal: number;
  couponDiscountTotal: number;
  tradeInCredit: number;
  walletCredit: number;
  shippingTotal: number;
  total: number;
  couponCode?: string | null;
  couponDiscountType?: string | null;
  tradeIn?: TradeIn | null;
  channel: string;
  items: OrderItem[];
  itemCount: number;
  createdAt: string;
  paidAt?: string | null;
  deliveredAt?: string | null;
  exchangeEligibleUntil?: string | null;
  returnEligibleUntil?: string | null;
};

export type SiteSettings = {
  siteName: string;
  logoPath?: string | null;
  heroEyebrow: string;
  heroEyebrowTr?: string | null;
  heroHeadline: string;
  heroHeadlineTr?: string | null;
  heroSubheadline: string;
  heroSubheadlineTr?: string | null;
  heroImagePath?: string | null;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  whatsappPhone?: string | null;
  pinterestUrl?: string | null;
  aboutHeadline: string;
  aboutHeadlineTr?: string | null;
  aboutBody: string;
  aboutBodyTr?: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateJoined: string;
  role: 'customer' | 'staff' | 'admin';
};

export type AuthSession = {
  access: string;
  refresh: string;
  user: AuthUser;
  accessExpiresAt: string;
};

export type AdminUser = AuthUser & {
  orderCount: number;
  lifetimeSpend: number;
  lastActiveAt?: string | null;
};

export type RevenuePoint = { name: string; date: string; revenue: number; orders: number };

export type TopProduct = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  unitsSold: number;
  revenue: number;
  price: number;
};

export type Dashboard = {
  netRevenue: number;
  revenueChangePct: number;
  orderCount: number;
  orderChangePct: number;
  averageOrderValue: number;
  aovChangePct: number;
  customerCount: number;
  returningCustomerPct: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryValue: number;
  revenueSeries: RevenuePoint[];
  recentOrders: Order[];
  topProducts: TopProduct[];
};
export type PopupType = 'promotional' | 'newsletter' | 'announcement' | 'support_care' | 'custom';
export type PopupPlacement = 'center_modal' | 'bottom_bar' | 'slide_in_bottom_right' | 'slide_in_bottom_left';
export type PopupTriggerType = 'delay' | 'scroll_depth' | 'exit_intent' | 'immediate';
export type PopupTargetAudience = 'all' | 'guests_only' | 'registered_only';

export type Popup = {
  id: number;
  type: PopupType;
  placement: PopupPlacement;
  triggerType: PopupTriggerType;
  triggerValue: number;
  cooldownDays: number;
  priority: number;
  targetPages?: string | null;
  deviceTarget: 'all' | 'desktop' | 'mobile';
  badge?: string | null;
  badgeTr?: string | null;
  title: string;
  titleTr?: string | null;
  description?: string | null;
  descriptionTr?: string | null;
  imagePath?: string | null;
  primaryCtaText?: string | null;
  primaryCtaTextTr?: string | null;
  primaryCtaUrl?: string | null;
  secondaryCtaText?: string | null;
  secondaryCtaTextTr?: string | null;
  couponCode?: string | null;
};

export type StorefrontPopup = Popup;

export type AdminPopup = Popup & {
  name: string;
  targetAudience: PopupTargetAudience;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  impressionCount: number;
  clickCount: number;
  conversionCount: number;
  clickThroughRate: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
};

export type PopupDraft = {
  name: string;
  type: PopupType;
  placement: PopupPlacement;
  triggerType: PopupTriggerType;
  triggerValue: number;
  targetAudience: PopupTargetAudience;
  targetPages?: string | null;
  deviceTarget: 'all' | 'desktop' | 'mobile';
  cooldownDays: number;
  priority: number;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  badge?: string | null;
  badgeTr?: string | null;
  title: string;
  titleTr?: string | null;
  description?: string | null;
  descriptionTr?: string | null;
  primaryCtaText?: string | null;
  primaryCtaTextTr?: string | null;
  primaryCtaUrl?: string | null;
  secondaryCtaText?: string | null;
  secondaryCtaTextTr?: string | null;
  couponCode?: string | null;
};

export type ChannelAttribution = { channel: string; orders: number; revenue: number; sharePct: number };
export type FunnelStep = { step: string; count: number };
export type CohortRow = { cohortWeek: string; cohortSize: number; retentionPcts: number[] };

export type Marketing = {
  totalSessions: number;
  sessionsChangePct: number;
  conversionRate: number;
  conversionChangePct: number;
  revenue: number;
  revenueChangePct: number;
  acquisitionCost: number;
  roasMultiplier: number;
  attribution: ChannelAttribution[];
  funnel: FunnelStep[];
  cohorts: CohortRow[];
  revenueSeries: RevenuePoint[];
};

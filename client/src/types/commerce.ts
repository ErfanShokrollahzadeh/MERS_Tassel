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

export type Language = 'en' | 'ta';

export type UserRole = 'super_admin' | 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  addresses?: Address[];
  createdAt: string;
  isActive: boolean;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameTa: string;
  level: 1 | 2 | 3;
  parentId?: string | null;
  image: string;
  descriptionEn?: string;
  descriptionTa?: string;
  isActive: boolean;
  itemCount?: number;
  order?: number;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Maroon - Free Size" or "Size 40"
  size?: string; // "S", "M", "L", "XL", "XXL", "Free Size", "40", "42"
  color?: string; // "Maroon", "Temple Gold", "Peacock Blue", "Ivory White"
  colorHex?: string;
  sku: string;
  stock: number;
  priceModifier?: number; // +/- from base price
  supplierId?: string; // Admin internal only
  purchasePrice?: number; // Admin internal only
}

export interface ProductReview {
  id: string;
  productId: string;
  customerName: string;
  rating: number; // 1 - 5
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  sku: string;
  nameEn: string;
  nameTa: string;
  slug: string;
  descriptionEn: string;
  descriptionTa: string;
  shortDescEn: string;
  shortDescTa: string;
  categoryId: string; // Level 1 or 2 category
  subCategoryId?: string;
  brand: string;
  images: string[];
  basePrice: number; // MRP
  regularDiscount: number; // % (e.g. 15 for 15% off)
  specialDiscount: number; // % extra seasonal discount
  finalPrice: number; // Auto-calculated
  stock: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isNewArrival?: boolean;
  isActive: boolean;
  fabric: string; // e.g. "Pure Mulberry Silk", "Chettinad Cotton", "Linen"
  material: string;
  style: string; // "Bridal", "Temple Festive", "Casual Workwear", "Ceremonial"
  careInstructionsEn: string;
  careInstructionsTa: string;
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
  // Internal Supplier sourcing info (ADMIN ONLY - never sent to storefront)
  supplierId?: string;
  purchaseCost?: number;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'PENDING_VERIFICATION';

export type PaymentMethod = 'ONLINE_UPI' | 'ONLINE_CARD' | 'BANK_TRANSFER';

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
}

export interface UpiDetails {
  upiId: string;
  merchantName: string;
  qrCodeNote?: string;
}

export interface ShippingRules {
  tamilNaduStandard: number;
  tamilNaduExpress: number;
  indiaStandard: number;
  indiaExpress: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantName?: string;
  size?: string;
  color?: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface ShippingDetails {
  courierName: string;
  trackingId: string;
  trackingUrl: string;
  shippedDate?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "NIRAI-2026-9042"
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingFee: number;
  freeShippingApplied: boolean;
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  utrNumber?: string;
  paymentProofUrl?: string;
  shippingDetails?: ShippingDetails;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  product: Product;
  selectedVariant: ProductVariant;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  leadTimeDays: number;
  notes?: string;
  isActive: boolean;
  productsSuppliedCount?: number;
}

export interface CourierPartner {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  deliveryDays: string;
  coverage: string;
  trackingUrlTemplate: string;
  badgeText?: string;
  isActive: boolean;
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'RECEIPT' | 'SALE' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  quantityDelta: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  timestamp: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validUntil: string;
  isActive: boolean;
  usageCount: number;
}

export interface Banner {
  id: string;
  titleEn: string;
  titleTa: string;
  subtitleEn: string;
  subtitleTa: string;
  badgeEn?: string;
  badgeTa?: string;
  ctaTextEn: string;
  ctaTextTa: string;
  ctaLink: string;
  imageUrl: string;
  bgColor?: string;
  isActive: boolean;
  position: 'hero' | 'promo' | 'festival';
}

export interface MediaItem {
  id: string;
  url: string;
  publicId: string;
  filename: string;
  fileSize: number; // in bytes
  width?: number;
  height?: number;
  format: string; // 'png' | 'jpeg' | 'webp' | 'svg'
  category: 'logos' | 'hero' | 'categories' | 'products' | 'promotions' | 'general';
  altText?: string;
  createdAt: string;
}

export interface LogoSettings {
  desktopLogoUrl?: string; // recommended 400x120px approx 3:1
  mobileLogoUrl?: string; // recommended 160x160px icon-style
  altText: string;
}

export interface HeroSlide {
  id: string;
  titleEn: string;
  titleTa: string;
  subtitleEn: string;
  subtitleTa: string;
  badgeEn?: string;
  badgeTa?: string;
  ctaTextEn: string;
  ctaTextTa: string;
  ctaLink: string;
  desktopImage: string; // 1920x700px
  mobileImage?: string; // 1080x1350px
  isActive: boolean;
  order: number;
}

export interface PromoBannerConfig {
  id: string;
  titleEn: string;
  titleTa: string;
  subtitleEn: string;
  subtitleTa: string;
  badgeEn?: string;
  badgeTa?: string;
  ctaTextEn: string;
  ctaTextTa: string;
  ctaLink: string;
  desktopImage: string; // 1600x600px
  mobileImage?: string; // 1080x900px
  countdownDate?: string; // ISO date e.g. 2026-10-31T23:59:59Z
  isActive: boolean;
}

export type HomepageSectionId =
  | 'hero'
  | 'categories'
  | 'featured'
  | 'promo'
  | 'new_arrivals'
  | 'why_us'
  | 'final_cta';

export interface HomepageSectionItem {
  id: HomepageSectionId;
  label: string;
  isVisible: boolean;
  order: number;
}

export interface StoreSettings {
  storeName: string;
  taglineEn: string;
  taglineTa: string;
  logo: LogoSettings;
  heroSlides: HeroSlide[];
  promoBanner: PromoBannerConfig;
  homepageSections: HomepageSectionItem[];
  freeShippingThreshold: number; // ₹1500 default
  standardShippingFee: number; // ₹120 if under threshold
  shippingRules?: ShippingRules;
  bankDetails?: BankDetails;
  upiDetails?: UpiDetails;
  announcementEn: string;
  announcementTa: string;
  supportPhone: string;
  supportEmail: string;
  isAnnouncementActive: boolean;
}

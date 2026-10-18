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
  userId?: string;
  customerName: string;
  rating: number; // 1 - 5
  title?: string;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string | null;
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

export type PaymentStatus =
  | 'Awaiting Payment'
  | 'Verification Pending'
  | 'Paid'
  | 'Rejected'
  | 'Expired'
  | 'Refunded'
  | 'Pending'
  | 'PENDING_VERIFICATION'
  | 'Failed';

export type PaymentMethod = 'ONLINE_UPI' | 'BANK_TRANSFER' | 'COD' | 'ONLINE_CARD';

export interface PaymentSettings {
  id: string;
  upiId: string;
  payeeName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branch: string;
  qrImagePath?: string | null;
  paymentDeadlineHours: number;
  codEnabled: boolean;
  instructionsEn?: string;
  instructionsTa?: string;
  updatedAt?: string;
}

export interface PaymentSubmission {
  id: string;
  orderId: string;
  utr: string;
  amountPaid: number;
  paidAt: string;
  payerName: string;
  method: 'upi' | 'bank_transfer' | 'qr' | 'cash';
  screenshotPath?: string | null;
  status: 'submitted' | 'verified' | 'rejected';
  rejectReason?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface PaymentInstructions {
  success: boolean;
  error?: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  amount_due: number;
  order_status: string;
  payment_status: PaymentStatus;
  payment_method: string;
  payment_due_at: string;
  payment_deadline_hours: number;
  is_expired: boolean;
  upi_details: {
    upi_id: string;
    payee_name: string;
    qr_image_path?: string | null;
  };
  bank_details: {
    account_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    branch: string;
  };
  cod_enabled: boolean;
  instructions: {
    en: string;
    ta: string;
  };
  latest_submission?: {
    id: string;
    utr: string;
    amount_paid: number;
    method: string;
    status: 'submitted' | 'verified' | 'rejected';
    reject_reason?: string | null;
    created_at: string;
  } | null;
}

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
  qrCodeImageUrl?: string;
}

export interface FooterLinkItem {
  id: string;
  labelEn: string;
  labelTa: string;
  url: string;
}

export interface FooterColumn {
  id: string;
  titleEn: string;
  titleTa: string;
  links: FooterLinkItem[];
}

export interface SocialLinks {
  showSocialIcons: boolean;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  whatsappUrl: string;
}

export interface FooterConfig {
  brandAboutEn: string;
  brandAboutTa: string;
  addressEn: string;
  addressTa: string;
  columns: FooterColumn[];
  social: SocialLinks;
  copyrightEn: string;
  copyrightTa: string;
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
  paymentDueAt?: string;
  paymentSubmissions?: PaymentSubmission[];
  paymentDetails?: Record<string, any>;
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

export interface CartQuoteItem {
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  variantId?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  inStock: boolean;
  availableStock: number;
}

export interface CartQuote {
  success: boolean;
  error?: string;
  items: CartQuoteItem[];
  subtotal: number;
  shippingFee: number;
  freeShippingApplied: boolean;
  freeShippingThreshold: number;
  discount: number;
  coupon?: {
    code: string;
    isValid: boolean;
    discount: number;
    error?: string | null;
  };
  taxAmount: number;
  taxIncluded: boolean;
  grandTotal: number;
}

export interface PlaceOrderPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: Address;
  items: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
  }>;
  coupon_code?: string;
  payment_method?: PaymentMethod;
  utr_number?: string;
  payment_proof_url?: string;
  idempotency_key?: string;
}

export interface TrackingResult {
  success: boolean;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  shipping_details?: ShippingDetails;
  items: Array<{
    productName: string;
    productImage?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  item_count: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
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
  type: 'RECEIPT' | 'SALE' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN' | 'RESTOCK' | 'DISPATCH';
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
  footerConfig?: FooterConfig;
}

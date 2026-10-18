import {
  Product,
  Category,
  Supplier,
  CourierPartner,
  Coupon,
  Banner,
  Order,
  User,
  StockMovement,
  StoreSettings,
  OrderStatus,
  PaymentStatus,
  ProductVariant,
  MediaItem,
  HeroSlide,
  PromoBannerConfig,
  HomepageSectionItem,
  LogoSettings,
  PaymentSettings,
  PaymentSubmission,
  PaymentInstructions,
} from '../types';
import {
  fetchProductsFromSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  fetchCategoriesFromSupabase,
  saveCategoryToSupabase,
  deleteCategoryFromSupabase,
  fetchOrdersFromSupabase,
  saveOrderToSupabase,
  updateOrderStatusInSupabase,
  fetchCouponsFromSupabase,
  saveCouponToSupabase,
  deleteCouponFromSupabase,
  fetchSettingsFromSupabase,
  saveSettingsToSupabase,
  fetchSuppliersFromSupabase,
  saveSupplierToSupabase,
  deleteSupplierFromSupabase,
  fetchCouriersFromSupabase,
  saveCourierToSupabase,
  deleteCourierFromSupabase,
  fetchStockMovementsFromSupabase,
  adjustStockViaRpc,
  fetchMediaItemsFromSupabase,
  saveMediaItemToSupabase,
  deleteMediaItemFromSupabase,
  fetchUsersFromSupabase,
  saveUserToSupabase,
  fetchUserWishlist,
  toggleWishlistInSupabase,
  syncGuestWishlistRpc,
  placeOrderViaRpc,
  updateOrderStatusViaRpc,
  cancelOrderViaRpc,
  quoteCartViaRpc,
  trackOrderViaRpc,
  fetchPaymentSettingsFromSupabase,
  savePaymentSettingsToSupabase,
  getPaymentInstructionsViaRpc,
  submitPaymentProofViaRpc,
  verifyPaymentViaRpc,
  rejectPaymentViaRpc,
  markOrderPaidManuallyViaRpc,
  fetchPaymentSubmissionsForOrder,
  fetchPendingPaymentSubmissions,
  uploadPaymentProof,
  getSignedPaymentProofUrl,
  uploadPaymentQrImage,
  supabase,
} from './supabase';

/**
 * Storage Keys strictly reserved for client-side state
 * Per specification: Supabase is the sole source of truth for all business entities.
 * localStorage is ONLY used for guest cart, guest wishlist, and UI preferences.
 */
export const CLIENT_STORAGE_KEYS = {
  CART: 'nirai_cart',
  GUEST_WISHLIST: 'nirai_guest_wishlist',
  LANGUAGE: 'nirai_lang',
} as const;

// Legacy storage keys that must be wiped to prevent demo data from lingering
const LEGACY_STORAGE_KEYS = [
  'nirai_products_v1',
  'nirai_categories_v1',
  'nirai_suppliers_v1',
  'nirai_couriers_v1',
  'nirai_coupons_v1',
  'nirai_banners_v1',
  'nirai_orders_v1',
  'nirai_users_v1',
  'nirai_stock_movements_v1',
  'nirai_settings_v1',
  'nirai_media_v1',
  'nirai_wishlist_v1',
  'nirai_active_user',
];

// Automatically purge legacy localStorage database cache on execution
try {
  LEGACY_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
} catch {
  // Ignore in non-browser or sandbox environments
}

// Event listener system for reactive real-time updates across components
type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

export function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Storage listener callback error', e);
    }
  });
}

export function subscribeToStore(listener: StorageListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Baseline default settings while remote settings are being fetched from Supabase
const defaultStoreSettings: StoreSettings = {
  storeName: 'Nirai',
  taglineEn: 'Pure South Indian Handlooms & Traditional Wear',
  taglineTa: 'பாரம்பரிய தென்னிந்திய கைத்தறி ஆடைகள்',
  logo: {
    altText: 'Nirai Traditional Handlooms',
  },
  heroSlides: [],
  promoBanner: {
    id: 'promo-default',
    titleEn: 'Festive Handloom Collections',
    titleTa: 'சிறப்பு கைத்தறி திருவிழா',
    subtitleEn: 'Authentic South Indian artisanal weaves crafted with heritage precision.',
    subtitleTa: 'கைத்தறி நெசவாளர்களின் கைவண்ணத்தில் உருவான பாரம்பரிய ஆடைகள்.',
    badgeEn: 'Handcrafted',
    badgeTa: 'கைத்தறி',
    ctaTextEn: 'Explore Collection',
    ctaTextTa: 'தொகுப்பைப் பார்',
    ctaLink: 'catalog',
    desktopImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1080&q=80',
    isActive: true,
  },
  homepageSections: [
    { id: 'hero', label: 'Hero Carousel', isVisible: true, order: 1 },
    { id: 'categories', label: 'Categories', isVisible: true, order: 2 },
    { id: 'featured', label: 'Featured Handlooms', isVisible: true, order: 3 },
    { id: 'promo', label: 'Promotional Banner', isVisible: true, order: 4 },
    { id: 'new_arrivals', label: 'New Arrivals', isVisible: true, order: 5 },
    { id: 'why_us', label: 'Why Choose Us', isVisible: true, order: 6 },
    { id: 'final_cta', label: 'Call To Action', isVisible: true, order: 7 },
  ],
  freeShippingThreshold: 1500,
  standardShippingFee: 120,
  shippingRules: {
    tamilNaduStandard: 80,
    tamilNaduExpress: 160,
    indiaStandard: 120,
    indiaExpress: 220,
  },
  announcementEn: '✨ Free express delivery across India on orders above ₹1,500',
  announcementTa: '✨ ₹1,500-க்கு மேல் இலவச எக்ஸ்பிரஸ் டெலிவரி',
  supportPhone: '+91 44 2498 7654',
  supportEmail: 'care@nirai.in',
  isAnnouncementActive: true,
};

// In-Memory Database Cache (Not persisted in localStorage)
const memoryCache = {
  products: [] as Product[],
  categories: [] as Category[],
  orders: [] as Order[],
  suppliers: [] as Supplier[],
  couriers: [] as CourierPartner[],
  coupons: [] as Coupon[],
  banners: [] as Banner[],
  settings: defaultStoreSettings,
  mediaItems: [] as MediaItem[],
  stockMovements: [] as StockMovement[],
  users: [] as User[],
  isLoaded: false,
  fetchError: null as string | null,
};

/**
 * Authoritative Storage Service
 * Read operations serve the synchronized in-memory database cache.
 * Write operations modify the remote Supabase database and update cache upon confirmation.
 */
export const StorageService = {
  isInitialized(): boolean {
    return memoryCache.isLoaded;
  },

  hasError(): boolean {
    return Boolean(memoryCache.fetchError);
  },

  getError(): string | null {
    return memoryCache.fetchError;
  },

  // ============================================================================
  // 1. PRODUCTS
  // ============================================================================

  getProducts(): Product[] {
    return memoryCache.products;
  },

  getPublicProducts(): Product[] {
    return memoryCache.products
      .filter((p) => p.isActive)
      .map((p) => {
        const { supplierId, purchaseCost, internalNotes, ...safeProduct } = p;
        const safeVariants = safeProduct.variants.map((v) => {
          const { supplierId, purchasePrice, ...safeVar } = v;
          return safeVar;
        });
        return {
          ...safeProduct,
          variants: safeVariants as ProductVariant[],
        };
      });
  },

  getProductById(id: string): Product | undefined {
    return memoryCache.products.find((p) => p.id === id);
  },

  getProductBySlug(slug: string): Product | undefined {
    return memoryCache.products.find((p) => p.slug === slug);
  },

  async saveProduct(product: Product): Promise<boolean> {
    const regularOff = (product.basePrice * (product.regularDiscount || 0)) / 100;
    const priceAfterRegular = product.basePrice - regularOff;
    const specialOff = (priceAfterRegular * (product.specialDiscount || 0)) / 100;
    product.finalPrice = Math.round(priceAfterRegular - specialOff);
    product.updatedAt = new Date().toISOString();

    const ok = await saveProductToSupabase(product);
    if (ok) {
      const idx = memoryCache.products.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        memoryCache.products[idx] = product;
      } else {
        memoryCache.products.unshift(product);
      }
      notifyListeners();
    }
    return ok;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const ok = await deleteProductFromSupabase(id);
    if (ok) {
      memoryCache.products = memoryCache.products.filter((p) => p.id !== id);
      notifyListeners();
    }
    return ok;
  },

  toggleProductFeatured(productId: string): boolean {
    const p = memoryCache.products.find((prod) => prod.id === productId);
    if (p) {
      p.isFeatured = !p.isFeatured;
      saveProductToSupabase(p).catch(console.error);
      notifyListeners();
      return p.isFeatured;
    }
    return false;
  },

  toggleProductNewArrival(productId: string): boolean {
    const p = memoryCache.products.find((prod) => prod.id === productId);
    if (p) {
      p.isNewArrival = !p.isNewArrival;
      saveProductToSupabase(p).catch(console.error);
      notifyListeners();
      return !!p.isNewArrival;
    }
    return false;
  },

  getNewArrivals(): Product[] {
    const products = this.getPublicProducts();
    const tagged = products.filter((p) => p.isNewArrival);
    if (tagged.length >= 4) return tagged;
    return [...products].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // ============================================================================
  // 2. CATEGORIES
  // ============================================================================

  getCategories(): Category[] {
    return memoryCache.categories;
  },

  async saveCategory(category: Category): Promise<boolean> {
    const ok = await saveCategoryToSupabase(category);
    if (ok) {
      const idx = memoryCache.categories.findIndex((c) => c.id === category.id);
      if (idx >= 0) {
        memoryCache.categories[idx] = category;
      } else {
        memoryCache.categories.push(category);
      }
      notifyListeners();
    }
    return ok;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const ok = await deleteCategoryFromSupabase(id);
    if (ok) {
      memoryCache.categories = memoryCache.categories.filter((c) => c.id !== id);
      notifyListeners();
    }
    return ok;
  },

  reorderCategories(categoryIds: string[]): void {
    categoryIds.forEach((id, idx) => {
      const cat = memoryCache.categories.find((c) => c.id === id);
      if (cat) {
        cat.order = idx + 1;
        saveCategoryToSupabase(cat).catch(console.error);
      }
    });
    notifyListeners();
  },

  // ============================================================================
  // 3. SUPPLIERS (Admin Internal)
  // ============================================================================

  getSuppliers(): Supplier[] {
    return memoryCache.suppliers;
  },

  async saveSupplier(supplier: Supplier): Promise<boolean> {
    const ok = await saveSupplierToSupabase(supplier);
    if (ok) {
      const idx = memoryCache.suppliers.findIndex((s) => s.id === supplier.id);
      if (idx >= 0) {
        memoryCache.suppliers[idx] = supplier;
      } else {
        memoryCache.suppliers.push(supplier);
      }
      notifyListeners();
    }
    return ok;
  },

  async deleteSupplier(id: string): Promise<boolean> {
    const ok = await deleteSupplierFromSupabase(id);
    if (ok) {
      memoryCache.suppliers = memoryCache.suppliers.filter((s) => s.id !== id);
      notifyListeners();
    }
    return ok;
  },

  // ============================================================================
  // 4. COURIER PARTNERS
  // ============================================================================

  getCourierPartners(): CourierPartner[] {
    return memoryCache.couriers;
  },

  async saveCourierPartner(courier: CourierPartner): Promise<boolean> {
    const ok = await saveCourierToSupabase(courier);
    if (ok) {
      const idx = memoryCache.couriers.findIndex((c) => c.id === courier.id);
      if (idx >= 0) {
        memoryCache.couriers[idx] = courier;
      } else {
        memoryCache.couriers.push(courier);
      }
      notifyListeners();
    }
    return ok;
  },

  async deleteCourierPartner(id: string): Promise<boolean> {
    const ok = await deleteCourierFromSupabase(id);
    if (ok) {
      memoryCache.couriers = memoryCache.couriers.filter((c) => c.id !== id);
      notifyListeners();
    }
    return ok;
  },

  // ============================================================================
  // 5. ORDERS
  // ============================================================================

  getOrders(): Order[] {
    return memoryCache.orders;
  },

  getOrderById(id: string): Order | undefined {
    return memoryCache.orders.find((o) => o.id === id || o.orderNumber === id);
  },

  async createOrder(
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> & { idempotencyKey?: string }
  ): Promise<Order> {
    const payload = {
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      shipping_address: orderData.shippingAddress,
      items: orderData.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || null,
        quantity: i.quantity,
      })),
      coupon_code: orderData.couponCode,
      payment_method: orderData.paymentMethod,
      utr_number: orderData.utrNumber,
      payment_proof_url: orderData.paymentProofUrl,
      idempotency_key: orderData.idempotencyKey || `idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };

    const rpcRes = await placeOrderViaRpc(payload);
    if (!rpcRes.success || !rpcRes.data) {
      throw new Error(rpcRes.error || 'Failed to place order.');
    }

    const newOrder: Order = {
      ...orderData,
      id: rpcRes.data.orderId,
      orderNumber: rpcRes.data.orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Prepend to local memory cache so storefront immediately reflects order without full re-fetch
    memoryCache.orders = [newOrder, ...memoryCache.orders.filter((o) => o.id !== newOrder.id)];
    notifyListeners();
    return newOrder;
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    shippingDetails?: Order['shippingDetails'],
    extraFields?: { utrNumber?: string; notes?: string }
  ): Promise<boolean> {
    const rpcRes = await updateOrderStatusViaRpc(
      orderId,
      status,
      paymentStatus,
      shippingDetails,
      extraFields?.notes
    );

    if (!rpcRes.success) {
      console.error('Server status transition rejected:', rpcRes.error);
      throw new Error(rpcRes.error || 'Server rejected order status transition.');
    }

    const order = memoryCache.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      if (shippingDetails) {
        order.shippingDetails = { ...order.shippingDetails, ...shippingDetails };
      }
      if (extraFields?.utrNumber !== undefined) order.utrNumber = extraFields.utrNumber;
      if (extraFields?.notes !== undefined) order.notes = extraFields.notes;
      order.updatedAt = new Date().toISOString();
    }

    notifyListeners();
    return true;
  },

  async cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const rpcRes = await cancelOrderViaRpc(orderId, reason);
    if (!rpcRes.success) {
      return { success: false, error: rpcRes.error };
    }

    const order = memoryCache.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = 'Cancelled';
      order.updatedAt = new Date().toISOString();
      notifyListeners();
    }

    return { success: true };
  },

  // ============================================================================
  // PAYMENT VERIFICATION & SETTINGS (Secure RPCs)
  // ============================================================================

  async getPaymentInstructions(
    orderId?: string,
    orderNumber?: string,
    phone?: string
  ): Promise<{ success: boolean; data?: PaymentInstructions; error?: string }> {
    return getPaymentInstructionsViaRpc(orderId, orderNumber, phone);
  },

  async submitPaymentProof(params: {
    orderNumber: string;
    phone: string;
    utr: string;
    method: string;
    amountPaid: number;
    payerName: string;
    screenshotPath?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await submitPaymentProofViaRpc(params);
    if (res.success) {
      const order = memoryCache.orders.find(
        (o) => o.orderNumber.toUpperCase() === params.orderNumber.trim().toUpperCase()
      );
      if (order) {
        order.paymentStatus = 'Verification Pending';
        order.utrNumber = params.utr.trim();
        order.updatedAt = new Date().toISOString();
        notifyListeners();
      }
    }
    return res;
  },

  async verifyPayment(
    submissionId: string,
    notes?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await verifyPaymentViaRpc(submissionId, notes);
    if (res.success) {
      if (res.data?.order_id) {
        const order = memoryCache.orders.find((o) => o.id === res.data.order_id);
        if (order) {
          order.paymentStatus = 'Paid';
          order.status = 'Confirmed';
          order.updatedAt = new Date().toISOString();
        }
      }
      notifyListeners();
    }
    return res;
  },

  async rejectPayment(
    submissionId: string,
    reason: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await rejectPaymentViaRpc(submissionId, reason);
    if (res.success) {
      if (res.data?.order_id) {
        const order = memoryCache.orders.find((o) => o.id === res.data.order_id);
        if (order) {
          order.paymentStatus = 'Rejected';
          order.updatedAt = new Date().toISOString();
        }
      }
      notifyListeners();
    }
    return res;
  },

  async markOrderPaidManually(
    orderId: string,
    notes: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await markOrderPaidManuallyViaRpc(orderId, notes);
    if (res.success) {
      const order = memoryCache.orders.find((o) => o.id === orderId);
      if (order) {
        order.paymentStatus = 'Paid';
        order.status = 'Confirmed';
        order.updatedAt = new Date().toISOString();
        notifyListeners();
      }
    }
    return res;
  },

  async getPaymentSubmissions(orderId: string): Promise<PaymentSubmission[]> {
    return fetchPaymentSubmissionsForOrder(orderId);
  },

  async getPendingPaymentSubmissions(): Promise<PaymentSubmission[]> {
    return fetchPendingPaymentSubmissions();
  },

  async getPaymentSettings(): Promise<PaymentSettings | null> {
    return fetchPaymentSettingsFromSupabase();
  },

  async savePaymentSettings(
    settings: Partial<PaymentSettings>
  ): Promise<{ success: boolean; error?: string }> {
    return savePaymentSettingsToSupabase(settings);
  },

  async uploadPaymentProof(
    orderId: string,
    file: File
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    return uploadPaymentProof(orderId, file);
  },

  async getSignedPaymentProofUrl(path: string): Promise<string | null> {
    return getSignedPaymentProofUrl(path);
  },

  async uploadPaymentQrImage(
    file: File
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    return uploadPaymentQrImage(file);
  },

  // ============================================================================
  // 6. INVENTORY & STOCK MOVEMENTS (Audited via DB Triggers & RPC)
  // ============================================================================

  getStockMovements(): StockMovement[] {
    return memoryCache.stockMovements;
  },

  async adjustProductStock(
    productId: string,
    delta: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const res = await adjustStockViaRpc(productId, delta, reason);
    if (res.success) {
      // Refresh products and stock movements from Supabase
      const [freshProducts, freshMovements] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchStockMovementsFromSupabase(),
      ]);
      if (freshProducts) memoryCache.products = freshProducts;
      if (freshMovements) memoryCache.stockMovements = freshMovements;
      notifyListeners();
    }
    return res;
  },

  // ============================================================================
  // 7. COUPONS
  // ============================================================================

  getCoupons(): Coupon[] {
    return memoryCache.coupons;
  },

  async saveCoupon(coupon: Coupon): Promise<boolean> {
    const ok = await saveCouponToSupabase(coupon);
    if (ok) {
      const idx = memoryCache.coupons.findIndex((c) => c.id === coupon.id);
      if (idx >= 0) {
        memoryCache.coupons[idx] = coupon;
      } else {
        memoryCache.coupons.push(coupon);
      }
      notifyListeners();
    }
    return ok;
  },

  async deleteCoupon(id: string): Promise<boolean> {
    const ok = await deleteCouponFromSupabase(id);
    if (ok) {
      memoryCache.coupons = memoryCache.coupons.filter((c) => c.id !== id);
      notifyListeners();
    }
    return ok;
  },

  validateCoupon(code: string, subtotal: number): { valid: boolean; coupon?: Coupon; error?: string } {
    const normalized = code.trim().toUpperCase();
    const coupon = memoryCache.coupons.find(
      (c) => c.code.toUpperCase() === normalized && c.isActive
    );
    if (!coupon) {
      return { valid: false, error: 'Invalid or inactive coupon code' };
    }
    if (new Date(coupon.validUntil) < new Date()) {
      return { valid: false, error: 'This coupon has expired' };
    }
    if (subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        error: `Minimum order amount for coupon ${coupon.code} is ₹${coupon.minOrderAmount.toLocaleString()}`,
      };
    }
    return { valid: true, coupon };
  },

  // ============================================================================
  // 8. BANNERS
  // ============================================================================

  getBanners(): Banner[] {
    return memoryCache.banners;
  },

  saveBanner(banner: Banner): void {
    const idx = memoryCache.banners.findIndex((b) => b.id === banner.id);
    if (idx >= 0) {
      memoryCache.banners[idx] = banner;
    } else {
      memoryCache.banners.push(banner);
    }
    notifyListeners();
  },

  deleteBanner(id: string): void {
    memoryCache.banners = memoryCache.banners.filter((b) => b.id !== id);
    notifyListeners();
  },

  // ============================================================================
  // 9. STORE SETTINGS
  // ============================================================================

  getSettings(): StoreSettings {
    return memoryCache.settings;
  },

  async saveSettings(settings: StoreSettings): Promise<boolean> {
    const ok = await saveSettingsToSupabase(settings);
    if (ok) {
      memoryCache.settings = settings;
      notifyListeners();
    }
    return ok;
  },

  getHeroSlides(): HeroSlide[] {
    return [...(memoryCache.settings.heroSlides || [])].sort((a, b) => a.order - b.order);
  },

  async saveHeroSlide(slide: HeroSlide): Promise<boolean> {
    const settings = this.getSettings();
    const slides = [...(settings.heroSlides || [])];
    const idx = slides.findIndex((s) => s.id === slide.id);
    if (idx >= 0) {
      slides[idx] = slide;
    } else {
      slides.push(slide);
    }
    return this.saveSettings({ ...settings, heroSlides: slides });
  },

  async deleteHeroSlide(id: string): Promise<boolean> {
    const settings = this.getSettings();
    const slides = (settings.heroSlides || []).filter((s) => s.id !== id);
    return this.saveSettings({ ...settings, heroSlides: slides });
  },

  async reorderHeroSlides(slides: HeroSlide[]): Promise<boolean> {
    const settings = this.getSettings();
    return this.saveSettings({ ...settings, heroSlides: slides });
  },

  getPromoBanner(): PromoBannerConfig {
    return memoryCache.settings.promoBanner;
  },

  async savePromoBanner(promo: PromoBannerConfig): Promise<boolean> {
    const settings = this.getSettings();
    return this.saveSettings({ ...settings, promoBanner: promo });
  },

  getHomepageSections(): HomepageSectionItem[] {
    return [...(memoryCache.settings.homepageSections || [])].sort((a, b) => a.order - b.order);
  },

  async saveHomepageSections(sections: HomepageSectionItem[]): Promise<boolean> {
    const settings = this.getSettings();
    return this.saveSettings({ ...settings, homepageSections: sections });
  },

  getLogoSettings(): LogoSettings {
    return memoryCache.settings.logo;
  },

  async saveLogoSettings(logo: LogoSettings): Promise<boolean> {
    const settings = this.getSettings();
    return this.saveSettings({ ...settings, logo });
  },

  // ============================================================================
  // 10. MEDIA LIBRARY
  // ============================================================================

  getMediaItems(): MediaItem[] {
    return memoryCache.mediaItems;
  },

  async saveMediaItem(media: MediaItem): Promise<boolean> {
    const ok = await saveMediaItemToSupabase({
      url: media.url,
      secureUrl: media.url,
      publicId: media.publicId,
      category: media.category,
      altText: media.altText,
      width: media.width,
      height: media.height,
      format: media.format,
      bytes: media.fileSize,
    });
    if (ok) {
      const idx = memoryCache.mediaItems.findIndex((m) => m.id === media.id);
      if (idx >= 0) {
        memoryCache.mediaItems[idx] = media;
      } else {
        memoryCache.mediaItems.unshift(media);
      }
      notifyListeners();
    }
    return ok;
  },

  async deleteMediaItem(id: string): Promise<boolean> {
    const item = memoryCache.mediaItems.find((m) => m.id === id || m.publicId === id);
    if (!item) return false;
    const ok = await deleteMediaItemFromSupabase(item.publicId);
    if (ok) {
      memoryCache.mediaItems = memoryCache.mediaItems.filter(
        (m) => m.id !== id && m.publicId !== id
      );
      notifyListeners();
    }
    return ok;
  },

  // ============================================================================
  // 11. USERS & PROFILES
  // ============================================================================

  getUsers(): User[] {
    return memoryCache.users;
  },

  async saveUser(user: User): Promise<boolean> {
    const ok = await saveUserToSupabase(user);
    if (ok) {
      const idx = memoryCache.users.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        memoryCache.users[idx] = user;
      } else {
        memoryCache.users.push(user);
      }
      notifyListeners();
    }
    return ok;
  },

  // ============================================================================
  // 12. WISHLIST (Guest LocalStorage & Logged-in Supabase)
  // ============================================================================

  getGuestWishlist(): string[] {
    try {
      const raw = localStorage.getItem(CLIENT_STORAGE_KEYS.GUEST_WISHLIST);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  setGuestWishlist(ids: string[]): void {
    try {
      localStorage.setItem(CLIENT_STORAGE_KEYS.GUEST_WISHLIST, JSON.stringify(ids));
    } catch (e) {
      console.error('Error saving guest wishlist:', e);
    }
    notifyListeners();
  },

  getWishlist(): string[] {
    return this.getGuestWishlist();
  },

  toggleWishlist(productId: string): boolean {
    const list = this.getGuestWishlist();
    const idx = list.indexOf(productId);
    let added = false;
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(productId);
      added = true;
    }
    this.setGuestWishlist(list);
    return added;
  },

  // ============================================================================
  // 13. REAL-TIME DATA INITIALIZATION & SYNC
  // ============================================================================

  async initSupabaseSync(): Promise<{ success: boolean; error?: string }> {
    try {
      memoryCache.fetchError = null;

      const [
        remoteProducts,
        remoteCategories,
        remoteOrders,
        remoteUsers,
        remoteCoupons,
        remoteSettings,
        remoteSuppliers,
        remoteCouriers,
        remoteMedia,
        remoteMovements,
      ] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchCategoriesFromSupabase(),
        fetchOrdersFromSupabase(),
        fetchUsersFromSupabase(),
        fetchCouponsFromSupabase(),
        fetchSettingsFromSupabase(),
        fetchSuppliersFromSupabase(),
        fetchCouriersFromSupabase(),
        fetchMediaItemsFromSupabase(),
        fetchStockMovementsFromSupabase(),
      ]);

      // If both products and categories failed to load, register an error state
      if (!remoteProducts && !remoteCategories) {
        const errorMsg = 'Unable to fetch store catalog from Supabase. Please verify connection.';
        memoryCache.fetchError = errorMsg;
        notifyListeners();
        return { success: false, error: errorMsg };
      }

      if (remoteProducts) memoryCache.products = remoteProducts;
      if (remoteCategories) memoryCache.categories = remoteCategories;
      if (remoteOrders) memoryCache.orders = remoteOrders;
      if (remoteUsers) memoryCache.users = remoteUsers;
      if (remoteCoupons) memoryCache.coupons = remoteCoupons;
      if (remoteSettings) memoryCache.settings = remoteSettings;
      if (remoteSuppliers) memoryCache.suppliers = remoteSuppliers;
      if (remoteCouriers) memoryCache.couriers = remoteCouriers;
      if (remoteMedia) memoryCache.mediaItems = remoteMedia;
      if (remoteMovements) memoryCache.stockMovements = remoteMovements;

      memoryCache.isLoaded = true;
      notifyListeners();
      return { success: true };
    } catch (err: any) {
      const errorMsg = err?.message || 'Error syncing data from Supabase.';
      memoryCache.fetchError = errorMsg;
      notifyListeners();
      return { success: false, error: errorMsg };
    }
  },

  async retrySync(): Promise<{ success: boolean; error?: string }> {
    return this.initSupabaseSync();
  },
};

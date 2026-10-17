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
} from '../types';
import {
  initialCategories,
  initialProducts,
  initialSuppliers,
  initialCouriers,
  initialCoupons,
  initialBanners,
  initialOrders,
  initialUsers,
  initialStoreSettings,
  initialMediaItems,
} from '../data/initialData';
import {
  saveProductToSupabase,
  deleteProductFromSupabase,
  fetchProductsFromSupabase,
  saveCategoryToSupabase,
  deleteCategoryFromSupabase,
  fetchCategoriesFromSupabase,
  saveOrderToSupabase,
  fetchOrdersFromSupabase,
  saveUserToSupabase,
  fetchUsersFromSupabase,
  saveCouponToSupabase,
  deleteCouponFromSupabase,
  fetchCouponsFromSupabase,
  saveSettingsToSupabase,
  fetchSettingsFromSupabase,
  autoSeedSupabaseIfEmpty,
  checkSupabaseConnection,
} from './supabase';

const KEYS = {
  PRODUCTS: 'nirai_products_v1',
  CATEGORIES: 'nirai_categories_v1',
  SUPPLIERS: 'nirai_suppliers_v1',
  COURIERS: 'nirai_couriers_v1',
  COUPONS: 'nirai_coupons_v1',
  BANNERS: 'nirai_banners_v1',
  ORDERS: 'nirai_orders_v1',
  USERS: 'nirai_users_v1',
  STOCK_MOVEMENTS: 'nirai_stock_movements_v1',
  SETTINGS: 'nirai_settings_v1',
  WISHLIST: 'nirai_wishlist_v1',
  MEDIA: 'nirai_media_v1',
  ACTIVE_USER: 'nirai_active_user',
};

// Event listener system for reactive real-time updates
type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Listener callback error', e);
    }
  });
}

export function subscribeToStore(listener: StorageListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getItem<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage, using fallback`, err);
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    notifyListeners();
  } catch (err) {
    console.error(`Error saving ${key} to localStorage`, err);
  }
}

export const StorageService = {
  // PRODUCTS
  getProducts(): Product[] {
    return getItem<Product[]>(KEYS.PRODUCTS, initialProducts);
  },

  // Security isolation: Strip internal supplier sourcing data for public customer storefront
  getPublicProducts(): Product[] {
    const products = this.getProducts().filter((p) => p.isActive);
    return products.map((p) => {
      // Return safe copy without supplier identity, purchase price, or internal notes
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
    return this.getProducts().find((p) => p.id === id);
  },

  getProductBySlug(slug: string): Product | undefined {
    return this.getProducts().find((p) => p.slug === slug);
  },

  saveProduct(product: Product): void {
    const list = this.getProducts();
    const idx = list.findIndex((p) => p.id === product.id);
    // Recalculate final price based on Base Price, Regular Discount, and Special Discount
    const regularOff = (product.basePrice * (product.regularDiscount || 0)) / 100;
    const priceAfterRegular = product.basePrice - regularOff;
    const specialOff = (priceAfterRegular * (product.specialDiscount || 0)) / 100;
    product.finalPrice = Math.round(priceAfterRegular - specialOff);
    product.updatedAt = new Date().toISOString();

    if (idx >= 0) {
      const oldStock = list[idx].stock;
      if (oldStock !== product.stock) {
        this.logStockMovement({
          productId: product.id,
          productName: product.nameEn,
          sku: product.sku,
          type: 'ADJUSTMENT',
          quantityDelta: product.stock - oldStock,
          previousStock: oldStock,
          newStock: product.stock,
          reason: 'Manual stock edit in Product Manager',
          performedBy: 'Admin',
        });
      }
      list[idx] = product;
    } else {
      list.unshift(product);
      this.logStockMovement({
        productId: product.id,
        productName: product.nameEn,
        sku: product.sku,
        type: 'RECEIPT',
        quantityDelta: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reason: 'Initial Product Creation',
        performedBy: 'Admin',
      });
    }
    setItem(KEYS.PRODUCTS, list);
    // Background async sync to Supabase
    saveProductToSupabase(product).catch(() => {});
  },

  deleteProduct(id: string): void {
    const list = this.getProducts().filter((p) => p.id !== id);
    setItem(KEYS.PRODUCTS, list);
    deleteProductFromSupabase(id).catch(() => {});
  },

  // CATEGORIES
  getCategories(): Category[] {
    return getItem<Category[]>(KEYS.CATEGORIES, initialCategories);
  },

  saveCategory(category: Category): void {
    const list = this.getCategories();
    const idx = list.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      list[idx] = category;
    } else {
      list.push(category);
    }
    setItem(KEYS.CATEGORIES, list);
    saveCategoryToSupabase(category).catch(() => {});
  },

  deleteCategory(id: string): void {
    const list = this.getCategories().filter((c) => c.id !== id);
    setItem(KEYS.CATEGORIES, list);
    deleteCategoryFromSupabase(id).catch(() => {});
  },

  // SUPPLIERS (Strictly Admin internal)
  getSuppliers(): Supplier[] {
    return getItem<Supplier[]>(KEYS.SUPPLIERS, initialSuppliers);
  },

  saveSupplier(supplier: Supplier): void {
    const list = this.getSuppliers();
    const idx = list.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      list[idx] = supplier;
    } else {
      list.push(supplier);
    }
    setItem(KEYS.SUPPLIERS, list);
  },

  deleteSupplier(id: string): void {
    const list = this.getSuppliers().filter((s) => s.id !== id);
    setItem(KEYS.SUPPLIERS, list);
  },

  // COURIER PARTNERS
  getCourierPartners(): CourierPartner[] {
    return getItem<CourierPartner[]>(KEYS.COURIERS, initialCouriers);
  },

  saveCourierPartner(courier: CourierPartner): void {
    const list = this.getCourierPartners();
    const idx = list.findIndex((c) => c.id === courier.id);
    if (idx >= 0) {
      list[idx] = courier;
    } else {
      list.push(courier);
    }
    setItem(KEYS.COURIERS, list);
  },

  deleteCourierPartner(id: string): void {
    const list = this.getCourierPartners().filter((c) => c.id !== id);
    setItem(KEYS.COURIERS, list);
  },

  // ORDERS
  getOrders(): Order[] {
    const orders = getItem<Order[]>(KEYS.ORDERS, initialOrders);
    const missing = initialOrders.filter(
      (init) => !orders.some((o) => o.id === init.id || o.orderNumber === init.orderNumber)
    );
    if (missing.length > 0) {
      const merged = [...missing, ...orders];
      setItem(KEYS.ORDERS, merged);
      return merged;
    }
    return orders;
  },

  getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id || o.orderNumber === id);
  },

  createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
    const orders = this.getOrders();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const catalogProducts = this.getProducts();

    // Verify catalog prices for each ordered line item to prevent client-side price tampering
    const validatedItems = orderData.items.map((item) => {
      const product = catalogProducts.find((p) => p.id === item.productId);
      const verifiedUnitPrice = product ? (product.finalPrice || product.basePrice) : item.unitPrice;
      return {
        ...item,
        unitPrice: verifiedUnitPrice,
        totalPrice: verifiedUnitPrice * item.quantity,
      };
    });

    const validatedSubtotal = validatedItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const calculatedGrandTotal = Math.max(0, validatedSubtotal + (orderData.shippingFee || 0) - (orderData.discountAmount || 0));

    const newOrder: Order = {
      ...orderData,
      items: validatedItems,
      subtotal: validatedSubtotal,
      grandTotal: calculatedGrandTotal,
      id: `ord-${Date.now()}`,
      orderNumber: `NIRAI-2026-${randomSuffix}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Deduct stock for each ordered item
    const products = this.getProducts();
    newOrder.items.forEach((item) => {
      const pIdx = products.findIndex((p) => p.id === item.productId);
      if (pIdx >= 0) {
        const product = products[pIdx];
        const prevStock = product.stock;
        const newStock = Math.max(0, prevStock - item.quantity);
        product.stock = newStock;

        // Also adjust variant stock if present
        if (item.variantId && product.variants) {
          const vIdx = product.variants.findIndex((v) => v.id === item.variantId);
          if (vIdx >= 0) {
            product.variants[vIdx].stock = Math.max(0, product.variants[vIdx].stock - item.quantity);
          }
        }

        this.logStockMovement({
          productId: product.id,
          productName: product.nameEn,
          sku: item.sku,
          type: 'SALE',
          quantityDelta: -item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          reason: `Order Placed #${newOrder.orderNumber}`,
          performedBy: newOrder.customerName,
        });
      }
    });

    setItem(KEYS.PRODUCTS, products);
    orders.unshift(newOrder);
    setItem(KEYS.ORDERS, orders);
    saveOrderToSupabase(newOrder).catch(() => {});
    return newOrder;
  },

  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    shippingDetails?: Order['shippingDetails'],
    extraFields?: { utrNumber?: string; notes?: string }
  ): void {
    const list = this.getOrders();
    const idx = list.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      list[idx].status = status;
      if (paymentStatus) {
        list[idx].paymentStatus = paymentStatus;
      }
      if (shippingDetails) {
        list[idx].shippingDetails = {
          ...list[idx].shippingDetails,
          ...shippingDetails,
        };
      }
      if (extraFields?.utrNumber !== undefined) {
        list[idx].utrNumber = extraFields.utrNumber;
      }
      if (extraFields?.notes !== undefined) {
        list[idx].notes = extraFields.notes;
      }
      list[idx].updatedAt = new Date().toISOString();

      // If order is cancelled, restore stock
      if (status === 'Cancelled') {
        const products = this.getProducts();
        list[idx].items.forEach((item) => {
          const pIdx = products.findIndex((p) => p.id === item.productId);
          if (pIdx >= 0) {
            const product = products[pIdx];
            const prevStock = product.stock;
            product.stock += item.quantity;
            this.logStockMovement({
              productId: product.id,
              productName: product.nameEn,
              sku: item.sku,
              type: 'RETURN',
              quantityDelta: item.quantity,
              previousStock: prevStock,
              newStock: product.stock,
              reason: `Order Cancelled #${list[idx].orderNumber}`,
              performedBy: 'Admin',
            });
          }
        });
        setItem(KEYS.PRODUCTS, products);
      }

      setItem(KEYS.ORDERS, list);
      saveOrderToSupabase(list[idx]).catch(() => {});
    }
  },


  // INVENTORY & STOCK MOVEMENTS
  getStockMovements(): StockMovement[] {
    return getItem<StockMovement[]>(KEYS.STOCK_MOVEMENTS, [
      {
        id: 'mov-1',
        productId: 'prod-kanchi-maroon',
        productName: 'Vaanam Kanchipuram Pure Silk Saree',
        sku: 'NIR-SAR-001-RD',
        type: 'RECEIPT',
        quantityDelta: 15,
        previousStock: 0,
        newStock: 15,
        reason: 'Received shipment from Kanchi Weavers Guild',
        performedBy: 'Admin (Ramanathan)',
        timestamp: '2026-09-01T10:00:00Z',
      },
      {
        id: 'mov-2',
        productId: 'prod-kanchi-maroon',
        productName: 'Vaanam Kanchipuram Pure Silk Saree',
        sku: 'NIR-SAR-001-RD',
        type: 'SALE',
        quantityDelta: -1,
        previousStock: 15,
        newStock: 14,
        reason: 'Order Placed #NIRAI-2026-9042',
        performedBy: 'Priya Sundaram',
        timestamp: '2026-09-23T14:20:00Z',
      },
    ]);
  },

  logStockMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): void {
    const list = this.getStockMovements();
    const newEntry: StockMovement = {
      ...movement,
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newEntry);
    setItem(KEYS.STOCK_MOVEMENTS, list);
  },

  // COUPONS
  getCoupons(): Coupon[] {
    return getItem<Coupon[]>(KEYS.COUPONS, initialCoupons);
  },

  saveCoupon(coupon: Coupon): void {
    const list = this.getCoupons();
    const idx = list.findIndex((c) => c.id === coupon.id);
    if (idx >= 0) {
      list[idx] = coupon;
    } else {
      list.push(coupon);
    }
    setItem(KEYS.COUPONS, list);
    saveCouponToSupabase(coupon).catch(() => {});
  },

  deleteCoupon(id: string): void {
    const list = this.getCoupons().filter((c) => c.id !== id);
    setItem(KEYS.COUPONS, list);
    deleteCouponFromSupabase(id).catch(() => {});
  },

  validateCoupon(code: string, subtotal: number): { valid: boolean; coupon?: Coupon; error?: string } {
    const normalized = code.trim().toUpperCase();
    const coupon = this.getCoupons().find((c) => c.code.toUpperCase() === normalized && c.isActive);
    if (!coupon) {
      return { valid: false, error: 'Invalid or expired coupon code' };
    }
    if (new Date(coupon.validUntil) < new Date()) {
      return { valid: false, error: 'This coupon has expired' };
    }
    if (subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        error: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount.toLocaleString()}`,
      };
    }
    return { valid: true, coupon };
  },

  // BANNERS
  getBanners(): Banner[] {
    return getItem<Banner[]>(KEYS.BANNERS, initialBanners);
  },

  saveBanner(banner: Banner): void {
    const list = this.getBanners();
    const idx = list.findIndex((b) => b.id === banner.id);
    if (idx >= 0) {
      list[idx] = banner;
    } else {
      list.push(banner);
    }
    setItem(KEYS.BANNERS, list);
  },

  deleteBanner(id: string): void {
    const list = this.getBanners().filter((b) => b.id !== id);
    setItem(KEYS.BANNERS, list);
  },

  // STORE SETTINGS
  getSettings(): StoreSettings {
    const saved = getItem<Partial<StoreSettings>>(KEYS.SETTINGS, initialStoreSettings);
    // Deep merge defaults to protect against older partial local storage objects
    return {
      ...initialStoreSettings,
      ...saved,
      logo: {
        ...initialStoreSettings.logo,
        ...(saved.logo || {}),
      },
      heroSlides: saved.heroSlides && saved.heroSlides.length > 0
        ? saved.heroSlides
        : initialStoreSettings.heroSlides,
      promoBanner: {
        ...initialStoreSettings.promoBanner,
        ...(saved.promoBanner || {}),
      },
      homepageSections: saved.homepageSections && saved.homepageSections.length > 0
        ? saved.homepageSections
        : initialStoreSettings.homepageSections,
    };
  },

  saveSettings(settings: StoreSettings): void {
    setItem(KEYS.SETTINGS, settings);
    saveSettingsToSupabase(settings).catch(() => {});
  },

  // MEDIA LIBRARY
  getMediaItems(): MediaItem[] {
    return getItem<MediaItem[]>(KEYS.MEDIA, initialMediaItems);
  },

  saveMediaItem(media: MediaItem): void {
    const list = this.getMediaItems();
    const idx = list.findIndex((m) => m.id === media.id);
    if (idx >= 0) {
      list[idx] = media;
    } else {
      list.unshift(media);
    }
    setItem(KEYS.MEDIA, list);
  },

  deleteMediaItem(id: string): void {
    const list = this.getMediaItems().filter((m) => m.id !== id);
    setItem(KEYS.MEDIA, list);
  },

  // HERO SLIDES
  getHeroSlides(): HeroSlide[] {
    const settings = this.getSettings();
    return settings.heroSlides.sort((a, b) => a.order - b.order);
  },

  saveHeroSlide(slide: HeroSlide): void {
    const settings = this.getSettings();
    const slides = [...settings.heroSlides];
    const idx = slides.findIndex((s) => s.id === slide.id);
    if (idx >= 0) {
      slides[idx] = slide;
    } else {
      slides.push(slide);
    }
    this.saveSettings({ ...settings, heroSlides: slides });
  },

  deleteHeroSlide(id: string): void {
    const settings = this.getSettings();
    const slides = settings.heroSlides.filter((s) => s.id !== id);
    this.saveSettings({ ...settings, heroSlides: slides });
  },

  reorderHeroSlides(slides: HeroSlide[]): void {
    const settings = this.getSettings();
    this.saveSettings({ ...settings, heroSlides: slides });
  },

  // PROMOTIONAL BANNER
  getPromoBanner(): PromoBannerConfig {
    return this.getSettings().promoBanner;
  },

  savePromoBanner(promo: PromoBannerConfig): void {
    const settings = this.getSettings();
    this.saveSettings({ ...settings, promoBanner: promo });
  },

  // HOMEPAGE SECTIONS
  getHomepageSections(): HomepageSectionItem[] {
    const settings = this.getSettings();
    return settings.homepageSections.sort((a, b) => a.order - b.order);
  },

  saveHomepageSections(sections: HomepageSectionItem[]): void {
    const settings = this.getSettings();
    this.saveSettings({ ...settings, homepageSections: sections });
  },

  // LOGO SETTINGS
  getLogoSettings(): LogoSettings {
    return this.getSettings().logo;
  },

  saveLogoSettings(logo: LogoSettings): void {
    const settings = this.getSettings();
    this.saveSettings({ ...settings, logo });
  },

  // NEW ARRIVALS
  getNewArrivals(): Product[] {
    const products = this.getPublicProducts();
    // Return products tagged isNewArrival or newest products
    const tagged = products.filter((p) => p.isNewArrival);
    if (tagged.length >= 4) return tagged;
    // Otherwise sort by createdAt descending
    return [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  toggleProductFeatured(productId: string): boolean {
    const products = this.getProducts();
    const p = products.find((prod) => prod.id === productId);
    if (p) {
      p.isFeatured = !p.isFeatured;
      setItem(KEYS.PRODUCTS, products);
      return p.isFeatured;
    }
    return false;
  },

  toggleProductNewArrival(productId: string): boolean {
    const products = this.getProducts();
    const p = products.find((prod) => prod.id === productId);
    if (p) {
      p.isNewArrival = !p.isNewArrival;
      setItem(KEYS.PRODUCTS, products);
      return !!p.isNewArrival;
    }
    return false;
  },

  reorderCategories(categoryIds: string[]): void {
    const categories = this.getCategories();
    categoryIds.forEach((id, idx) => {
      const cat = categories.find((c) => c.id === id);
      if (cat) cat.order = idx + 1;
    });
    setItem(KEYS.CATEGORIES, categories);
  },

  // USERS
  getUsers(): User[] {
    return getItem<User[]>(KEYS.USERS, initialUsers);
  },

  saveUser(user: User): void {
    const list = this.getUsers();
    const idx = list.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      list[idx] = user;
    } else {
      list.push(user);
    }
    setItem(KEYS.USERS, list);
    saveUserToSupabase(user).catch(() => {});
  },

  // ACTIVE USER & DEVICE ISOLATION
  getActiveUser(): User | null {
    try {
      const raw = localStorage.getItem(KEYS.ACTIVE_USER) || sessionStorage.getItem(KEYS.ACTIVE_USER);
      if (!raw) return null;
      const user = JSON.parse(raw);
      // Auto-purge legacy demo sessions per requirements so shared URLs open in clean Guest Mode
      if (
        user?.email === 'priya@example.com' ||
        user?.email === 'rajesh.kannan@example.com' ||
        user?.id === 'cust-1' ||
        user?.id === 'cust-2'
      ) {
        localStorage.removeItem(KEYS.ACTIVE_USER);
        sessionStorage.removeItem(KEYS.ACTIVE_USER);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  },

  setActiveUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(KEYS.ACTIVE_USER);
      sessionStorage.removeItem(KEYS.ACTIVE_USER);
    } else {
      localStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(user));
    }
    notifyListeners();
  },

  registerCustomer(params: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    address?: import('../types').Address;
  }): User {
    const users = this.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === params.email.trim().toLowerCase());
    if (existing) {
      if (params.password) existing.password = params.password;
      if (params.phone) existing.phone = params.phone;
      if (params.address) {
        existing.addresses = [params.address, ...(existing.addresses || []).filter((a) => a.id !== params.address!.id)];
      }
      this.saveUser(existing);
      this.setActiveUser(existing);
      return existing;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newUser: User = {
      id: `cust-${Date.now()}-${randomSuffix}`,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      phone: params.phone?.trim(),
      role: 'customer',
      password: params.password,
      addresses: params.address ? [params.address] : [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.saveUser(newUser);
    this.setActiveUser(newUser);
    return newUser;
  },

  // SUPABASE ASYNC SYNC & REAL-TIME REFRESH
  async initSupabaseSync(): Promise<void> {
    try {
      // 1. Purge legacy demo sessions on initial page load per requirements
      const currentActive = localStorage.getItem(KEYS.ACTIVE_USER);
      if (currentActive) {
        try {
          const parsed = JSON.parse(currentActive);
          if (
            parsed?.email === 'priya@example.com' ||
            parsed?.email === 'rajesh.kannan@example.com' ||
            parsed?.id === 'cust-1'
          ) {
            localStorage.removeItem(KEYS.ACTIVE_USER);
          }
        } catch {}
      }

      // 2. Check connection and auto-seed Supabase if tables are newly created and empty
      await autoSeedSupabaseIfEmpty({
        products: initialProducts,
        categories: initialCategories,
        coupons: initialCoupons,
        settings: initialStoreSettings,
      });

      // 3. Fetch remote updates
      const [remoteProducts, remoteCategories, remoteOrders, remoteUsers, remoteCoupons, remoteSettings] =
        await Promise.all([
          fetchProductsFromSupabase(),
          fetchCategoriesFromSupabase(),
          fetchOrdersFromSupabase(),
          fetchUsersFromSupabase(),
          fetchCouponsFromSupabase(),
          fetchSettingsFromSupabase(),
        ]);

      if (remoteProducts && remoteProducts.length > 0) {
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(remoteProducts));
      }
      if (remoteCategories && remoteCategories.length > 0) {
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(remoteCategories));
      }
      if (remoteOrders && remoteOrders.length > 0) {
        localStorage.setItem(KEYS.ORDERS, JSON.stringify(remoteOrders));
      }
      if (remoteUsers && remoteUsers.length > 0) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(remoteUsers));
      }
      if (remoteCoupons && remoteCoupons.length > 0) {
        localStorage.setItem(KEYS.COUPONS, JSON.stringify(remoteCoupons));
      }
      if (remoteSettings) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(remoteSettings));
      }

      notifyListeners();
    } catch (err) {
      console.warn('Supabase sync note (using resilient local cache):', err);
    }
  },

  // WISHLIST
  getWishlist(): string[] {
    return getItem<string[]>(KEYS.WISHLIST, ['prod-kanchi-maroon']);
  },

  toggleWishlist(productId: string): boolean {
    const list = this.getWishlist();
    const idx = list.indexOf(productId);
    let added = false;
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(productId);
      added = true;
    }
    setItem(KEYS.WISHLIST, list);
    return added;
  },

  // REVIEWS
  addReview(productId: string, review: Omit<Product['reviews'][0], 'id' | 'date'>): void {
    const products = this.getProducts();
    const pIdx = products.findIndex((p) => p.id === productId);
    if (pIdx >= 0) {
      const prod = products[pIdx];
      const newReview = {
        ...review,
        id: `rev-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
      };
      prod.reviews = [newReview, ...(prod.reviews || [])];
      prod.reviewCount = prod.reviews.length;
      const totalStars = prod.reviews.reduce((acc, r) => acc + r.rating, 0);
      prod.rating = Number((totalStars / prod.reviews.length).toFixed(1));
      setItem(KEYS.PRODUCTS, products);
    }
  },

  deleteReview(productId: string, reviewId: string): void {
    const products = this.getProducts();
    const pIdx = products.findIndex((p) => p.id === productId);
    if (pIdx >= 0) {
      const prod = products[pIdx];
      prod.reviews = (prod.reviews || []).filter((r) => r.id !== reviewId);
      prod.reviewCount = prod.reviews.length;
      if (prod.reviews.length > 0) {
        const totalStars = prod.reviews.reduce((acc, r) => acc + r.rating, 0);
        prod.rating = Number((totalStars / prod.reviews.length).toFixed(1));
      } else {
        prod.rating = 5.0;
      }
      setItem(KEYS.PRODUCTS, products);
    }
  },

  // Reset to initial seed data
  resetToDefaults(): void {
    localStorage.clear();
    setItem(KEYS.PRODUCTS, initialProducts);
    setItem(KEYS.CATEGORIES, initialCategories);
    setItem(KEYS.SUPPLIERS, initialSuppliers);
    setItem(KEYS.COURIERS, initialCouriers);
    setItem(KEYS.COUPONS, initialCoupons);
    setItem(KEYS.BANNERS, initialBanners);
    setItem(KEYS.ORDERS, initialOrders);
    setItem(KEYS.USERS, initialUsers);
    setItem(KEYS.SETTINGS, initialStoreSettings);
    setItem(KEYS.MEDIA, initialMediaItems);
  },
};

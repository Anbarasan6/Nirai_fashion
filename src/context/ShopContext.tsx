import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Language,
  User,
  CartItem,
  Product,
  ProductVariant,
  Coupon,
  StoreSettings,
} from '../types';
import { StorageService, subscribeToStore } from '../services/storage';
import { getT } from '../data/translations';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ShopContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ReturnType<typeof getT>;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAdmin: boolean;
  viewMode: 'storefront' | 'admin';
  setViewMode: (mode: 'storefront' | 'admin') => void;
  adminTab: 'dashboard' | 'homepage' | 'media' | 'products' | 'categories' | 'orders' | 'inventory' | 'suppliers' | 'couriers' | 'coupons' | 'content' | 'customers';
  setAdminTab: (tab: 'dashboard' | 'homepage' | 'media' | 'products' | 'categories' | 'orders' | 'inventory' | 'suppliers' | 'couriers' | 'coupons' | 'content' | 'customers') => void;
  
  // Auth Modal
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  logout: () => void;
  
  // Navigation / Pages in Storefront
  activeTab: 'home' | 'catalog' | 'pdp' | 'cart' | 'checkout' | 'orders' | 'tracking' | 'account' | 'blueprint';
  setActiveTab: (tab: 'home' | 'catalog' | 'pdp' | 'cart' | 'checkout' | 'orders' | 'tracking' | 'account' | 'blueprint') => void;
  selectedProductSlug: string | null;
  openProduct: (slug: string) => void;
  openPdp: (slug: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  trackingOrderId: string | null;
  setTrackingOrderId: (id: string | null) => void;
  openTracking: (orderId?: string) => void;
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  updateCartQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  
  // Pricing & Free Delivery
  cartSubtotal: number;
  cartItemCount: number;
  freeShippingThreshold: number;
  isFreeShipping: boolean;
  amountNeededForFreeShipping: number;
  shippingFee: number;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  couponDiscount: number;
  cartGrandTotal: number;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Search & Global state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toasts: ToastItem[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  storeSettings: StoreSettings;
  products: Product[];
  refreshData: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const users = StorageService.getUsers();
    return users.find((u) => u.role === 'customer') || null;
  });
  const [viewMode, setViewMode] = useState<'storefront' | 'admin'>('storefront');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'homepage' | 'media' | 'products' | 'categories' | 'orders' | 'inventory' | 'suppliers' | 'couriers' | 'coupons' | 'content' | 'customers'>('dashboard');
  const [activeTab, _setActiveTab] = useState<'home' | 'catalog' | 'pdp' | 'cart' | 'checkout' | 'orders' | 'tracking' | 'account' | 'blueprint'>('home');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  const setActiveTab = (tab: 'home' | 'catalog' | 'pdp' | 'cart' | 'checkout' | 'orders' | 'tracking' | 'account' | 'blueprint') => {
    _setActiveTab(tab);
    switch (tab) {
      case 'home':
        navigate('/');
        break;
      case 'catalog':
        navigate('/catalog');
        break;
      case 'cart':
        navigate('/cart');
        break;
      case 'checkout':
        navigate('/checkout');
        break;
      case 'orders':
      case 'tracking':
        navigate('/tracking');
        break;
      case 'account':
        navigate('/account');
        break;
    }
  };

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Signed out of account', 'info');
  };

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('nirai_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Wishlist & Store
  const [wishlist, setWishlist] = useState<string[]>(() => StorageService.getWishlist());
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => StorageService.getSettings());
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nirai_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Subscribe to storage changes across the app
  const refreshData = () => {
    setProducts(StorageService.getProducts());
    setStoreSettings(StorageService.getSettings());
    setWishlist(StorageService.getWishlist());
  };

  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      refreshData();
    });
    return unsubscribe;
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'staff';

  // Navigation helpers
  const openProduct = (slug: string) => {
    setSelectedProductSlug(slug);
    _setActiveTab('pdp');
    navigate(`/product/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openTracking = (orderId?: string) => {
    if (orderId) {
      setTrackingOrderId(orderId);
      navigate(`/tracking/${orderId}`);
    } else {
      navigate('/tracking');
    }
    _setActiveTab('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations
  const addToCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    const selectedVariant = variant || product.variants[0] || {
      id: 'default',
      name: 'Standard',
      sku: product.sku,
      stock: product.stock,
    };

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.variantId === selectedVariant.id
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            variantId: selectedVariant.id,
            quantity,
            product,
            selectedVariant,
          },
        ];
      }
    });

    showToast(`${product.nameEn} added to shopping bag!`, 'success');
  };

  const updateCartQuantity = (productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string, variantId: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variantId === variantId))
    );
    showToast('Item removed from shopping bag', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Pricing calculations
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + (item.product.finalPrice || item.product.basePrice) * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const freeShippingThreshold = storeSettings.freeShippingThreshold || 1500;
  const isFreeShipping = cartSubtotal >= freeShippingThreshold;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const shippingFee = cart.length === 0 ? 0 : isFreeShipping ? 0 : storeSettings.standardShippingFee || 120;

  // Coupon handling
  const applyCoupon = (code: string) => {
    const res = StorageService.validateCoupon(code, cartSubtotal);
    if (!res.valid || !res.coupon) {
      return { success: false, message: res.error || 'Invalid coupon code' };
    }
    setAppliedCoupon(res.coupon);
    showToast(`Coupon ${res.coupon.code} applied successfully!`, 'success');
    return { success: true, message: 'Coupon applied successfully' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      const calculated = (cartSubtotal * appliedCoupon.discountValue) / 100;
      couponDiscount = appliedCoupon.maxDiscountAmount
        ? Math.min(calculated, appliedCoupon.maxDiscountAmount)
        : calculated;
    } else {
      couponDiscount = appliedCoupon.discountValue;
    }
  }

  const cartGrandTotal = Math.max(0, cartSubtotal - couponDiscount + shippingFee);

  // Wishlist
  const toggleWishlist = (productId: string) => {
    const isAdded = StorageService.toggleWishlist(productId);
    setWishlist(StorageService.getWishlist());
    showToast(isAdded ? 'Added to Wishlist' : 'Removed from Wishlist', 'info');
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const t = getT(language);

  return (
    <ShopContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentUser,
        setCurrentUser,
        isAdmin,
        viewMode,
        setViewMode,
        adminTab,
        setAdminTab,
        activeTab,
        setActiveTab,
        selectedProductSlug,
        openProduct,
        openPdp: openProduct,
        selectedCategory,
        setSelectedCategory,
        trackingOrderId,
        setTrackingOrderId,
        openTracking,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartSubtotal,
        cartItemCount,
        freeShippingThreshold,
        isFreeShipping,
        amountNeededForFreeShipping,
        shippingFee,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        couponDiscount,
        cartGrandTotal,
        wishlist,
        toggleWishlist,
        isInWishlist,
        searchQuery,
        setSearchQuery,
        toasts,
        showToast,
        storeSettings,
        products,
        refreshData,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        openAuthModal,
        logout,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

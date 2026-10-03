import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, Category, Order, Coupon, StoreSettings, CartItem, Language } from '../types';
import { StorageService } from '../services/storage';
import { getTranslation } from '../translations';

interface ShopContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: any, params?: Record<string, string | number>) => string;
  
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selected_variant?: string) => void;
  removeFromCart: (productId: string, selected_variant?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, selected_variant?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  categories: Category[];
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  coupons: Coupon[];

  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;

  refreshData: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>(StorageService.getCategories());
  const [products, setProducts] = useState<Product[]>(StorageService.getProducts());
  const [orders, setOrders] = useState<Order[]>(StorageService.getOrders());
  const [settings, setSettings] = useState<StoreSettings>(StorageService.getSettings());
  const [coupons, setCoupons] = useState<Coupon[]>(StorageService.getCoupons());
  
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
      setCategories([...StorageService.getCategories()]);
      setProducts([...StorageService.getProducts()]);
      setOrders([...StorageService.getOrders()]);
      setSettings({ ...StorageService.getSettings() });
      setCoupons([...StorageService.getCoupons()]);
    });
    return () => unsubscribe();
  }, []);

  const refreshData = async () => {
    await StorageService.syncWithSupabase();
  };

  const t = (key: any, params?: Record<string, string | number>) => {
    return getTranslation(language, key, params);
  };

  const addToCart = (product: Product, quantity = 1, selected_variant?: string) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && item.selected_variant === selected_variant
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, quantity, selected_variant }];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, selected_variant?: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.selected_variant === selected_variant)));
  };

  const updateCartQuantity = (productId: string, quantity: number, selected_variant?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selected_variant);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.selected_variant === selected_variant) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.discount_price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) return prev.filter(p => p.id !== product.id);
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p.id === productId);
  };

  const applyCoupon = (code: string) => {
    const coupon = StorageService.getCouponByCode(code);
    if (!coupon) {
      return { success: false, message: t('couponInvalid') };
    }
    if (cartTotal < coupon.min_order_amount) {
      return { success: false, message: `Minimum order amount of ₹${coupon.min_order_amount} required.` };
    }
    setAppliedCoupon(coupon);
    return { success: true, message: t('couponApplied') };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = Math.round((cartTotal * appliedCoupon.discount_value) / 100);
      if (appliedCoupon.max_discount_amount && discountAmount > appliedCoupon.max_discount_amount) {
        discountAmount = appliedCoupon.max_discount_amount;
      }
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
  }

  const shippingFee = cartTotal > 2999 || cartTotal === 0 ? 0 : 150;
  const grandTotal = Math.max(0, cartTotal - discountAmount + shippingFee);

  return (
    <ShopContext.Provider value={{
      language,
      setLanguage,
      t,
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartTotal,
      cartCount,
      wishlist,
      toggleWishlist,
      isInWishlist,
      isCartOpen,
      setIsCartOpen,
      categories,
      products,
      orders,
      settings,
      coupons,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      discountAmount,
      shippingFee,
      grandTotal,
      refreshData
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};

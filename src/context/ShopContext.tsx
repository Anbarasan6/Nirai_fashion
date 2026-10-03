import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, Category, Order, Coupon, StoreSettings, CartItem, Language, User } from '../types';
import { StorageService } from '../services/storage';
import { getTranslation } from '../translations';

interface ShopContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: any, params?: Record<string, string | number>) => string;
  
  user: User | null;
  loginUser: (email: string, name?: string) => void;
  registerUser: (name: string, email: string, phone: string) => void;
  logoutUser: () => void;

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
  checkPincodeDelivery: (pincode: string) => { available: boolean; estimatedDate: string };
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('nirai_customer_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

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

  const loginUser = (email: string, name?: string) => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      role: 'customer',
      created_at: new Date().toISOString()
    };
    setUser(newUser);
    localStorage.setItem('nirai_customer_user', JSON.stringify(newUser));
  };

  const registerUser = (name: string, email: string, phone: string) => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email,
      name,
      phone,
      role: 'customer',
      created_at: new Date().toISOString()
    };
    setUser(newUser);
    localStorage.setItem('nirai_customer_user', JSON.stringify(newUser));
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('nirai_customer_user');
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

  const checkPincodeDelivery = (pincode: string) => {
    const cleanPin = pincode.trim();
    if (cleanPin.length === 6 && /^\d+$/.test(cleanPin)) {
      const date = new Date();
      date.setDate(date.getDate() + 3);
      return {
        available: true,
        estimatedDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      };
    }
    return { available: false, estimatedDate: '' };
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
      user,
      loginUser,
      registerUser,
      logoutUser,
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
      refreshData,
      checkPincodeDelivery
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

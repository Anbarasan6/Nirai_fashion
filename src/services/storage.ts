import type { Product, Category, Order, Customer, Coupon, StoreSettings } from '../types';
import { supabase } from './supabase';

// High-resolution handloom saree seed categories
const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat_elampillai',
    name_en: 'Elampillai Soft Silks',
    name_ta: 'இளம்பிள்ளை சாஃப்ட் பட்டு',
    slug: 'elampillai-silks',
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    description_en: 'Traditional Salem Elampillai soft silks with exquisite peacock zari motifs.',
    description_ta: 'நேர்த்தியான ஜரி உருவங்களுடன் பாரம்பரிய இளம்பிள்ளை சாஃப்ட் சில்க்ஸ்.',
    is_active: true
  },
  {
    id: 'cat_kanchipuram',
    name_en: 'Kanchipuram Bridal Silks',
    name_ta: 'காஞ்சிபுரம் பிரைடல் பட்டு',
    slug: 'kanchipuram-silks',
    image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
    description_en: 'Authentic 3-ply heavy mulberry pure silk Kanchipuram heritage sarees.',
    description_ta: 'உண்மையான கனரக தூய பட்டு காஞ்சிபுரம் திருமண பட்டு புடவைகள்.',
    is_active: true
  },
  {
    id: 'cat_softsilk',
    name_en: 'Featherlight Soft Silks',
    name_ta: 'லைட்வெயிட் சாஃப்ட் சில்க்ஸ்',
    slug: 'soft-silks',
    image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    description_en: 'Lightweight, feather-touch soft silks for modern daylong elegance.',
    description_ta: 'நவீன நேர்த்திக்கு இலகுரக, மென்மையான தொடுதல் சாஃப்ட் சில்க்ஸ்.',
    is_active: true
  },
  {
    id: 'cat_dhoti',
    name_en: 'Pure Silk Dhotis',
    name_ta: 'தூய பட்டு வேஷ்டி செட்',
    slug: 'silk-dhotis',
    image_url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
    description_en: 'Traditional Mayilkan zari border pure silk dhotis with angavastram.',
    description_ta: 'திருமணங்களுக்கு பாரம்பரிய மயில் கண் ஜரி பார்டர் தூய பட்டு வேஷ்டிகள்.',
    is_active: true
  }
];

// Rich Sample Products with Working High-Res Images
const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    sku: 'NIR-ELM-001',
    slug: 'royal-maroon-elampillai-soft-silk',
    name_en: 'Royal Maroon Elampillai Soft Silk',
    name_ta: 'ராயல் மரூன் இளம்பிள்ளை சாஃப்ட் சில்க்',
    description_en: 'Exquisite maroon soft silk saree with intricate peacock gold zari weaving and matching blouse piece.',
    description_ta: 'சிக்கலான மயில் ஜரி நெசவு மற்றும் பொருத்தமான ரவிக்கை துண்டுடன் கூடிய நேர்த்தியான மரூன் சாஃப்ட் சில்க் சேலை.',
    category_id: 'cat_elampillai',
    price: 4999,
    discount_price: 3999,
    fabric_type: 'Elampillai Soft Silk',
    is_in_stock: true,
    stock_quantity: 12,
    is_featured: true,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80'
    ],
    variants: [
      { color: 'Royal Maroon', color_code: '#4A0E17', stock: 8 },
      { color: 'Emerald Green', color_code: '#0B6623', stock: 4 }
    ]
  },
  {
    id: 'prod_2',
    sku: 'NIR-KNC-002',
    slug: 'golden-yellow-kanchipuram-bridal-silk',
    name_en: 'Golden Yellow Kanchipuram Bridal Silk',
    name_ta: 'கோல்டன் மஞ்சள் காஞ்சிபுரம் பிரைடல் பட்டு',
    description_en: 'Pure 3-ply silk Kanchipuram saree featuring full Korvai borders and rich gold pallu.',
    description_ta: 'தூய 3-பிளை சில்க் காஞ்சிபுரம் புடவை, கோர்வை பார்டர்கள் மற்றும் பணக்கார தங்க பல்லு கொண்டது.',
    category_id: 'cat_kanchipuram',
    price: 18999,
    discount_price: 15999,
    fabric_type: 'Pure Kanchipuram Silk',
    is_in_stock: true,
    stock_quantity: 5,
    is_featured: true,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80'
    ],
    variants: [
      { color: 'Golden Yellow', color_code: '#D4AF37', stock: 3 },
      { color: 'Crimson Red', color_code: '#800020', stock: 2 }
    ]
  },
  {
    id: 'prod_3',
    sku: 'NIR-SFT-003',
    slug: 'pastel-pink-lightweight-soft-silk',
    name_en: 'Pastel Pink Lightweight Soft Silk',
    name_ta: 'பாஸ்டல் பிங்க் லைட்வெயிட் சாஃப்ட் சில்க்',
    description_en: 'Featherlight soft silk saree with subtle silver zari border, perfect for daytime celebrations.',
    description_ta: 'நுட்பமான வெள்ளி ஜரி பார்டருடன் கூடிய இறகுப் போன்ற சாஃப்ட் சில்க் சேலை, பகல் நேர கொண்டாட்டங்களுக்கு ஏற்றது.',
    category_id: 'cat_softsilk',
    price: 3499,
    discount_price: 2799,
    fabric_type: 'Soft Silk',
    is_in_stock: true,
    stock_quantity: 18,
    is_featured: true,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80'
    ],
    variants: [
      { color: 'Pastel Pink', color_code: '#FFB6C1', stock: 10 },
      { color: 'Sky Blue', color_code: '#87CEEB', stock: 8 }
    ]
  },
  {
    id: 'prod_4',
    sku: 'NIR-DHT-004',
    slug: 'mayilkan-zari-border-pure-silk-dhoti-set',
    name_en: 'Mayilkan Zari Border Pure Silk Dhoti Set',
    name_ta: 'மயில்கண் ஜரி பார்டர் தூய பட்டு வேஷ்டி செட்',
    description_en: 'Pure silk dhoti with matching angavastram towel featuring classic Mayilkan gold zari borders.',
    description_ta: 'கிளாசிக் மயில்கண் தங்க ஜரி பார்டர்களுடன் கூடிய தூய பட்டு வேஷ்டி மற்றும் அங்‌கவஸ்திரம் டவல்.',
    category_id: 'cat_dhoti',
    price: 2999,
    discount_price: 2499,
    fabric_type: 'Pure Mulberry Silk',
    is_in_stock: true,
    stock_quantity: 20,
    is_featured: false,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80'
    ],
    variants: [
      { color: 'Off White / Gold', color_code: '#FDFBF7', stock: 20 }
    ]
  },
  {
    id: 'prod_5',
    sku: 'NIR-ELM-005',
    slug: 'peacock-blue-elampillai-soft-silk',
    name_en: 'Peacock Blue Elampillai Soft Silk',
    name_ta: 'மயில் நீல இளம்பிள்ளை சாஃப்ட் சில்க்',
    description_en: 'Vibrant peacock blue soft silk saree with traditional temple zari border and pallu.',
    description_ta: 'பாரம்பரிய கோவில் ஜரி பார்டர் மற்றும் பல்லு கொண்ட தெளிவான மயில் நீல சாஃப்ட் சில்க் சேலை.',
    category_id: 'cat_elampillai',
    price: 5499,
    discount_price: 4499,
    fabric_type: 'Elampillai Soft Silk',
    is_in_stock: true,
    stock_quantity: 10,
    is_featured: true,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80'
    ],
    variants: [
      { color: 'Peacock Blue', color_code: '#005F73', stock: 10 }
    ]
  },
  {
    id: 'prod_6',
    sku: 'NIR-KNC-006',
    slug: 'deep-crimson-red-kanchipuram-heritage-silk',
    name_en: 'Deep Crimson Red Kanchipuram Heritage Silk',
    name_ta: 'ஆழ்ந்த சிவப்பு காஞ்சிபுரம் பாரம்பரிய பட்டு',
    description_en: 'Grand wedding red Kanchipuram silk saree with rich mango zari motifs and tissue pallu.',
    description_ta: 'பணக்கார மாம்பழ ஜரி உருவங்கள் கொண்ட திருமண சிவப்பு காஞ்சிபுரம் பட்டு சேலை.',
    category_id: 'cat_kanchipuram',
    price: 22999,
    discount_price: 18999,
    fabric_type: 'Pure Kanchipuram Silk',
    is_in_stock: true,
    stock_quantity: 4,
    is_featured: true,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80'
    ],
    variants: [
      { color: 'Crimson Red', color_code: '#800020', stock: 4 }
    ]
  }
];

const SEED_SETTINGS: StoreSettings = {
  id: 'store_settings',
  store_name: 'NIRAI Handloom Silks',
  upi_id: 'nirai@upi',
  upi_name: 'NIRAI HANDLOOMS',
  qr_code_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
  bank_details: {
    bankName: 'State Bank of India',
    accountName: 'NIRAI HANDLOOM SILKS',
    accountNumber: '40982310492',
    ifscCode: 'SBIN0001824',
    branch: 'Elampillai Main Branch'
  },
  contact_phone: '+91 98765 43210',
  contact_email: 'support@niraifashions.com',
  announcement_en: '✦ Festival Handloom Sale! Flat 15% OFF on orders above ₹4,999 — Code: SILK15 ✦',
  announcement_ta: '✦ பட்டுப் சேலைகளுக்கு சிறப்பு தள்ளுபடி! ₹4,999க்கு மேல் 15% தள்ளுபடி — Code: SILK15 ✦'
};

const SEED_COUPONS: Coupon[] = [
  {
    id: 'coup_silk15',
    code: 'SILK15',
    discount_type: 'percentage',
    discount_value: 15,
    min_order_amount: 4999,
    is_active: true
  },
  {
    id: 'coup_welcome',
    code: 'NIRAI500',
    discount_type: 'fixed',
    discount_value: 500,
    min_order_amount: 2999,
    is_active: true
  }
];

class MemoryStoreService {
  private categories: Category[] = [...SEED_CATEGORIES];
  private products: Product[] = [...SEED_PRODUCTS];
  private orders: Order[] = [];
  private customers: Customer[] = [];
  private coupons: Coupon[] = [...SEED_COUPONS];
  private settings: StoreSettings = { ...SEED_SETTINGS };
  private listeners: (() => void)[] = [];

  constructor() {
    this.cleanLocalStorage();
    this.syncWithSupabase();
  }

  private cleanLocalStorage() {
    try {
      const keysToClean = ['products', 'categories', 'orders', 'users', 'coupons', 'settings'];
      keysToClean.forEach(key => localStorage.removeItem(key));
    } catch {
      // Ignore
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // Synchronize In-Memory Cache with Supabase cleanly
  public async syncWithSupabase() {
    try {
      // Fetch Categories
      const { data: catData } = await supabase.from('categories').select('*');
      if (catData && catData.length > 0) {
        this.categories = catData.map(c => ({
          id: c.id,
          name_en: c.name_en,
          name_ta: c.name_ta || c.name_en,
          slug: c.slug,
          image_url: c.image_url,
          description_en: c.description_en,
          description_ta: c.description_ta,
          is_active: c.is_active ?? true
        }));
      }

      // Fetch Products
      const { data: prodData } = await supabase.from('products').select('*');
      if (prodData && prodData.length > 0) {
        this.products = prodData.map(p => ({
          id: p.id,
          sku: p.sku,
          slug: p.slug,
          name_en: p.name_en,
          name_ta: p.name_ta || p.name_en,
          description_en: p.description_en,
          description_ta: p.description_ta,
          category_id: p.category_id,
          price: Number(p.price),
          discount_price: p.discount_price ? Number(p.discount_price) : undefined,
          fabric_type: p.fabric_type || 'Pure Silk',
          is_in_stock: p.is_in_stock ?? true,
          stock_quantity: p.stock_quantity ?? 10,
          is_featured: p.is_featured ?? false,
          is_new_arrival: p.is_new_arrival ?? false,
          images: Array.isArray(p.images) ? p.images : (typeof p.images === 'string' ? JSON.parse(p.images) : []),
          variants: Array.isArray(p.variants) ? p.variants : (typeof p.variants === 'string' ? JSON.parse(p.variants) : [])
        }));
      }

      // Fetch Orders
      const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (orderData && orderData.length > 0) {
        this.orders = orderData.map(o => ({
          id: o.id,
          order_number: o.order_number,
          customer_id: o.customer_id,
          customer_name: o.customer_name,
          phone: o.phone,
          email: o.email,
          shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address,
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
          subtotal: Number(o.subtotal),
          discount: Number(o.discount || 0),
          shipping_fee: Number(o.shipping_fee || 0),
          total_amount: Number(o.total_amount),
          status: o.status || 'PENDING',
          payment_status: o.payment_status || 'UNPAID',
          payment_method: o.payment_method || 'UPI_QR',
          utr_number: o.utr_number,
          utr_proof_url: o.utr_proof_url,
          notes: o.notes,
          created_at: o.created_at
        }));
      }

      this.notify();
    } catch {
      // Operating in memory mode
    }
  }

  // Clear All Data / Reset Data
  public async clearAllData() {
    this.products = [];
    this.orders = [];
    this.customers = [];
    this.coupons = [];
    this.notify();

    try {
      await supabase.from('orders').delete().neq('id', '0');
      await supabase.from('products').delete().neq('id', '0');
      await supabase.from('customers').delete().neq('id', '0');
      await supabase.from('coupons').delete().neq('id', '0');
    } catch {
      // Ignore
    }
  }

  public async restoreSampleData() {
    this.categories = [...SEED_CATEGORIES];
    this.products = [...SEED_PRODUCTS];
    this.coupons = [...SEED_COUPONS];
    this.settings = { ...SEED_SETTINGS };
    this.orders = [];
    this.customers = [];
    this.notify();
  }

  // Category Operations
  public getCategories(): Category[] {
    return this.categories;
  }

  public async saveCategory(category: Category) {
    const existingIdx = this.categories.findIndex(c => c.id === category.id);
    if (existingIdx >= 0) {
      this.categories[existingIdx] = category;
    } else {
      this.categories.push(category);
    }
    this.notify();

    try {
      await supabase.from('categories').upsert({
        id: category.id,
        name_en: category.name_en,
        name_ta: category.name_ta,
        slug: category.slug,
        image_url: category.image_url,
        description_en: category.description_en,
        description_ta: category.description_ta,
        is_active: category.is_active ?? true
      });
    } catch {
      // Memory fallback
    }
  }

  // Product Operations
  public getProducts(): Product[] {
    return this.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id || p.slug === id);
  }

  public async saveProduct(product: Product) {
    const existingIdx = this.products.findIndex(p => p.id === product.id);
    if (existingIdx >= 0) {
      this.products[existingIdx] = product;
    } else {
      this.products.unshift(product);
    }
    this.notify();

    try {
      await supabase.from('products').upsert({
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name_en: product.name_en,
        name_ta: product.name_ta,
        description_en: product.description_en,
        description_ta: product.description_ta,
        category_id: product.category_id,
        price: product.price,
        discount_price: product.discount_price,
        fabric_type: product.fabric_type,
        is_in_stock: product.is_in_stock,
        stock_quantity: product.stock_quantity,
        is_featured: product.is_featured,
        is_new_arrival: product.is_new_arrival,
        images: JSON.stringify(product.images),
        variants: JSON.stringify(product.variants)
      });
    } catch {
      // Memory fallback
    }
  }

  public async deleteProduct(id: string) {
    this.products = this.products.filter(p => p.id !== id);
    this.notify();
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch {
      // Memory fallback
    }
  }

  // Order Operations
  public getOrders(): Order[] {
    return this.orders;
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.find(o => o.id === id || o.order_number.toLowerCase() === id.toLowerCase());
  }

  public async createOrder(orderData: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    const id = 'ord_' + Date.now() + Math.random().toString(36).substring(2, 6);
    const newOrder: Order = {
      ...orderData,
      id,
      created_at: new Date().toISOString()
    };

    this.orders.unshift(newOrder);
    this.notify();

    await this.syncCustomerFromOrder(newOrder);

    try {
      await supabase.from('orders').insert({
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_id: newOrder.customer_id,
        customer_name: newOrder.customer_name,
        phone: newOrder.phone,
        email: newOrder.email,
        shipping_address: JSON.stringify(newOrder.shipping_address),
        items: JSON.stringify(newOrder.items),
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        shipping_fee: newOrder.shipping_fee,
        total_amount: newOrder.total_amount,
        status: newOrder.status,
        payment_status: newOrder.payment_status,
        payment_method: newOrder.payment_method,
        utr_number: newOrder.utr_number,
        utr_proof_url: newOrder.utr_proof_url,
        notes: newOrder.notes,
        created_at: newOrder.created_at
      });
    } catch {
      // Memory fallback
    }

    return newOrder;
  }

  public async updateOrderStatus(id: string, status: Order['status'], payment_status?: Order['payment_status']) {
    const order = this.orders.find(o => o.id === id);
    if (order) {
      order.status = status;
      if (payment_status) order.payment_status = payment_status;
      this.notify();

      try {
        await supabase.from('orders').update({
          status,
          payment_status: order.payment_status
        }).eq('id', id);
      } catch {
        // Memory fallback
      }
    }
  }

  // Customers
  public getCustomers(): Customer[] {
    return this.customers;
  }

  private async syncCustomerFromOrder(order: Order) {
    const existingCust = this.customers.find(c => c.phone === order.phone);
    if (existingCust) {
      existingCust.total_orders = (existingCust.total_orders || 1) + 1;
      existingCust.total_spent = (existingCust.total_spent || 0) + order.total_amount;
    } else {
      const newCust: Customer = {
        id: 'cust_' + Date.now(),
        name: order.customer_name,
        email: order.email,
        phone: order.phone,
        address: order.shipping_address,
        total_orders: 1,
        total_spent: order.total_amount,
        created_at: new Date().toISOString()
      };
      this.customers.push(newCust);
      try {
        await supabase.from('customers').insert({
          id: newCust.id,
          name: newCust.name,
          email: newCust.email,
          phone: newCust.phone,
          address: JSON.stringify(newCust.address)
        });
      } catch {
        // Memory fallback
      }
    }
  }

  // Coupons
  public getCoupons(): Coupon[] {
    return this.coupons;
  }

  public getCouponByCode(code: string): Coupon | undefined {
    return this.coupons.find(c => c.code.toLowerCase() === code.trim().toLowerCase() && c.is_active);
  }

  public async saveCoupon(coupon: Coupon) {
    const idx = this.coupons.findIndex(c => c.id === coupon.id);
    if (idx >= 0) this.coupons[idx] = coupon;
    else this.coupons.push(coupon);
    this.notify();
    try {
      await supabase.from('coupons').upsert({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_amount: coupon.min_order_amount,
        is_active: coupon.is_active
      });
    } catch {
      // Memory fallback
    }
  }

  // Settings
  public getSettings(): StoreSettings {
    return this.settings;
  }

  public async updateSettings(settings: StoreSettings) {
    this.settings = settings;
    this.notify();
    try {
      await supabase.from('settings').upsert({
        id: 'store_settings',
        store_name: settings.store_name,
        upi_id: settings.upi_id,
        upi_name: settings.upi_name,
        qr_code_url: settings.qr_code_url,
        bank_details: JSON.stringify(settings.bank_details),
        contact_phone: settings.contact_phone,
        contact_email: settings.contact_email,
        announcement_en: settings.announcement_en,
        announcement_ta: settings.announcement_ta
      });
    } catch {
      // Memory fallback
    }
  }
}

export const StorageService = new MemoryStoreService();

/**
 * Direct Supabase Database Integration & Real-Time Sync
 * Production Supabase URL: https://lqzrahjmgzdsbosywjju.supabase.co
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Category, Order, User, Coupon, StoreSettings } from '../types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key')
);

// Initialize Supabase Client
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

let isConnectedCache: boolean | null = null;

/**
 * Health-check Supabase connectivity
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured) {
    isConnectedCache = false;
    return false;
  }
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && !error.message.includes('0 rows')) {
      // Table might not exist yet or permission denied
      console.warn('Supabase products check note:', error.message);
    }
    isConnectedCache = true;
    return true;
  } catch (err) {
    console.warn('Supabase offline or unreachable, falling back to local store:', err);
    isConnectedCache = false;
    return false;
  }
}

/**
 * PRODUCTS SYNC
 */
export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  try {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      sku: row.sku,
      nameEn: row.name_en,
      nameTa: row.name_ta || '',
      slug: row.slug,
      descriptionEn: row.description_en || '',
      descriptionTa: row.description_ta || '',
      shortDescEn: row.short_desc_en || '',
      shortDescTa: row.short_desc_ta || '',
      categoryId: row.category_id,
      subCategoryId: row.sub_category_id,
      brand: row.brand || 'Nirai',
      fabric: row.fabric || '',
      material: row.material || '',
      style: row.style || '',
      careInstructionsEn: row.care_instructions_en || '',
      careInstructionsTa: row.care_instructions_ta || '',
      basePrice: Number(row.base_price) || 0,
      regularDiscount: Number(row.regular_discount) || 0,
      specialDiscount: Number(row.special_discount) || 0,
      finalPrice: Number(row.final_price) || 0,
      stock: Number(row.stock) || 0,
      lowStockThreshold: Number(row.low_stock_threshold) || 5,
      isFeatured: Boolean(row.is_featured),
      isNewArrival: Boolean(row.is_new_arrival),
      isActive: row.is_active !== false,
      images: Array.isArray(row.images) ? row.images : [],
      variants: Array.isArray(row.variants) ? row.variants : [],
      rating: Number(row.rating) || 5.0,
      reviewCount: Number(row.review_count) || 0,
      reviews: Array.isArray(row.reviews) ? row.reviews : [],
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('Error fetching products from Supabase:', e);
    return null;
  }
}

export async function saveProductToSupabase(product: Product): Promise<boolean> {
  try {
    const row = {
      id: product.id,
      sku: product.sku,
      name_en: product.nameEn,
      name_ta: product.nameTa,
      slug: product.slug,
      description_en: product.descriptionEn,
      description_ta: product.descriptionTa,
      short_desc_en: product.shortDescEn,
      short_desc_ta: product.shortDescTa,
      category_id: product.categoryId,
      sub_category_id: product.subCategoryId || null,
      brand: product.brand,
      fabric: product.fabric,
      material: product.material,
      style: product.style,
      care_instructions_en: product.careInstructionsEn,
      care_instructions_ta: product.careInstructionsTa,
      base_price: product.basePrice,
      regular_discount: product.regularDiscount,
      special_discount: product.specialDiscount,
      final_price: product.finalPrice,
      stock: product.stock,
      low_stock_threshold: product.lowStockThreshold,
      is_featured: product.isFeatured,
      is_new_arrival: product.isNewArrival,
      is_active: product.isActive,
      images: product.images,
      variants: product.variants,
      rating: product.rating,
      review_count: product.reviewCount,
      reviews: product.reviews,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('products').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase product upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to save product to Supabase:', err);
    return false;
  }
}

export async function deleteProductFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * CATEGORIES SYNC
 */
export async function fetchCategoriesFromSupabase(): Promise<Category[] | null> {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      nameEn: row.name_en,
      nameTa: row.name_ta || '',
      level: row.level || 1,
      parentId: row.parent_id,
      image: row.image || '',
      descriptionEn: row.description_en || '',
      descriptionTa: row.description_ta || '',
      isActive: row.is_active !== false,
      itemCount: Number(row.item_count) || 0,
      order: Number(row.display_order) || 0,
    }));
  } catch (e) {
    console.warn('Error fetching categories from Supabase:', e);
    return null;
  }
}

export async function saveCategoryToSupabase(category: Category): Promise<boolean> {
  try {
    const row = {
      id: category.id,
      slug: category.slug,
      name_en: category.nameEn,
      name_ta: category.nameTa,
      level: category.level,
      parent_id: category.parentId || null,
      image: category.image,
      description_en: category.descriptionEn,
      description_ta: category.descriptionTa,
      is_active: category.isActive,
      item_count: category.itemCount || 0,
      display_order: category.order || 0,
    };
    const { error } = await supabase.from('categories').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCategoryFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * ORDERS SYNC
 */
export async function fetchOrdersFromSupabase(): Promise<Order[] | null> {
  try {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      customerId: row.customer_id || '',
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      shippingAddress: row.shipping_address || {},
      items: row.items || [],
      subtotal: Number(row.subtotal) || 0,
      discountAmount: Number(row.discount) || 0,
      shippingFee: Number(row.shipping_fee) || 0,
      freeShippingApplied: Boolean(row.shipping_fee === 0),
      grandTotal: Number(row.grand_total) || 0,
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      utrNumber: row.payment_details?.utrNumber,
      paymentProofUrl: row.payment_details?.paymentProofUrl,
      shippingDetails: row.shipping_details || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('Error fetching orders from Supabase:', e);
    return null;
  }
}

export async function saveOrderToSupabase(order: Order): Promise<boolean> {
  try {
    const row = {
      id: order.id,
      order_number: order.orderNumber,
      customer_id: order.customerId,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      items: order.items,
      subtotal: order.subtotal,
      shipping_fee: order.shippingFee,
      discount: order.discountAmount,
      grand_total: order.grandTotal,
      status: order.status,
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      payment_details: {
        utrNumber: order.utrNumber,
        paymentProofUrl: order.paymentProofUrl,
      },
      shipping_details: order.shippingDetails || {},
      shipping_address: order.shippingAddress,
      created_at: order.createdAt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase order upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to save order to Supabase:', err);
    return false;
  }
}

/**
 * USERS & CUSTOMERS SYNC
 * Dual-table support with automatic fallback between 'users' and 'customers'
 */
export async function fetchUsersFromSupabase(): Promise<User[] | null> {
  try {
    // Try users table first
    let res = await supabase.from('users').select('*');
    if (res.error || !res.data) {
      // Fallback to customers table
      res = await supabase.from('customers').select('*');
    }
    if (res.error || !res.data) return null;

    return res.data.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role || 'customer',
      password: row.password,
      addresses: Array.isArray(row.addresses) ? row.addresses : [],
      isActive: row.is_active !== false,
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('Error fetching users from Supabase:', e);
    return null;
  }
}

export async function saveUserToSupabase(user: User): Promise<boolean> {
  try {
    const row = {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      phone: user.phone || null,
      role: user.role || 'customer',
      password: user.password || null,
      addresses: user.addresses || [],
      is_active: user.isActive,
      updated_at: new Date().toISOString(),
    };

    // Upsert into users
    const res1 = await supabase.from('users').upsert(row, { onConflict: 'id' });

    // Also mirror to customers table if role is customer for schema resilience
    if (user.role === 'customer') {
      try {
        await supabase.from('customers').upsert(row, { onConflict: 'id' });
      } catch {
        // optional table
      }
    }

    return !res1.error;
  } catch (err) {
    console.warn('Failed to save user to Supabase:', err);
    return false;
  }
}

/**
 * COUPONS SYNC
 */
export async function fetchCouponsFromSupabase(): Promise<Coupon[] | null> {
  try {
    const { data, error } = await supabase.from('coupons').select('*');
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      code: row.code,
      description: row.description || '',
      discountType: (row.discount_type === 'fixed' || row.discount_type === 'FIXED') ? 'FIXED' : 'PERCENTAGE',
      discountValue: Number(row.discount_value) || 0,
      minOrderAmount: Number(row.min_order_amount) || 0,
      maxDiscountAmount: row.max_discount ? Number(row.max_discount) : undefined,
      validUntil: row.expiry_date || new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: row.is_active !== false,
      usageCount: Number(row.usage_count) || 0,
    }));
  } catch {
    return null;
  }
}

export async function saveCouponToSupabase(coupon: Coupon): Promise<boolean> {
  try {
    const row = {
      id: coupon.id,
      code: coupon.code.toUpperCase().trim(),
      description: coupon.description,
      discount_type: coupon.discountType.toLowerCase(),
      discount_value: coupon.discountValue,
      min_order_amount: coupon.minOrderAmount,
      max_discount: coupon.maxDiscountAmount || null,
      expiry_date: coupon.validUntil,
      is_active: coupon.isActive,
      usage_count: coupon.usageCount || 0,
    };
    const { error } = await supabase.from('coupons').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCouponFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * SETTINGS SYNC
 */
export async function fetchSettingsFromSupabase(): Promise<StoreSettings | null> {
  try {
    const { data, error } = await supabase.from('settings').select('*').limit(1).single();
    if (error || !data) return null;

    return {
      storeName: data.store_name || 'Nirai',
      taglineEn: data.tagline_en || '',
      taglineTa: data.tagline_ta || '',
      logo: data.logo || {},
      heroSlides: data.hero_slides || [],
      promoBanner: data.promo_banner || {},
      homepageSections: data.homepage_sections || [],
      freeShippingThreshold: Number(data.free_shipping_threshold) || 1500,
      standardShippingFee: Number(data.standard_shipping_fee) || 120,
      shippingRules: data.shipping_rules || {
        tamilNaduStandard: 80,
        tamilNaduExpress: 160,
        indiaStandard: 120,
        indiaExpress: 220,
      },
      announcementEn: data.announcement_en || '',
      announcementTa: data.announcement_ta || '',
      supportPhone: data.support_phone || '+91 44 2498 7654',
      supportEmail: data.support_email || 'care@nirai.in',
      isAnnouncementActive: data.is_announcement_active !== false,
      bankDetails: data.bank_details || {
        bankName: 'HDFC Bank',
        accountName: 'NIRAI HANDLOOMS PRIVATE LIMITED',
        accountNumber: '50200088992211',
        ifscCode: 'HDFC0001244',
        branch: 'Cathedral Road, Chennai',
      },
      upiDetails: data.upi_details || {
        upiId: 'niraihandlooms@hdfcbank',
        merchantName: 'Nirai Handlooms',
        qrCodeNote: 'Scan & Pay with GPay, PhonePe or Paytm',
      },
    };
  } catch {
    return null;
  }
}

export async function saveSettingsToSupabase(settings: StoreSettings): Promise<boolean> {
  try {
    const row = {
      id: 'nirai_main_settings',
      store_name: settings.storeName,
      tagline_en: settings.taglineEn,
      tagline_ta: settings.taglineTa,
      logo: settings.logo,
      hero_slides: settings.heroSlides,
      promo_banner: settings.promoBanner,
      homepage_sections: settings.homepageSections,
      free_shipping_threshold: settings.freeShippingThreshold,
      standard_shipping_fee: settings.standardShippingFee,
      shipping_rules: settings.shippingRules,
      announcement_en: settings.announcementEn,
      announcement_ta: settings.announcementTa,
      is_announcement_active: settings.isAnnouncementActive,
      bank_details: settings.bankDetails,
      upi_details: settings.upiDetails,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('settings').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * AUTO-SEEDING: Seed initial catalog products, categories, coupons, and settings
 * if database tables are empty on mount.
 */
export async function autoSeedSupabaseIfEmpty(initialData: {
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  settings: StoreSettings;
}): Promise<void> {
  try {
    // 1. Check products count
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if (!error && (count === 0 || count === null)) {
      console.log('🌱 Seeding products into Supabase...');
      for (const p of initialData.products) {
        await saveProductToSupabase(p);
      }
    }

    // 2. Check categories count
    const catCheck = await supabase.from('categories').select('*', { count: 'exact', head: true });
    if (!catCheck.error && (catCheck.count === 0 || catCheck.count === null)) {
      console.log('🌱 Seeding categories into Supabase...');
      for (const c of initialData.categories) {
        await saveCategoryToSupabase(c);
      }
    }

    // 3. Check settings
    const setCheck = await supabase.from('settings').select('id').limit(1);
    if (!setCheck.error && (!setCheck.data || setCheck.data.length === 0)) {
      console.log('🌱 Seeding store settings into Supabase...');
      await saveSettingsToSupabase(initialData.settings);
    }
  } catch (err) {
    console.warn('Auto-seed check note:', err);
  }
}

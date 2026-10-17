/**
 * Direct Supabase Database Integration & Real-Time Sync
 * Sole source of truth for products, categories, orders, coupons, settings,
 * suppliers, couriers, stock movements, media, reviews, and wishlists.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import {
  Product,
  Category,
  Order,
  User,
  Coupon,
  StoreSettings,
  Supplier,
  CourierPartner,
  MediaItem,
  StockMovement,
  ProductReview,
  PaginatedResult,
  OrderStatus,
  CartQuote,
  PlaceOrderPayload,
  TrackingResult,
} from '../types';

export const SUPABASE_URL = env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key')
);

// Initialize Supabase Client with persistent authentication
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
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
      console.warn('Supabase products check note:', error.message);
    }
    isConnectedCache = true;
    return true;
  } catch (err) {
    console.warn('Supabase offline or unreachable:', err);
    isConnectedCache = false;
    return false;
  }
}

// ==============================================================================
// 1. PRODUCTS & CATALOG (Server-side Pagination & Filtering)
// ==============================================================================

export interface FetchProductsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  includeInactive?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

function mapProductRow(row: any): Product {
  return {
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
    reviews: [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export async function fetchProductsPaginated(
  options: FetchProductsOptions = {}
): Promise<PaginatedResult<Product>> {
  const {
    page = 1,
    pageSize = 12,
    search,
    categoryId,
    isFeatured,
    isNewArrival,
    includeInactive = false,
    sortBy = 'newest',
  } = options;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (categoryId && categoryId !== 'all') {
      query = query.or(`category_id.eq.${categoryId},sub_category_id.eq.${categoryId}`);
    }

    if (isFeatured !== undefined) {
      query = query.eq('is_featured', isFeatured);
    }

    if (isNewArrival !== undefined) {
      query = query.eq('is_new_arrival', isNewArrival);
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      query = query.or(`name_en.ilike.%${term}%,name_ta.ilike.%${term}%,description_en.ilike.%${term}%,sku.ilike.%${term}%`);
    }

    // Sort order
    switch (sortBy) {
      case 'price-asc':
        query = query.order('final_price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('final_price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error querying products:', error.message);
      return { data: [], totalCount: 0, page, pageSize, totalPages: 0, error: error.message };
    }

    const totalCount = count || 0;
    const products = (data || []).map(mapProductRow);

    return {
      data: products,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (err: any) {
    console.error('Unexpected error fetching products:', err);
    return { data: [], totalCount: 0, page, pageSize, totalPages: 0, error: err.message };
  }
}

export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  const result = await fetchProductsPaginated({ page: 1, pageSize: 100, includeInactive: true });
  return result.error ? null : result.data;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return mapProductRow(data);
  } catch {
    return null;
  }
}

export async function saveProductToSupabase(product: Product): Promise<boolean> {
  try {
    const row = {
      id: product.id,
      sku: product.sku,
      name_en: product.nameEn,
      name_ta: product.nameTa || null,
      slug: product.slug,
      description_en: product.descriptionEn,
      description_ta: product.descriptionTa || null,
      short_desc_en: product.shortDescEn || null,
      short_desc_ta: product.shortDescTa || null,
      category_id: product.categoryId,
      sub_category_id: product.subCategoryId || null,
      brand: product.brand || 'Nirai',
      fabric: product.fabric || null,
      material: product.material || null,
      style: product.style || null,
      care_instructions_en: product.careInstructionsEn || null,
      care_instructions_ta: product.careInstructionsTa || null,
      base_price: product.basePrice,
      regular_discount: product.regularDiscount || 0,
      special_discount: product.specialDiscount || 0,
      final_price: product.finalPrice,
      stock: product.stock,
      low_stock_threshold: product.lowStockThreshold || 5,
      is_featured: product.isFeatured || false,
      is_new_arrival: product.isNewArrival || false,
      is_active: product.isActive !== false,
      images: product.images,
      variants: product.variants,
      rating: product.rating || 5.0,
      review_count: product.reviewCount || 0,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('products').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 2. CATEGORIES
// ==============================================================================

export async function fetchCategoriesFromSupabase(includeInactive = false): Promise<Category[] | null> {
  try {
    let query = supabase.from('categories').select('*').order('display_order', { ascending: true });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
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
      itemCount: row.item_count || 0,
    }));
  } catch {
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
      parent_id: category.parentId,
      image: category.image,
      description_en: category.descriptionEn,
      description_ta: category.descriptionTa,
      is_active: category.isActive,
      item_count: category.itemCount || 0,
    };
    const { error } = await supabase.from('categories').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCategoryFromSupabase(categoryId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 3. ORDERS (Paginated, Verified, and Status Tracked)
// ==============================================================================

export interface FetchOrdersOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  customerId?: string;
}

export async function fetchOrdersPaginated(
  options: FetchOrdersOptions = {}
): Promise<PaginatedResult<Order>> {
  const { page = 1, pageSize = 15, status, search, customerId } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      query = query.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%,customer_email.ilike.%${term}%`);
    }

    query = query.range(from, to);
    const { data, count, error } = await query;

    if (error) {
      return { data: [], totalCount: 0, page, pageSize, totalPages: 0, error: error.message };
    }

    const totalCount = count || 0;
    const orders: Order[] = (data || []).map((row: any) => ({
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

    return {
      data: orders,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (err: any) {
    return { data: [], totalCount: 0, page, pageSize, totalPages: 0, error: err.message };
  }
}

export async function fetchOrdersFromSupabase(): Promise<Order[] | null> {
  const res = await fetchOrdersPaginated({ page: 1, pageSize: 100 });
  return res.error ? null : res.data;
}

export async function saveOrderToSupabase(order: Order): Promise<{ success: boolean; error?: string }> {
  try {
    const row = {
      id: order.id,
      order_number: order.orderNumber,
      customer_id: order.customerId && order.customerId.trim() !== '' ? order.customerId : null,
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
      console.error('Order save error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  status: OrderStatus
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 4. COUPONS
// ==============================================================================

export async function fetchCouponsFromSupabase(): Promise<Coupon[] | null> {
  try {
    const { data, error } = await supabase.from('coupons').select('*');
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      code: row.code,
      description: row.description || '',
      discountType: (row.discount_type?.toUpperCase() === 'FIXED' ? 'FIXED' : 'PERCENTAGE') as any,
      discountValue: Number(row.discount_value) || 0,
      minOrderAmount: Number(row.min_order_amount) || 0,
      maxDiscountAmount: row.max_discount ? Number(row.max_discount) : undefined,
      validUntil: row.expiry_date || new Date(Date.now() + 8640000000).toISOString(),
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
    };
    const { error } = await supabase.from('coupons').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCouponFromSupabase(couponId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('coupons').delete().eq('id', couponId);
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 5. STORE SETTINGS (Public Settings View & Admin Settings Table)
// ==============================================================================

export async function fetchSettingsFromSupabase(): Promise<StoreSettings | null> {
  try {
    // Attempt reading public_settings view (available to public and authenticated)
    let { data, error } = await supabase.from('public_settings').select('*').limit(1).single();

    if (error || !data) {
      // Fallback to direct settings table
      const res = await supabase.from('settings').select('*').limit(1).single();
      data = res.data;
    }

    if (!data) return null;

    return {
      storeName: data.store_name || 'Nirai',
      taglineEn: data.tagline_en || '',
      taglineTa: data.tagline_ta || '',
      logo: data.logo || { altText: 'Nirai Traditional Handlooms' },
      heroSlides: Array.isArray(data.hero_slides) ? data.hero_slides : [],
      promoBanner: data.promo_banner || {},
      homepageSections: Array.isArray(data.homepage_sections) ? data.homepage_sections : [],
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
      supportPhone: '+91 44 2498 7654',
      supportEmail: 'care@nirai.in',
      isAnnouncementActive: data.is_announcement_active !== false,
      bankDetails: data.bank_details,
      upiDetails: data.upi_details,
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

// ==============================================================================
// 6. SUPPLIERS & COURIER PARTNERS
// ==============================================================================

export async function fetchSuppliersFromSupabase(): Promise<Supplier[] | null> {
  try {
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error || !data) return null;
    return data.map((s: any) => ({
      id: s.id,
      name: s.name,
      contactPerson: s.contact_person,
      phone: s.phone,
      email: s.email,
      city: s.city,
      state: s.state,
      leadTimeDays: s.lead_time_days || 7,
      isActive: s.is_active !== false,
      notes: s.notes,
    }));
  } catch {
    return null;
  }
}

export async function saveSupplierToSupabase(s: Supplier): Promise<boolean> {
  try {
    const row = {
      id: s.id,
      name: s.name,
      contact_person: s.contactPerson,
      phone: s.phone,
      email: s.email,
      city: s.city,
      state: s.state,
      lead_time_days: s.leadTimeDays,
      is_active: s.isActive,
      notes: s.notes,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('suppliers').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSupplierFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchCouriersFromSupabase(): Promise<CourierPartner[] | null> {
  try {
    const { data, error } = await supabase.from('courier_partners').select('*');
    if (error || !data) return null;
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      phone: c.phone,
      email: c.email,
      deliveryDays: c.delivery_days,
      coverage: c.coverage,
      trackingUrlTemplate: c.tracking_url_template,
      badgeText: c.badge_text,
      isActive: c.is_active !== false,
      notes: c.notes,
    }));
  } catch {
    return null;
  }
}

export async function saveCourierToSupabase(c: CourierPartner): Promise<boolean> {
  try {
    const row = {
      id: c.id,
      name: c.name,
      code: c.code,
      phone: c.phone,
      email: c.email,
      delivery_days: c.deliveryDays,
      coverage: c.coverage,
      tracking_url_template: c.trackingUrlTemplate,
      badge_text: c.badgeText,
      is_active: c.isActive,
      notes: c.notes,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('courier_partners').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCourierFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('courier_partners').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 7. STOCK MOVEMENTS (Audited via DB Trigger & RPC)
// ==============================================================================

export async function fetchStockMovementsFromSupabase(
  productId?: string,
  limit = 50
): Promise<StockMovement[]> {
  try {
    let query = supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((m: any) => ({
      id: m.id,
      productId: m.product_id,
      productName: '',
      sku: '',
      type: m.change_amount >= 0 ? 'RESTOCK' : 'DISPATCH',
      quantityDelta: m.change_amount,
      previousStock: m.previous_stock,
      newStock: m.new_stock,
      reason: m.reason || 'Inventory Adjustment',
      performedBy: m.performed_by || 'Staff',
      timestamp: m.created_at,
    }));
  } catch {
    return [];
  }
}

export async function adjustStockViaRpc(
  productId: string,
  delta: number,
  reason: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('adjust_product_stock', {
      p_product_id: productId,
      p_delta: delta,
      p_reason: reason,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// 8. MEDIA LIBRARY
// ==============================================================================

export async function fetchMediaItemsFromSupabase(category?: string): Promise<MediaItem[]> {
  try {
    let query = supabase.from('media_library').select('*').order('created_at', { ascending: false });
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((m: any) => ({
      id: m.id,
      url: m.secure_url || m.url,
      publicId: m.public_id,
      filename: m.public_id.split('/').pop() || 'image',
      fileSize: m.bytes || 0,
      width: m.width,
      height: m.height,
      format: m.format || 'jpg',
      category: m.category || 'general',
      altText: m.alt_text,
      createdAt: m.created_at,
    }));
  } catch {
    return [];
  }
}

export async function saveMediaItemToSupabase(item: {
  url: string;
  secureUrl: string;
  publicId: string;
  folder?: string;
  category?: string;
  altText?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}): Promise<boolean> {
  try {
    const row = {
      url: item.url,
      secure_url: item.secureUrl,
      public_id: item.publicId,
      folder: item.folder || 'nirai/media',
      category: item.category || 'general',
      alt_text: item.altText,
      width: item.width,
      height: item.height,
      format: item.format,
      bytes: item.bytes,
    };
    const { error } = await supabase.from('media_library').upsert(row, { onConflict: 'public_id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteMediaItemFromSupabase(publicId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('media_library').delete().eq('public_id', publicId);
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 9. VERIFIED REVIEWS
// ==============================================================================

export async function fetchProductReviews(productId: string): Promise<ProductReview[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      userId: r.user_id,
      customerName: r.user_name || 'Verified Customer',
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      date: r.created_at,
      verifiedPurchase: Boolean(r.verified_purchase),
    }));
  } catch {
    return [];
  }
}

export async function submitProductReview(review: {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Please sign in to submit a product review.' };
    }

    const row = {
      product_id: review.productId,
      user_id: user.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
    };

    const { error } = await supabase.from('reviews').insert(row);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// 10. WISHLISTS & GUEST WISHLIST MERGE
// ==============================================================================

export async function fetchUserWishlist(): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id);

    if (error || !data) return [];
    return data.map((w: any) => w.product_id);
  } catch {
    return [];
  }
}

export async function toggleWishlistInSupabase(productId: string): Promise<{ isInWishlist: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isInWishlist: false };

  // Check if exists
  const { data } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (data) {
    await supabase.from('wishlists').delete().eq('id', data.id);
    return { isInWishlist: false };
  } else {
    await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
    return { isInWishlist: true };
  }
}

export async function syncGuestWishlistRpc(guestProductIds: string[]): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('sync_guest_wishlist', {
      p_product_ids: guestProductIds,
    });
    if (error || !data) return guestProductIds;
    return data;
  } catch {
    return guestProductIds;
  }
}

// ==============================================================================
// 11. USERS & PROFILES (Paginated for Admin)
// ==============================================================================

export async function fetchCustomersPaginated(
  options: { page?: number; pageSize?: number; search?: string } = {}
): Promise<PaginatedResult<User>> {
  const { page = 1, pageSize = 15, search } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (search && search.trim() !== '') {
      const term = search.trim();
      query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);
    const { data, count, error } = await query;

    if (error) {
      return { data: [], totalCount: 0, page, pageSize, totalPages: 0, error: error.message };
    }

    const totalCount = count || 0;
    const users: User[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name || 'Customer',
      email: '',
      phone: row.phone,
      role: row.role || 'customer',
      addresses: [],
      isActive: row.is_active !== false,
      createdAt: row.created_at || new Date().toISOString(),
    }));

    return {
      data: users,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (err: any) {
    return { data: [], totalCount: 0, page, pageSize, totalPages: 0, error: err.message };
  }
}

export async function fetchUsersFromSupabase(): Promise<User[] | null> {
  const res = await fetchCustomersPaginated({ page: 1, pageSize: 100 });
  return res.error ? null : res.data;
}

export async function fetchProfileFromSupabase(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    const { data: addressRows } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId);

    const addresses = (addressRows || []).map((a: any) => ({
      id: a.id,
      fullName: a.full_name,
      phone: a.phone,
      street: a.street_address,
      landmark: a.landmark || undefined,
      city: a.city,
      state: a.state,
      pincode: a.postal_code,
      isDefault: a.is_default,
    }));

    return {
      id: data.id,
      name: data.name || 'Customer',
      email: '',
      phone: data.phone || undefined,
      role: data.role || 'customer',
      addresses,
      isActive: data.is_active !== false,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.warn('Error loading profile from Supabase:', err);
    return null;
  }
}

export async function saveUserToSupabase(user: User): Promise<boolean> {
  try {
    const profileRow = {
      id: user.id,
      name: user.name,
      phone: user.phone || null,
      role: user.role || 'customer',
      is_active: user.isActive,
      updated_at: new Date().toISOString(),
    };

    const res = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' });
    return !res.error;
  } catch (err) {
    console.warn('Failed to save user profile to Supabase:', err);
    return false;
  }
}

// ==============================================================================
// 12. SERVER-SIDE ORDER ENGINE (Secure RPCs)
// ==============================================================================

export async function quoteCartViaRpc(
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>,
  couponCode?: string,
  pincode?: string
): Promise<{ success: boolean; data?: CartQuote; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('quote_cart', {
      p_items: items,
      p_coupon_code: couponCode?.trim() || null,
      p_pincode: pincode?.trim() || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data || data.success === false) {
      return { success: false, error: data?.error || 'Unable to quote cart' };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Cart quote request failed' };
  }
}

export async function placeOrderViaRpc(
  payload: PlaceOrderPayload
): Promise<{ success: boolean; data?: { orderId: string; orderNumber: string; idempotentReplay?: boolean }; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('place_order', {
      p_payload: payload,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data || data.success === false) {
      return { success: false, error: data?.error || 'Order placement failed' };
    }

    return {
      success: true,
      data: {
        orderId: data.order_id,
        orderNumber: data.order_number,
        idempotentReplay: data.idempotent_replay,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Order placement transaction failed' };
  }
}

export async function trackOrderViaRpc(
  orderNumber: string,
  phone: string
): Promise<{ success: boolean; data?: TrackingResult; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('track_order', {
      p_order_number: orderNumber.trim(),
      p_phone: phone.trim(),
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data || data.success === false) {
      return { success: false, error: data?.error || 'No matching order found' };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Order tracking request failed' };
  }
}

export async function updateOrderStatusViaRpc(
  orderId: string,
  newStatus: OrderStatus,
  paymentStatus?: string,
  shippingDetails?: any,
  notes?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('update_order_status', {
      p_order_id: orderId,
      p_new_status: newStatus,
      p_payment_status: paymentStatus || null,
      p_shipping_details: shippingDetails || null,
      p_notes: notes || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data || data.success === false) {
      return { success: false, error: data?.error || 'Failed to update order status' };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Status transition failed' };
  }
}

export async function cancelOrderViaRpc(
  orderId: string,
  reason?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('cancel_order', {
      p_order_id: orderId,
      p_reason: reason || 'Customer requested cancellation',
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data || data.success === false) {
      return { success: false, error: data?.error || 'Order cancellation failed' };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Cancellation request failed' };
  }
}


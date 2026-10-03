export type Language = 'en' | 'ta';

export interface ProductVariant {
  id?: string;
  color: string;
  color_code?: string;
  stock: number;
  price?: number;
  image?: string;
}

export interface Product {
  id: string;
  sku?: string;
  slug: string;
  name_en: string;
  name_ta?: string;
  description_en?: string;
  description_ta?: string;
  category_id?: string;
  price: number;
  discount_price?: number;
  fabric_type?: string;
  is_in_stock: boolean;
  stock_quantity: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  images: string[];
  variants: ProductVariant[];
  badge?: 'NEW' | 'BESTSELLER' | 'SALE' | 'LIMITED STOCK';
  rating?: number;
  review_count?: number;
  created_at?: string;
}

export interface Category {
  id: string;
  name_en: string;
  name_ta?: string;
  slug: string;
  image_url?: string;
  description_en?: string;
  description_ta?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface Address {
  id?: string;
  fullName?: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: Address;
  total_orders?: number;
  total_spent?: number;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  phone?: string;
  addresses?: Address[];
  created_at?: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  name_ta?: string;
  price: number;
  quantity: number;
  selected_variant?: string;
  image: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'VERIFYING' | 'PAID' | 'FAILED';
export type PaymentMethod = 'UPI_QR' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'NET_BANKING' | 'COD';

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  phone: string;
  email?: string;
  shipping_address: Address;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  utr_number?: string;
  utr_proof_url?: string;
  notes?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  valid_till?: string;
  is_active: boolean;
  created_at?: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  upi_id: string;
  upi_name: string;
  qr_code_url: string;
  bank_details: BankDetails;
  contact_phone: string;
  contact_email: string;
  announcement_en: string;
  announcement_ta: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected_variant?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  link?: string;
}

export interface ReviewItem {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  isVerifiedPurchase: boolean;
  userPhoto?: string;
}

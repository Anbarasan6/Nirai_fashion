# Production-Readiness Audit & Architecture Analysis: Nirai E-Commerce Platform

**Audit Timestamp:** 2026-10-17  
**Auditor Role:** Senior Full-Stack Production Readiness Auditor  
**Audit Scope:** Full codebase scan (Routes, UI, Services, Database, Security, DevOps, Architecture)  
**Audit Type:** READ-ONLY Static & Runtime Verification  

---

## 1. TECH STACK

| Layer | Technology | Version | Notes / Reference |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^19.0.1` | Single Page Application (SPA), Functional Components, Hooks ([package.json:22](file:///d:/projects/Nirai_New/Nirai/package.json#L22)) |
| **Frontend Routing** | React Router DOM | `^7.18.4` | BrowserRouter, Routes, Route, useNavigate ([package.json:24](file:///d:/projects/Nirai_New/Nirai/package.json#L24)) |
| **Styling & CSS** | Tailwind CSS v4 | `^4.3.3` | `@tailwindcss/vite` plugin, vanilla CSS tokens ([package.json:16](file:///d:/projects/Nirai_New/Nirai/package.json#L16)) |
| **Icons & Animation** | Lucide React, Motion | `lucide-react@^0.546.0`, `motion@^12.23.24` | [package.json:20-21](file:///d:/projects/Nirai_New/Nirai/package.json#L20-L21) |
| **Build Tool & Bundler** | Vite | `^8.3.0` | Client environment bundling ([vite.config.ts](file:///d:/projects/Nirai_New/Nirai/vite.config.ts)) |
| **Language & Typings** | TypeScript | `^7.0.2` | Strict typings enabled ([tsconfig.json](file:///d:/projects/Nirai_New/Nirai/tsconfig.json)) |
| **Runtime Environment** | Node.js | `v26.4.0` (Active) | npm `11.17.0` |
| **Backend Framework** | NONE (Client-to-BaaS) | N/A | `express` is in [package.json:19](file:///d:/projects/Nirai_New/Nirai/package.json#L19) but completely unused in `src/` |
| **Database & BaaS** | Supabase (PostgreSQL) | `@supabase/supabase-js@^2.117.2` | Managed PostgreSQL with REST client ([supabase.ts](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts)) |
| **Local Fallback Storage** | Web Storage API (localStorage) | Native Browser API | `StorageService` with reactive event dispatch ([storage.ts](file:///d:/projects/Nirai_New/Nirai/src/services/storage.ts)) |
| **Authentication Method** | Custom Client State | N/A | Mock/in-memory user selection with localStorage sync; no JWT/session cookie |
| **Payment Gateway** | Manual UPI QR / Direct Bank Transfer | N/A | UTR number collection; mock credit card; no third-party PG SDK |
| **Email / SMS Service** | NONE | N/A | No email/SMS integration; notifications limited to in-app toasts & WhatsApp deep-link |
| **Media / Image Storage** | Cloudinary & Local Fallback | Unsigned HTTP REST | Direct client upload via unsigned preset; Base64 fallback ([cloudinary.ts](file:///d:/projects/Nirai_New/Nirai/src/services/cloudinary.ts)) |
| **Hosting & Deploy Config** | Static Web Hosting (SPA) | N/A | `vite build` outputs static SPA to `dist/` |

---

## 2. FOLDER STRUCTURE

```
d:\projects\Nirai_New\Nirai/
├── .env.example                     # Sample configuration and credentials template
├── index.html                       # SPA HTML entry point
├── package.json                     # Dependencies, scripts, and engine metadata
├── supabase-setup.sql               # Supabase PostgreSQL schema and permission script
├── tsconfig.json                    # TypeScript compiler options
├── vite.config.ts                   # Vite bundler, alias, and Tailwind plugins
└── src/
    ├── App.tsx                      # Top-level router layout, modal triggers, toast container
    ├── main.tsx                     # React DOM root bootstrapping
    ├── index.css                    # Tailwind imports and base styles
    ├── types/
    │   └── index.ts                 # Central domain models (Product, Order, User, Settings)
    ├── data/
    │   ├── initialData.ts           # Demo seed data (products, categories, banners, orders)
    │   └── translations.ts          # English and Tamil localized strings
    ├── services/
    │   ├── supabase.ts              # Supabase database client and table sync routines
    │   ├── storage.ts               # LocalStorage data persistence, stock log, fallback layer
    │   ├── cloudinary.ts            # Cloudinary unsigned file upload with Base64 fallback
    │   ├── mediaService.ts          # Media asset indexing and categorization
    │   └── translator.ts            # Rule-based English-to-Tamil terminology generator
    ├── context/
    │   └── ShopContext.tsx          # Global state provider (cart, auth, toast, currency, nav)
    ├── pages/
    │   ├── HomePage.tsx             # Storefront landing page
    │   ├── CatalogPage.tsx          # Product listing, search, category, and price filters
    │   ├── ProductDetailPage.tsx    # Single product view, size selection, reviews, add-to-cart
    │   ├── CartPage.tsx             # Full cart review and free shipping progress
    │   ├── CheckoutPage.tsx         # Delivery details, manual UPI payment, UTR verification
    │   ├── OrderTrackingPage.tsx    # 5-step live fulfillment tracker and order lookup
    │   ├── CustomerAccountPage.tsx  # Customer profile, orders, addresses, and wishlist
    │   ├── AboutPage.tsx            # Handloom heritage story
    │   ├── ContactPage.tsx          # Customer support contact details
    │   ├── PoliciesPage.tsx         # Shipping, returns, cancellation, terms & conditions
    │   ├── NotFoundPage.tsx         # 404 error page
    │   └── admin/
    │       └── AdminPages.tsx       # Dynamic router for administrative console modules
    └── components/
        ├── common/                  # Reusable UI (Header, Footer, Modals, Breadcrumbs, Toasts)
        ├── storefront/              # Storefront widgets (Hero, ProductCard, CartDrawer, Sections)
        └── admin/                   # Admin console modules (Products, Orders, Customers, Inventory, etc.)
```

---

## 3. USER ROLES & ACCESS CONTROL

### Role Definitions
Roles are defined in [`src/types/index.ts:3`](file:///d:/projects/Nirai_New/Nirai/src/types/index.ts#L3):
`export type UserRole = 'super_admin' | 'admin' | 'staff' | 'customer';`

1. **Guest (Unauthenticated)**:
   - Can browse homepage, catalog, product pages, policy pages, and tracking page.
   - Can add items to the cart (stored in `localStorage.nirai_cart`).
   - Can proceed through checkout as a guest or enter checkout details without signing in.
2. **Customer (`customer`)**:
   - Can view account page (`/account`), saved addresses, order history, and wishlist.
3. **Staff (`staff`)**:
   - Can view and manage inventory, update order shipping stages, and inspect catalog products.
4. **Admin (`admin`)**:
   - Access to Product Manager, Category Manager, Order Manager, Customer Manager, and Couriers.
5. **Super Admin (`super_admin`)**:
   - Full access to all admin management suites including Homepage Manager, Content & Settings, and Suppliers.

### Role Check Implementation (Frontend vs. Backend)
- **Frontend Checks**:
  - Located in [`src/components/admin/AdminLayout.tsx:38-43`](file:///d:/projects/Nirai_New/Nirai/src/components/admin/AdminLayout.tsx#L38-L43):
    ```typescript
    const isAuthorized = currentUser && (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'admin' ||
      currentUser.role === 'staff'
    );
    ```
  - Located in [`src/components/common/Header.tsx:308-319`](file:///d:/projects/Nirai_New/Nirai/src/components/common/Header.tsx#L308-L319) (shows Admin Console link only if role matches).
- **Backend Checks**:
  - **COMPLETELY MISSING**. There is no backend middleware or API gateway.
  - In Supabase ([`supabase-setup.sql:150-167`](file:///d:/projects/Nirai_New/Nirai/supabase-setup.sql#L150-L167)), Row Level Security (RLS) is disabled on all tables (`products`, `orders`, `users`, `settings`, `coupons`). The public `anon` role is granted `ALL` permissions.
  - Anyone with the public `VITE_SUPABASE_ANON_KEY` can perform full CRUD operations directly on the database via Postman or browser DevTools.

---

## 4. PAGES AND ROUTES TABLE

### Frontend Routes ([`src/App.tsx:37-61`](file:///d:/projects/Nirai_New/Nirai/src/App.tsx#L37-L61))

| Route | Page File | Access Level | Auth Guard Present? | Status / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `src/pages/HomePage.tsx` | Public | None | WORKS |
| `/catalog` | `src/pages/CatalogPage.tsx` | Public | None | WORKS |
| `/catalog/:categorySlug` | `src/pages/CatalogPage.tsx` | Public | None | WORKS |
| `/product/:slug` | `src/pages/ProductDetailPage.tsx` | Public | None | WORKS |
| `/cart` | `src/pages/CartPage.tsx` | Public | None | WORKS |
| `/checkout` | `src/pages/CheckoutPage.tsx` | Public | None | WORKS |
| `/tracking` | `src/pages/OrderTrackingPage.tsx` | Public | None | WORKS |
| `/tracking/:orderId` | `src/pages/OrderTrackingPage.tsx` | Public | None | WORKS |
| `/account` | `src/pages/CustomerAccountPage.tsx` | User / Customer | Partial (In-page Guest Fallback) | WORKS |
| `/about` | `src/pages/AboutPage.tsx` | Public | None | WORKS |
| `/contact` | `src/pages/ContactPage.tsx` | Public | None | WORKS |
| `/policies` | `src/pages/PoliciesPage.tsx` | Public | None | WORKS |
| `/privacy-policy` | `src/pages/PoliciesPage.tsx` | Public | None | WORKS |
| `/shipping-policy` | `src/pages/PoliciesPage.tsx` | Public | None | WORKS |
| `/refund-policy` | `src/pages/PoliciesPage.tsx` | Public | None | WORKS |
| `/return-policy` | `src/pages/PoliciesPage.tsx` | Public | None | WORKS |
| `/cancellation-policy` | `src/pages/PoliciesPage.tsx` | Public | None | WORKS |
| `/terms` | `src/pages/PoliciesPage.tsx` | Public | None | WORKS |
| `/terms-conditions` | `src/pages/PoliciesPage.tsx` | Public | None | WORKS |
| `/faq` | `src/pages/PoliciesPage.tsx` | Public | None | WORKS |
| `/admin` | `src/pages/admin/AdminPages.tsx` | Admin / Staff | In-component UI block only | **BYPASSABLE** (1-click test login in UI, zero password check) |
| `/admin/:tab` | `src/pages/admin/AdminPages.tsx` | Admin / Staff | In-component UI block only | **BYPASSABLE** (Tabs: dashboard, homepage, media, products, categories, orders, customers, inventory, suppliers, couriers, coupons, content) |
| `*` | `src/pages/NotFoundPage.tsx` | Public | None | WORKS (404 catch-all) |

### Backend API Endpoints
- **Custom Backend Controller Layer**: **NONE** (No custom Express or Node.js server routes).
- **Direct BaaS REST Endpoints** (Supabase PostgREST via `@supabase/supabase-js`):

| Method | Supabase Endpoint | Client Service Caller | Auth Required? | Input Validation Present? |
| :--- | :--- | :--- | :--- | :--- |
| `SELECT` | `/rest/v1/products` | `fetchProductsFromSupabase` ([supabase.ts:48](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L48)) | NO (anon allowed) | None |
| `UPSERT` | `/rest/v1/products` | `saveProductToSupabase` ([supabase.ts:94](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L94)) | NO (anon allowed) | TypeScript types only |
| `DELETE` | `/rest/v1/products?id=eq.{id}` | `deleteProductFromSupabase` ([supabase.ts:139](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L139)) | NO (anon allowed) | None |
| `SELECT` | `/rest/v1/categories` | `fetchCategoriesFromSupabase` ([supabase.ts:153](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L153)) | NO (anon allowed) | None |
| `UPSERT` | `/rest/v1/categories` | `saveCategoryToSupabase` ([supabase.ts:182](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L182)) | NO (anon allowed) | TypeScript types only |
| `DELETE` | `/rest/v1/categories?id=eq.{id}` | `deleteCategoryFromSupabase` ([supabase.ts:208](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L208)) | NO (anon allowed) | None |
| `SELECT` | `/rest/v1/orders` | `fetchOrdersFromSupabase` ([supabase.ts:222](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L222)) | NO (anon allowed) | None |
| `UPSERT` | `/rest/v1/orders` | `saveOrderToSupabase` ([supabase.ts:262](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L262)) | NO (anon allowed) | TypeScript types only |
| `SELECT` | `/rest/v1/users` | `fetchUsersFromSupabase` ([supabase.ts:303](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L303)) | NO (anon allowed) | None |
| `UPSERT` | `/rest/v1/users` | `saveUserToSupabase` ([supabase.ts:327](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L327)) | NO (anon allowed) | None |
| `SELECT` | `/rest/v1/coupons` | `fetchCouponsFromSupabase` ([supabase.ts:354](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L354)) | NO (anon allowed) | None |
| `UPSERT` | `/rest/v1/coupons` | `saveCouponToSupabase` ([supabase.ts:383](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L383)) | NO (anon allowed) | None |
| `SELECT` | `/rest/v1/settings` | `fetchSettingsFromSupabase` ([supabase.ts:413](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L413)) | NO (anon allowed) | None |
| `UPSERT` | `/rest/v1/settings` | `saveSettingsToSupabase` ([supabase.ts:456](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L456)) | NO (anon allowed) | None |

---

## 5. DATABASE ARCHITECTURE & SCHEMA AUDIT

Based on [`supabase-setup.sql`](file:///d:/projects/Nirai_New/Nirai/supabase-setup.sql):

### 1. `products` Table
- **Fields**: `id` (TEXT, PK), `sku` (TEXT, NOT NULL), `name_en` (TEXT, NOT NULL), `name_ta` (TEXT), `slug` (TEXT, UNIQUE, NOT NULL), `description_en` (TEXT), `description_ta` (TEXT), `short_desc_en` (TEXT), `short_desc_ta` (TEXT), `category_id` (TEXT), `sub_category_id` (TEXT), `brand` (TEXT), `fabric` (TEXT), `material` (TEXT), `style` (TEXT), `care_instructions_en` (TEXT), `care_instructions_ta` (TEXT), `base_price` (NUMERIC), `regular_discount` (NUMERIC), `special_discount` (NUMERIC), `final_price` (NUMERIC), `stock` (INTEGER), `low_stock_threshold` (INTEGER), `is_featured` (BOOLEAN), `is_new_arrival` (BOOLEAN), `is_active` (BOOLEAN), `images` (JSONB), `variants` (JSONB), `rating` (NUMERIC), `review_count` (INTEGER), `reviews` (JSONB), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Missing Constraints & Defects**:
  - No Foreign Key on `category_id` or `sub_category_id` referencing `categories(id)`.
  - `variants` and `reviews` are unindexed, unvalidated JSONB blobs. Modifying a single review or variant stock requires rewriting the entire record.
  - Missing composite index on `(is_active, category_id)` and `(is_featured, is_active)`.

### 2. `categories` Table
- **Fields**: `id` (TEXT, PK), `slug` (TEXT, UNIQUE, NOT NULL), `name_en` (TEXT, NOT NULL), `name_ta` (TEXT), `level` (INTEGER), `parent_id` (TEXT), `image` (TEXT), `description_en` (TEXT), `description_ta` (TEXT), `is_active` (BOOLEAN), `item_count` (INTEGER), `display_order` (INTEGER), `created_at` (TIMESTAMPTZ).
- **Missing Constraints**: No self-referencing foreign key on `parent_id REFERENCES categories(id) ON DELETE SET NULL`.

### 3. `orders` Table
- **Fields**: `id` (TEXT, PK), `order_number` (TEXT, UNIQUE, NOT NULL), `customer_id` (TEXT), `customer_name` (TEXT, NOT NULL), `customer_email` (TEXT, NOT NULL), `customer_phone` (TEXT, NOT NULL), `items` (JSONB, NOT NULL), `subtotal` (NUMERIC), `shipping_fee` (NUMERIC), `discount` (NUMERIC), `grand_total` (NUMERIC), `status` (TEXT), `payment_status` (TEXT), `payment_method` (TEXT), `payment_details` (JSONB), `shipping_details` (JSONB), `shipping_address` (JSONB), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Missing Constraints & Defects**:
  - No Foreign Key on `customer_id REFERENCES users(id)`.
  - `items` stored as JSONB with no relational integrity to `products(id)`. If a product is deleted, historical order integrity cannot be checked via relational joins.
  - No check constraint on `status` (e.g. `CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'))`).
  - No check constraint on `payment_status` (`CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded', 'PENDING_VERIFICATION'))`).

### 4. `users` and `customers` Tables
- **Fields**: `id` (TEXT, PK), `name` (TEXT, NOT NULL), `email` (TEXT, UNIQUE, NOT NULL), `phone` (TEXT), `role` (TEXT), `password` (TEXT), `addresses` (JSONB), `is_active` (BOOLEAN), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Missing Constraints & Defects**:
  - `customers` is a duplicate table created as a fallback view.
  - `password` column is plaintext TEXT with zero hashing or salt.

### 5. `coupons` Table
- **Fields**: `id` (TEXT, PK), `code` (TEXT, UNIQUE, NOT NULL), `description` (TEXT), `discount_type` (TEXT), `discount_value` (NUMERIC), `min_order_amount` (NUMERIC), `max_discount` (NUMERIC), `expiry_date` (TIMESTAMPTZ), `is_active` (BOOLEAN), `usage_count` (INTEGER), `created_at` (TIMESTAMPTZ).

### 6. `settings` Table
- **Fields**: `id` (TEXT, PK), `store_name`, `tagline_en`, `tagline_ta`, `logo` (JSONB), `hero_slides` (JSONB), `promo_banner` (JSONB), `homepage_sections` (JSONB), `free_shipping_threshold` (NUMERIC), `standard_shipping_fee` (NUMERIC), `shipping_rules` (JSONB), `announcement_en`, `announcement_ta`, `is_announcement_active`, `bank_details` (JSONB), `upi_details` (JSONB), `created_at`, `updated_at`.

### Missing Tables (Present in Frontend/Storage but NOT in Supabase SQL Schema):
- `suppliers` (handled only in `initialData.ts` and `localStorage.nirai_suppliers_v1`).
- `courier_partners` (handled only in `initialData.ts` and `localStorage.nirai_couriers_v1`).
- `stock_movements` (inventory audit trail stored only in `localStorage.nirai_stock_movements_v1`).
- `media_library` (stored only in `localStorage.nirai_media_v1`).

---

## 6. FLOW-BY-FLOW CODE PATH REVIEW

| Flow | Status | File Paths & Code Tracing | Technical Finding |
| :--- | :--- | :--- | :--- |
| **1. Register** | **PARTIAL** | [`src/components/common/AuthModal.tsx:58-100`](file:///d:/projects/Nirai_New/Nirai/src/components/common/AuthModal.tsx#L58-L100) | Creates `User` object, checks email uniqueness in localStorage, saves to `StorageService.saveUser()`. Does NOT hash password, does NOT invoke email verification. |
| **2. Email Verification** | **MISSING** | N/A | No verification email, token, or OTP service exists. User account is immediately active upon registration. |
| **3. Login** | **PARTIAL** | [`src/components/common/AuthModal.tsx:38-56`](file:///d:/projects/Nirai_New/Nirai/src/components/common/AuthModal.tsx#L38-L56) | Matches user email in `StorageService.getUsers()`. **Password field is never evaluated**. Any password (or empty) logs the user in. |
| **4. Logout** | **WORKS** | [`src/context/ShopContext.tsx:138-141`](file:///d:/projects/Nirai_New/Nirai/src/context/ShopContext.tsx#L138-L141) | Clears `currentUser` from state and shows toast notification. |
| **5. Session Expiry & Refresh** | **MISSING** | N/A | No JWT tokens, session cookies, or refresh token mechanisms exist. State persists until browser cache is cleared. |
| **6. Forgot / Reset Password** | **MISSING** | [`src/components/common/AuthModal.tsx:187-189`](file:///d:/projects/Nirai_New/Nirai/src/components/common/AuthModal.tsx#L187-L189) | "Forgot password?" is a static `<span>` with no `onClick` handler, modal, or backend service. |
| **7. Guest Browsing & Search** | **WORKS** | [`src/pages/CatalogPage.tsx`](file:///d:/projects/Nirai_New/Nirai/src/pages/CatalogPage.tsx), [`src/components/storefront/ProductListingPage.tsx:40-80`](file:///d:/projects/Nirai_New/Nirai/src/components/storefront/ProductListingPage.tsx#L40-L80) | Filters across title, description, Tamil terms, categories, price range, and sort orders in memory. |
| **8. Guest Cart & Persistence** | **WORKS** | [`src/context/ShopContext.tsx:143-169`](file:///d:/projects/Nirai_New/Nirai/src/context/ShopContext.tsx#L143-L169) | Synchronized to `localStorage.nirai_cart` on every modification. |
| **9. Guest Cart Merge on Login** | **MISSING** | [`src/components/common/AuthModal.tsx:38-56`](file:///d:/projects/Nirai_New/Nirai/src/components/common/AuthModal.tsx#L38-L56) | No server-side cart sync. Cart remains whatever was in client `localStorage`. |
| **10. Cart Item Ops & Stock Check** | **PARTIAL** | [`src/context/ShopContext.tsx:210-250`](file:///d:/projects/Nirai_New/Nirai/src/context/ShopContext.tsx#L210-L250) | `addToCart`, `updateCartQuantity`, `removeFromCart` work. Stock check is purely advisory on frontend; no server-side lock. |
| **11. Checkout: Pricing & Rules** | **BROKEN (Security)** | [`src/components/storefront/CheckoutPage.tsx:133-170`](file:///d:/projects/Nirai_New/Nirai/src/components/storefront/CheckoutPage.tsx#L133-L170) | **Calculated 100% on client**. Client passes `grandTotal`, `subtotal`, `discountAmount`, `shippingFee` directly into `StorageService.createOrder` and Supabase. |
| **12. Payment Gateway & Webhook** | **MISSING** | [`src/components/storefront/CheckoutPage.tsx:20-35, 160-170`](file:///d:/projects/Nirai_New/Nirai/src/components/storefront/CheckoutPage.tsx#L20-L35) | Manual UPI QR & deep links; customer pastes UTR. Mock card input. No payment gateway SDK, no webhook, no signature verification. |
| **13. Order Lifecycle & Tracking** | **WORKS** | [`src/components/storefront/OrderTrackingPage.tsx`](file:///d:/projects/Nirai_New/Nirai/src/components/storefront/OrderTrackingPage.tsx), [`src/components/admin/OrderManager.tsx`](file:///d:/projects/Nirai_New/Nirai/src/components/admin/OrderManager.tsx) | 5-step stepper, AWB tracking, courier partner assignment, packaging phase notifications. |
| **14. Wishlist & Reviews** | **PARTIAL** | [`src/services/storage.ts:65-70`](file:///d:/projects/Nirai_New/Nirai/src/services/storage.ts#L65-L70), [`src/components/storefront/ProductDetailPage.tsx:101-115`](file:///d:/projects/Nirai_New/Nirai/src/components/storefront/ProductDetailPage.tsx#L101-L115) | Wishlist stored only in client `localStorage.nirai_wishlist_v1`. Reviews added to in-memory/Supabase JSONB. `verifiedPurchase` is hardcoded `true`. |
| **15. Admin Operations** | **WORKS** | [`src/components/admin/*`](file:///d:/projects/Nirai_New/Nirai/src/components/admin) | Full catalog, media, order, inventory, supplier, courier, and coupon management suites. |
| **16. Emails / SMS Notifications** | **MISSING** | N/A | No transactional emails or SMS sent upon order placement, payment confirmation, or shipping. |

---

## 7. SECURITY AUDIT

### 1. Password Storage & Authentication
- **Plaintext / No Password Verification**: In [`src/components/common/AuthModal.tsx:41`](file:///d:/projects/Nirai_New/Nirai/src/components/common/AuthModal.tsx#L41) and [`src/components/admin/AdminLayout.tsx:63`](file:///d:/projects/Nirai_New/Nirai/src/components/admin/AdminLayout.tsx#L63), the password entered by the user is NEVER checked. Entering any registered email immediately authenticates the session.
- **No Password Hashing**: Passwords stored in `initialData.ts` or Supabase `users` table are in plaintext. No bcrypt/Argon2 hashing is applied.

### 2. Session Management & JWT
- **No Tokens / Cookies**: There are no JWTs, refresh tokens, or HTTP-only cookies. Authentication state is stored purely in React state and synced to `localStorage`.
- **Session Expiry**: Sessions never expire automatically.

### 3. Database Permissions & Row Level Security (RLS)
- **CRITICAL**: In [`supabase-setup.sql:150-167`](file:///d:/projects/Nirai_New/Nirai/supabase-setup.sql#L150-L167), RLS is explicitly DISABLED for all tables:
  ```sql
  ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
  GRANT ALL ON TABLE public.products TO anon, authenticated;
  GRANT ALL ON TABLE public.orders TO anon, authenticated;
  GRANT ALL ON TABLE public.users TO anon, authenticated;
  ```
- Any person using the browser console or curl can execute:
  `DELETE FROM orders`, `UPDATE settings`, `SELECT * FROM users` (exposing all customer names, emails, phones, and addresses).

### 4. Broken Object Level Authorization (IDOR) & Data Exposure
- In [`src/components/storefront/OrderTrackingPage.tsx:42-51`](file:///d:/projects/Nirai_New/Nirai/src/components/storefront/OrderTrackingPage.tsx#L42-L51), any user can query orders by phone number or order ID and view the full delivery address, recipient full name, and items purchased without authentication.

### 5. Client-Side Price Tampering
- In [`src/components/storefront/CheckoutPage.tsx:147-170`](file:///d:/projects/Nirai_New/Nirai/src/components/storefront/CheckoutPage.tsx#L147-L170), the order calculation (`grandTotal`, `unitPrice`, `discountAmount`, `shippingFee`) is performed entirely in client-side JavaScript. A user can inject modified price data directly into `StorageService.createOrder`.

### 6. Hardcoded Secrets & Environment Variables
- **Hardcoded Supabase Credentials**: Located in [`src/services/supabase.ts:9-15`](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L9-L15) as default fallbacks:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- **Hardcoded Cloudinary Credentials**: Located in [`src/services/cloudinary.ts:6-9`](file:///d:/projects/Nirai_New/Nirai/src/services/cloudinary.ts#L6-L9):
  - `VITE_CLOUDINARY_CLOUD_NAME`
  - `VITE_CLOUDINARY_UPLOAD_PRESET`
- **Sample/Active API Keys in Repository**:
  - [`.env.example:3`](file:///d:/projects/Nirai_New/Nirai/.env.example#L3) contains an active Supabase anon JWT.
  - [`.env.example:10`](file:///d:/projects/Nirai_New/Nirai/.env.example#L10) contains an active `GEMINI_API_KEY`.
- **Git Protection**: [`.gitignore:7-8`](file:///d:/projects/Nirai_New/Nirai/.gitignore#L7-L8) correctly ignores `.env*` while un-ignoring `!.env.example`.

### 7. Dependency Vulnerabilities
- `npm audit` returned **0 vulnerabilities** across 1,765 modules.

---

## 8. PERFORMANCE & BUNDLE AUDIT

1. **Large Bundle Size**:
   - `dist/assets/index-CG1ZvBCf.js` is **1,007.86 kB** (gzip: 247.70 kB).
   - Vite issues a warning: `(!) Some chunks are larger than 500 kB after minification`.
   - **Root Cause**: All administrative modules ([`AdminDashboard`](file:///d:/projects/Nirai_New/Nirai/src/components/admin/AdminDashboard.tsx), [`ProductManager`](file:///d:/projects/Nirai_New/Nirai/src/components/admin/ProductManager.tsx), [`ContentManager`](file:///d:/projects/Nirai_New/Nirai/src/components/admin/ContentManager.tsx), [`OrderManager`](file:///d:/projects/Nirai_New/Nirai/src/components/admin/OrderManager.tsx)) are eagerly imported in [`src/pages/admin/AdminPages.tsx`](file:///d:/projects/Nirai_New/Nirai/src/pages/admin/AdminPages.tsx) rather than code-split with `React.lazy()` and `Suspense`. Storefront users download the entire admin suite on initial page load.
2. **Missing Database Pagination**:
   - Supabase calls (`fetchProductsFromSupabase`, `fetchOrdersFromSupabase`, `fetchUsersFromSupabase`) run `select('*')` without server-side `.range(offset, limit)`. As orders and products grow, this will cause heavy network payloads and UI latency.
3. **Base64 Storage Quota Risk**:
   - In [`src/services/cloudinary.ts:93-109`](file:///d:/projects/Nirai_New/Nirai/src/services/cloudinary.ts#L93-L109), if Cloudinary upload fails, images fall back to client-side Base64 strings stored in `localStorage`. Storing two high-resolution photos (~3–5MB each) will trigger a `QuotaExceededError` in the browser.
4. **Missing Relational Indexes**:
   - The Supabase database has indexes on primary keys and unique slugs, but lacks indexes on foreign keys: `category_id`, `sub_category_id`, `customer_id`, and frequently filtered columns (`status`, `created_at`, `is_active`).

---

## 9. RELIABILITY & ERROR HANDLING

1. **Global Error Boundary**:
   - **MISSING**. There is no React Error Boundary wrapping the component tree in [`src/App.tsx`](file:///d:/projects/Nirai_New/Nirai/src/App.tsx) or [`src/main.tsx`](file:///d:/projects/Nirai_New/Nirai/src/main.tsx). An uncaught JavaScript exception in any sub-component will crash the entire page into a blank white screen.
2. **500 Error Page**:
   - **MISSING**. Only a 404 page exists ([`NotFoundPage.tsx`](file:///d:/projects/Nirai_New/Nirai/src/pages/NotFoundPage.tsx)).
3. **Health-Check API Endpoint**:
   - **MISSING**. No server endpoint exists for uptime monitoring (e.g. `/api/health`).
4. **Graceful Storage Fallbacks**:
   - [`src/services/storage.ts`](file:///d:/projects/Nirai_New/Nirai/src/services/storage.ts) wraps `localStorage` operations in `try/catch` and gracefully falls back to initial seed data in [`src/data/initialData.ts`](file:///d:/projects/Nirai_New/Nirai/src/data/initialData.ts).

---

## 10. UX / SEO / RESPONSIVENESS

1. **Mobile Responsiveness**:
   - Mobile navigation drawer, responsive filters, and horizontal scrolling tables are well implemented across mobile screen sizes.
2. **SEO Metadata**:
   - [`index.html:7-9`](file:///d:/projects/Nirai_New/Nirai/index.html#L7-L9) contains a static `<title>` and single meta description.
   - **Missing Dynamic OpenGraph & Meta Tags**: Social sharing cards (`og:title`, `og:image`, `og:description`, `twitter:card`) are not dynamically updated per product or page (e.g. via `react-helmet-async`).
3. **Search Engine Crawlability**:
   - `robots.txt` and `sitemap.xml` are missing from the public build directory.
   - Rich Snippets / Structured Data (`schema.org/Product`, `schema.org/BreadcrumbList`) are not embedded in product detail pages.

---

## 11. DEVOPS & PRODUCTION READINESS

1. **Automated Testing Suite**:
   - **MISSING**. There are ZERO test files (`*.test.ts`, `*.spec.tsx`) in the project.
   - No unit test runner (Vitest / Jest) or end-to-end framework (Playwright / Cypress) is configured in `package.json`.
2. **CI/CD Pipelines**:
   - **MISSING**. No GitHub Actions (`.github/workflows`) or build verification pipelines exist.
3. **Containerization**:
   - **MISSING**. No `Dockerfile` or `docker-compose.yml` exists for reproducible staging/production builds.
4. **README Completeness**:
   - [`README.md`](file:///d:/projects/Nirai_New/Nirai/README.md) is an unedited Google AI Studio starter template with no project documentation, architecture overview, or setup instructions.
5. **Database Migration Tooling**:
   - Database schema is managed via a single raw SQL script ([`supabase-setup.sql`](file:///d:/projects/Nirai_New/Nirai/supabase-setup.sql)). There is no Prisma, Drizzle, or Supabase CLI migration tracking.

---

## 12. COMPREHENSIVE BUG & ISSUE LIST

| ID | Severity | Area | File & Line | Problem Description | Suggested Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | **CRITICAL** | Security / DB | [`supabase-setup.sql:150-167`](file:///d:/projects/Nirai_New/Nirai/supabase-setup.sql#L150-L167) | Row Level Security (RLS) is disabled. Public `anon` role has `ALL` privileges on `orders`, `users`, `products`, `settings`. | Enable RLS on all tables and define strict policies allowing `anon` only `SELECT` on active products/categories, and authenticated users to access their own records. |
| **BUG-02** | **CRITICAL** | Auth | [`src/components/common/AuthModal.tsx:41`](file:///d:/projects/Nirai_New/Nirai/src/components/common/AuthModal.tsx#L41) | Customer login checks only email existence. Password input is ignored completely. | Integrate Supabase Auth (`supabase.auth.signInWithPassword`) or a secure backend with bcrypt password verification. |
| **BUG-03** | **CRITICAL** | Auth / Admin | [`src/components/admin/AdminLayout.tsx:63, 160-220`](file:///d:/projects/Nirai_New/Nirai/src/components/admin/AdminLayout.tsx#L63) | Admin console authentication ignores password and provides 1-click bypass buttons to authorize as Super Admin. | Remove demo 1-click login buttons; implement server-side authentication with MFA and role verification. |
| **BUG-04** | **CRITICAL** | Checkout | [`src/components/storefront/CheckoutPage.tsx:147-170`](file:///d:/projects/Nirai_New/Nirai/src/components/storefront/CheckoutPage.tsx#L147-L170) | Order total calculation is trusted from client state. Malicious clients can alter item prices or total amount. | Validate prices, calculate subtotals, tax, discounts, and shipping fees strictly on a secure backend. |
| **BUG-05** | **HIGH** | Security / Secrets | [`src/services/supabase.ts:9-15`](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts#L9-L15) | Production Supabase URL and anon key are hardcoded as fallback defaults in source code. | Remove hardcoded strings; enforce required environment variables via `import.meta.env`. |
| **BUG-06** | **HIGH** | Data Privacy | [`src/components/storefront/OrderTrackingPage.tsx:42-51`](file:///d:/projects/Nirai_New/Nirai/src/components/storefront/OrderTrackingPage.tsx#L42-L51) | Order tracking allows looking up orders by raw phone number without OTP or authentication, leaking customer addresses. | Require an OTP verification sent to the customer's phone or require the exact order number + matching phone number. |
| **BUG-07** | **HIGH** | Reliability | [`src/App.tsx:29-75`](file:///d:/projects/Nirai_New/Nirai/src/App.tsx#L29-L75) | No React Error Boundary. An unhandled exception in any component causes a white-screen crash. | Add a top-level `<ErrorBoundary>` component with a user-friendly recovery page. |
| **BUG-08** | **MEDIUM** | Performance | [`src/pages/admin/AdminPages.tsx:4-16`](file:///d:/projects/Nirai_New/Nirai/src/pages/admin/AdminPages.tsx#L4-L16) | Heavy admin components are bundled into the main bundle (1,007 kB). | Use `React.lazy()` and `<Suspense>` to code-split `/admin/*` routes. |
| **BUG-09** | **MEDIUM** | Storage | [`src/services/cloudinary.ts:93-109`](file:///d:/projects/Nirai_New/Nirai/src/services/cloudinary.ts#L93-L109) | Image fallback converts failed Cloudinary uploads to Base64 in `localStorage`, risking quota exhaustion. | Store only temporary object URLs (`URL.createObjectURL`) or prompt the user with an upload error message instead of saving Base64 in localStorage. |
| **BUG-10** | **LOW** | SEO | [`index.html`](file:///d:/projects/Nirai_New/Nirai/index.html) | Missing OpenGraph tags, sitemap.xml, robots.txt, and product JSON-LD schema. | Add dynamic meta tags via `react-helmet-async`, generate `robots.txt`, and generate `sitemap.xml`. |

---

## 13. MISSING PRODUCTION FEATURES

1. **Automated Payment Gateway Integration**: Razorpay, Cashfree, or PhonePe PG integration with webhook signature verification, order auto-confirmation, and automated refund handling.
2. **Transactional Email / SMS Service**: Integration with Resend, AWS SES, or Twilio to send automated Order Placed, Payment Received, Dispatched, and Delivered notifications.
3. **Real Server-Side Authentication**: Supabase Auth or Node.js session service with email verification, password reset links, secure password hashing (Argon2/bcrypt), and JWT handling.
4. **Server-Side Order & Inventory Validation**: Server endpoint to atomically deduct inventory, calculate prices, and validate coupons before order persistence.
5. **Tax & Invoicing Compliance**: GST calculation, HSN code tagging on products, and automated GST-compliant tax invoices (PDF generation).
6. **Automated Courier API Integration**: Live shipping rate calculation and automatic AWB generation with Shiprocket, Delhivery, or BlueDart APIs.
7. **Customer Support Ticketing / Live Chat**: Integrated chat or ticketing system replacing personal WhatsApp links.
8. **Automated Testing & CI/CD**: Unit, integration, and E2E test suites with automated GitHub Actions deployment.

---

## 14. TOP 10 PRIORITY ACTIONS

1. **[CRITICAL] Enable Supabase Row Level Security (RLS)**:
   - Enable RLS on `orders`, `users`, `products`, `coupons`, and `settings`.
   - Restrict public access to read-only for active products and categories.
2. **[CRITICAL] Secure Authentication & Password Hashing**:
   - Migrate customer and admin login to real Supabase Auth (`supabase.auth.signInWithPassword`).
   - Remove plaintext password storage and 1-click admin bypass buttons.
3. **[CRITICAL] Server-Side Order & Price Validation**:
   - Implement a secure Supabase Edge Function or Express/Node.js backend to recalculate cart totals, validate discounts, and verify stock before creating orders.
4. **[HIGH] Payment Gateway Integration**:
   - Integrate Razorpay or Cashfree with webhook signature verification and idempotency keys to replace manual UTR submission.
5. **[HIGH] Remove Hardcoded Secrets**:
   - Remove fallback credentials from [`src/services/supabase.ts`](file:///d:/projects/Nirai_New/Nirai/src/services/supabase.ts) and [`src/services/cloudinary.ts`](file:///d:/projects/Nirai_New/Nirai/src/services/cloudinary.ts).
   - Invalidate any exposed keys from `.env.example`.
6. **[HIGH] Implement Global Error Boundary**:
   - Wrap the application in a React `<ErrorBoundary>` with user feedback and error logging (e.g. Sentry).
7. **[MEDIUM] Route-Level Code Splitting**:
   - Use `React.lazy()` for all `/admin/*` routes to cut initial bundle size from 1,007 kB to <300 kB.
8. **[MEDIUM] Transactional Notifications**:
   - Implement automated transactional emails (Resend / AWS SES) for order receipts and dispatch updates.
9. **[MEDIUM] Automated Test Suite & CI/CD**:
   - Set up Vitest and Playwright with a GitHub Actions workflow to run type-checks, lints, and tests on every push.
10. **[LOW] SEO & Search Engine Indexing**:
    - Add `robots.txt`, `sitemap.xml`, dynamic OpenGraph tags, and JSON-LD schema for products.

---

## 15. QUESTIONS FOR THE OWNER / STAKEHOLDERS

1. **Payment Gateway**: Which Indian payment gateway merchant account is planned for production (Razorpay, Cashfree, PhonePe PG, or PayU)?
2. **Backend Architecture**: Should the application remain serverless (using Supabase Edge Functions for order validation, auth, and webhooks) or should a dedicated Node.js/Express API service be deployed?
3. **Transactional Communication**: Which provider is preferred for order confirmation emails and SMS/WhatsApp notifications (e.g. Resend, Brevo, Gupshup, Twilio)?
4. **GST & Invoicing**: What is the company's GSTIN and state tax structure for automated invoice generation?
5. **Logistics & Shipping**: Is there an active aggregator account (e.g. Shiprocket, Pickrr) for live shipping rates and automated AWB generation, or will courier dispatch remain manual via BlueDart/DTDC?

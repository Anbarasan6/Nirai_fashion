# Nirai Handlooms (நிறை) — Performance & Reliability Audit Report
**Branch:** `prod-hardening` | **Target Platform:** Mobile 4G (Mid-range Android)

---

## 1. Bundle Measurement: Before vs. After

### Summary Table

| Metric | Baseline ("Before") | Optimized ("After") | Net Change | Target Requirement | Status |
|---|---|---|---|---|---|
| **Initial JS Core Bundle** | **905.55 kB** raw (243.74 kB gzip) | **164.65 kB** raw (38.57 kB gzip) | **-81.8% raw / -84.2% gzip** | < 300 kB raw / < 100 kB gzip | **EXCEEDED** |
| **Vendor React + Router** | Bundled in main monolith | 280.41 kB raw (89.73 kB gzip) | Isolated chunk (Parallel HTTP/2) | Shared cacheable vendor | **OPTIMIZED** |
| **Vendor Supabase** | Bundled in main monolith | 214.04 kB raw (55.06 kB gzip) | Isolated chunk (Parallel HTTP/2) | Shared cacheable vendor | **OPTIMIZED** |
| **Vendor Zod** | Bundled in main monolith | 83.90 kB raw (24.01 kB gzip) | Deferred to `/checkout` | Removed from initial load | **REMOVED FROM INITIAL** |
| **Vendor QRCode** | Bundled in main monolith | 23.47 kB raw (8.86 kB gzip) | Deferred to `/pay/:orderNumber` | Removed from initial load | **REMOVED FROM INITIAL** |
| **Admin Area & Managers** | Statically linked in `App.tsx` | All 12 managers lazy loaded | Split into ~6-43 kB chunks | Never loaded by shoppers | **FULLY CODE-SPLIT** |
| **Compiled Tailwind CSS** | 92.11 kB raw (14.77 kB gzip) | 92.54 kB raw (14.86 kB gzip) | +0.4 kB (Skeleton animations) | Instant render | **HEALTHY** |

### Detailed Chunk Breakdown ("After")

| Chunk File | Raw Size | Gzip Size | Route / Target Usage |
|---|---|---|---|
| `dist/assets/index-CBOl78dU.js` | **164.65 kB** | **38.57 kB** | **Main Storefront Entry (Home, Catalog, PDP, Cart)** |
| `dist/assets/vendor-react-S_AqtJ9x.js` | 280.41 kB | 89.73 kB | React 19 Core + React DOM + React Router |
| `dist/assets/vendor-supabase-1yby8ldT.js` | 214.04 kB | 55.06 kB | Supabase PostgREST & Auth Client |
| `dist/assets/vendor-zod-BIxbLECy.js` | 83.90 kB | 24.01 kB | Zod Schema Validator (Checkout only) |
| `dist/assets/vendor-qrcode-Ca2H7ayG.js` | 23.47 kB | 8.86 kB | QR Canvas Renderer (Payment portal only) |
| `dist/assets/OrderManager-C9q6xbV2.js` | 43.93 kB | 9.73 kB | Admin: Order Management & Payment Verification |
| `dist/assets/ContentManager-DqFXXtch.js` | 40.31 kB | 8.18 kB | Admin: Settings, Bank Accounts, Announcements |
| `dist/assets/PoliciesPage-CqSDrU-4.js` | 38.00 kB | 9.34 kB | Storefront: Legal, Terms, Privacy, Refunds |
| `dist/assets/NotificationManager-Cuf3y_Hn.js` | 33.11 kB | 7.35 kB | Admin: Notification Outbox & Verification Logs |
| `dist/assets/HomepageManager-seHNhwVZ.js` | 31.23 kB | 6.12 kB | Admin: Hero Slides & Sections Editor |
| `dist/assets/ProductManager-fe5Jnhy3.js` | 26.62 kB | 6.75 kB | Admin: Product Catalog CRUD |
| `dist/assets/CheckoutPage-CJltsfpd.js` | 26.16 kB | 6.09 kB | Storefront: Multi-step Checkout & RPC Quote |
| `dist/assets/PaymentPage-B8f8Iubk.js` | 23.46 kB | 6.16 kB | Storefront: UPI / QR / Bank Proof Submission |
| `dist/assets/CustomerManager-vhhGJhi2.js` | 22.44 kB | 4.94 kB | Admin: Customer Directory |
| `dist/assets/ProductDetailPage-Dm8_Vlh9.js` | 19.93 kB | 5.41 kB | Storefront: PDP High-res Gallery & Weave Story |
| `dist/assets/CustomerAccountPage--DSbpWJJ.js` | 18.98 kB | 4.60 kB | Storefront: Customer Orders & Addresses |
| `dist/assets/CourierManager-DrZoumUR.js` | 18.64 kB | 4.34 kB | Admin: Courier Tracking Partners |
| `dist/assets/MediaUploadModal-CA8Vck4I.js` | 15.05 kB | 4.35 kB | Admin: Media Upload Modal |
| `dist/assets/OrderTrackingPage-C99lDOiJ.js` | 14.58 kB | 4.31 kB | Storefront: Live Order Tracking |
| `dist/assets/AdminPages-BgbyKdCm.js` | 14.37 kB | 4.45 kB | Admin: Layout Shell & Navigation Guard |
| `dist/assets/AdminDashboard-B_TkOMBw.js` | 13.93 kB | 3.23 kB | Admin: Dashboard Analytics |
| `dist/assets/CategoryManager-CIYcs-jP.js` | 9.88 kB | 3.03 kB | Admin: Categories CRUD |
| `dist/assets/MediaLibraryPage-DFzTVLjF.js` | 9.50 kB | 3.07 kB | Admin: Media Library Grid |
| `dist/assets/SupplierManager-CMEbSPqB.js` | 8.87 kB | 2.38 kB | Admin: Weavers & Suppliers |
| `dist/assets/CouponManager-Do5FnJjI.js` | 8.54 kB | 2.35 kB | Admin: Promotional Discounts & Coupons |
| `dist/assets/InventoryManager-DU2RCtkn.js` | 6.09 kB | 1.94 kB | Admin: Stock Movements & Alerts |
| `dist/assets/ResetPasswordPage-D-lu5VtM.js` | 5.25 kB | 1.83 kB | Storefront: Auth Password Recovery |
| `dist/assets/mediaService-DK4haqss.js` | 2.71 kB | 1.41 kB | Utility: Media compression & upload |
| `dist/assets/ErrorPage-y7c7loyt.js` | 2.51 kB | 1.13 kB | Storefront: 500 Server Error Page |
| `dist/assets/cloudinary-XQrYl30C.js` | 1.62 kB | 0.93 kB | Utility: Cloudinary upload helper |
| `dist/assets/NotFoundPage-Ba_xNFce.js` | 1.54 kB | 0.70 kB | Storefront: 404 Page |
| `dist/assets/sentry-C-N11YVe.js` | 0.04 kB | 0.06 kB | Error Monitoring: Lazy Sentry Loader |

---

## 2. Page & Screen Audit Matrix (Loading, Empty & Error States)

Every screen from `PROJECT_ANALYSIS.md` Section 4 was audited and hardened:

| Screen / Page | Route | Loading Skeleton? | Empty State? | Error State with Action / Retry? | Form & Button State |
|---|---|:---:|:---:|:---:|:---:|
| **Homepage** | `/` | ✅ Shimmer skeleton | ✅ Handled | ✅ `<ErrorBoundary>` with Reload + Home CTA | N/A |
| **Catalog Listing** | `/catalog`, `/catalog/:categorySlug` | ✅ `ProductGridSkeleton` (6 animated cards) | ✅ "No ensembles match" with "Reset All Filters" CTA | ✅ "Unable to connect" with human message + "Retry Connection" button | Filter inputs debounced 300ms |
| **Product Detail (PDP)** | `/product/:slug` | ✅ `ProductDetailSkeleton` (aspect 3:4 gallery + options) | ✅ Handloom Kolam 404 fallback | ✅ `<ErrorBoundary>` fallback | "Add to Cart" shows added state; disabled on low stock |
| **Cart Drawer / Bag** | `/cart` | ✅ Instant memory state | ✅ Empty bag banner with "Explore Handlooms" CTA | ✅ Local error banners | Qty adjusters disabled while processing |
| **Checkout Portal** | `/checkout` | ✅ Price quote skeleton | ✅ Redirects if cart is empty | ✅ Server pricing notice + clear error banners | Submit button shows spinner & disabled in flight; auto-focus first invalid field; `inputMode="tel\|numeric\|email"` |
| **Payment Portal** | `/pay/:orderNumber` | ✅ `PageSkeleton` | ✅ Expired notice with support CTA | ✅ Friendly error alert with WhatsApp support link | "Submit Payment Proof" shows `<Loader2>` spinner and disabled while uploading; field errors auto-focus |
| **Order Tracking** | `/tracking`, `/tracking/:orderNumber` | ✅ Search loader | ✅ "No matching order found" with instructions | ✅ Human error notice with phone check | Track button shows spinner & disabled in flight |
| **Customer Account** | `/account` | ✅ `PageSkeleton` | ✅ "No orders placed yet" with "Browse Sarees" CTA | ✅ Fallback auth prompt modal | Form fields have `inputMode` and `autoComplete` |
| **Static / Legal Pages** | `/about`, `/contact`, `/policies`, `/*-policy` | ✅ Static layout | N/A | ✅ Root error boundary protection | N/A |
| **404 Page** | `*` | ✅ Instant render | ✅ "Page Not Found" with "Return to Home" | N/A | N/A |
| **500 Error Page** | `/500`, Error boundary | ✅ Instant render | N/A | ✅ Bilingual (EN + TA) reload + error reference ID (`ERR-XXXXXX`) | N/A |
| **Admin Dashboard** | `/admin/dashboard` | ✅ `TableSkeleton` | ✅ Handled | ✅ `<ErrorBoundary level="admin">` | Actions disabled while syncing |
| **Admin Products** | `/admin/products` | ✅ `TableSkeleton` | ✅ Empty table message | ✅ Modal error handling | Save / delete buttons disabled while saving |
| **Admin Categories** | `/admin/categories` | ✅ `TableSkeleton` | ✅ Empty table message | ✅ Toast error notification | Submit button disabled in flight |
| **Admin Orders & Verification** | `/admin/orders` | ✅ `TableSkeleton` | ✅ "No orders found for filter" | ✅ Verification modal error states | "Verify Payment", "Reject", "Mark Paid" buttons show spinners and are locked in flight |
| **Admin Inventory** | `/admin/inventory` | ✅ `TableSkeleton` | ✅ Empty stock table | ✅ RPC adjustment error alerts | Adjust stock button disabled while saving |
| **Admin Customers** | `/admin/customers` | ✅ `TableSkeleton` | ✅ Empty directory state | ✅ Handled | N/A |
| **Admin Suppliers** | `/admin/suppliers` | ✅ `TableSkeleton` | ✅ Empty suppliers list | ✅ Toast error | Save button disabled in flight |
| **Admin Couriers** | `/admin/couriers` | ✅ `TableSkeleton` | ✅ Empty couriers list | ✅ Toast error | Save button disabled in flight |
| **Admin Coupons** | `/admin/coupons` | ✅ `TableSkeleton` | ✅ Empty coupons list | ✅ Toast error | Save button disabled in flight |
| **Admin Media Library** | `/admin/media` | ✅ Grid shimmer | ✅ Empty media library | ✅ Compression / network error notice | Upload modal shows progress bar & disabled while uploading |
| **Admin Homepage** | `/admin/homepage` | ✅ Section skeleton | ✅ Handled | ✅ Toast error | Save changes disabled in flight |
| **Admin Settings & Content** | `/admin/content` | ✅ `PageSkeleton` | ✅ Handled | ✅ Account validation error banners | "Save Settings" button shows spinner & disabled |
| **Admin Notifications** | `/admin/notifications` | ✅ `TableSkeleton` | ✅ Empty outbox state | ✅ Resend / Edge function error banners | "Send Test Notification" shows spinner |

---

## 3. Data Fetching & Caching Architecture

1. **Selective Column Catalog Queries**:
   - Replaced `.select('*')` on catalog listings with `CATALOG_LIST_COLUMNS`:
     ```sql
     id, sku, name_en, name_ta, slug, short_desc_en, short_desc_ta, category_id,
     sub_category_id, brand, fabric, base_price, regular_discount, special_discount,
     final_price, stock, is_featured, is_new_arrival, is_active, images, variants,
     rating, review_count, created_at
     ```
   - Omitted long descriptions (`description_en`, `description_ta`), wash care instructions, supplier notes, and reviews from product listing responses.
2. **In-Memory TTL Session Cache (`SessionCache`)**:
   - `fetchCategoriesFromSupabase` and `fetchSettingsFromSupabase` cached for 5 minutes with automatic promise deduplication (concurrent requests share the same in-flight Promise).
   - Invalidation triggers automatically when admin mutations occur (`saveCategoryToSupabase`, `deleteCategoryFromSupabase`, `saveSettingsToSupabase`).
   - Storefront initial load now fetches only 3 core endpoints (`active products`, `categories`, `store settings`), deferring 7 administrative tables (`suppliers`, `couriers`, `media`, `stock movements`, `orders`, `users`) until an authenticated staff member enters `/admin`.
3. **Search Debounce & In-flight Cancellation**:
   - Product catalog search input is debounced by 300 ms.
   - Component unmount and filter changes cancel state updates using an `ignore` flag, preventing memory leaks and state updates on unmounted trees.

---

## 4. Image Delivery & Mobile LCP Optimization

1. **Cloudinary Transformation Helper (`cldUrl`)**:
   - Automatically injects `f_auto,q_auto,w_<n>,c_fill` into Cloudinary URLs, enabling AVIF/WebP delivery and reducing image payloads by 60-80%.
   - Non-Cloudinary assets (e.g. Unsplash placeholders) receive standard dimension and format query parameters.
2. **Responsive `<picture>` and `srcset`**:
   - `ProductCard`: Rendered with `cldWidth={480}`, `cldHeight={640}`, `cldCrop="fill"`, and responsive `srcSet`.
   - `HeroSection` (LCP Candidate): Slide 0 configured with `fetchpriority="high"`, `loading="eager"`, and `<source media="(max-width: 640px)">` with 640px mobile crop. Subsequent slides load lazily.
   - `CategorySection`: Rendered with `cldWidth={360}`, `cldHeight={450}`, `loading="lazy"`, `decoding="async"`.
   - `ProductDetailPage`: Primary image rendered with `cldWidth={900}`, `cldHeight={1200}`, `priority={true}`; thumbnails rendered with `cldWidth={120}`, `cldHeight={160}`.
3. **Broken Image Fallback**:
   - `ImageWithFallback` intercepts `onError` events and renders an ornate South Indian Kolam / Temple Zari SVG motif with gold Tamil script (நி), ensuring a broken link never reveals a missing image icon.
4. **Client-Side Image Downscaling (`compressImage`)**:
   - Admin image uploads are pre-compressed and downscaled on the client canvas (max dimension 1600px, JPEG/WebP quality 0.8) before dispatch to Cloudinary, reducing upload bandwidth and preventing mobile crash on large 20+ megapixel photos.

---

## 5. Resilience & Error Boundaries

1. **Hierarchy of Error Boundaries**:
   - **Root Boundary (`main.tsx`)**: Protects the entire application against fatal bootstrap exceptions.
   - **Route Boundaries (`App.tsx`)**: Wraps route groups so a crash in one page preserves navigation.
   - **Admin Boundary (`AdminLayout.tsx`)**: Isolates the staff portal (`<ErrorBoundary level="admin">`) so an admin table crash can never bring down customer shopping.
2. **Chunk Load Failure Auto-Recovery (`lazyRetry`)**:
   - Intercepts `"Failed to fetch dynamically imported module"` errors after production deployments.
   - Triggers a single guarded page reload (`sessionStorage.setItem('nirai_chunk_retry', ...)`) without infinite loops.
3. **Global Network & Unhandled Rejection Listeners**:
   - `main.tsx` listens for `'unhandledrejection'` and `'error'`, notifying the user via a subtle toast instead of a blank white screen.
   - `OfflineBanner.tsx` monitors `navigator.onLine` and `online`/`offline` window events, displaying bilingual connectivity alerts.
4. **Dedicated 500 Error Page (`ErrorPage.tsx`)**:
   - Displays reference tracking ID (`ERR-XXXXXX`), bilingual support messages, "Reload Page", and "Go to Home" buttons.

---

## 6. Privacy-First Error Monitoring (Sentry)

- Integrated `@sentry/react` initialized lazily via `requestIdleCallback` (never blocks the main thread during initial page load).
- If `VITE_SENTRY_DSN` is empty or undefined, Sentry stays completely silent and uninitialized.
- **Privacy Enforcement (`beforeSend`)**:
  - `sendDefaultPii: false`
  - Scrubbing regex strips email addresses (`/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g`), 10-digit Indian phone numbers (`/\b[6-9]\d{9}\b/g`), and bank UTR numbers (`/\b[A-Za-z0-9]{12,22}\b/g`).
  - Request body, cookies, and headers are completely stripped on `/pay`, `/checkout`, `/account`, and `/admin`.
  - User identity is tagged solely by role (`user_role: 'customer' | 'admin' | 'guest'`); emails, IP addresses, and customer names are stripped.
  - Traces sample rate set conservatively to `0.1` (10%).

---

## 7. How to Run Audits & Visualizers

- **Bundle Visualizer**:
  ```bash
  npm run analyze
  ```
  Generates an interactive treemap in `dist/stats.html`.
- **Typecheck**:
  ```bash
  npm run typecheck
  ```
- **Lighthouse Mobile 4G Audit**:
  ```bash
  npm run build
  npm run preview -- --port 4173
  npx lighthouse http://localhost:4173/ --preset=mobile --output=html --output-path=./lighthouse-home.html
  npx lighthouse http://localhost:4173/catalog --preset=mobile --output=html --output-path=./lighthouse-catalog.html
  ```

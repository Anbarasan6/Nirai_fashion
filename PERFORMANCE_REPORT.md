# Nirai Handlooms (நிறை) — Performance & Reliability Audit Report
**Branch:** `prod-hardening` | **Target Platform:** Mobile 4G (Mid-range Android)

---

## 1. Bundle Baseline ("Before")

### Baseline Build (Vite 8 + React 19)
Recorded prior to Phase 5 code splitting, manual chunking, and lazy loading optimizations.

| Asset / Chunk | Raw Size | Gzip Size | Notes |
|---|---|---|---|
| `dist/assets/index-BEsfzngI.js` | **905.55 kB** | **243.74 kB** | **MONOLITHIC** (Contains all storefront pages, qrcode, zod, router, supabase, react) |
| `dist/assets/index-CfRWNkQ5.css` | 92.11 kB | 14.77 kB | Tailwind v4 compiled design tokens |
| `dist/assets/OrderManager-C9KPRUg5.js` | 44.62 kB | 10.04 kB | Code-split admin module |
| `dist/assets/ContentManager-FrvQkDvO.js` | 40.97 kB | 8.48 kB | Code-split admin module |
| `dist/assets/NotificationManager-DLdGT1DR.js` | 33.69 kB | 7.57 kB | Code-split admin module |
| `dist/assets/HomepageManager-BqBZrpsI.js` | 31.63 kB | 6.34 kB | Code-split admin module |
| `dist/assets/ProductManager-BbT9qtyG.js` | 26.60 kB | 6.72 kB | Code-split admin module |
| `dist/assets/CustomerManager-K4qp4MmC.js` | 22.60 kB | 5.03 kB | Code-split admin module |
| `dist/assets/CourierManager-CRIbDxS5.js` | 18.61 kB | 4.32 kB | Code-split admin module |
| `dist/assets/MediaUploadModal-BJ578x-X.js` | 15.22 kB | 4.45 kB | Code-split admin modal |
| `dist/assets/AdminDashboard-DCxDkwLE.js` | 14.35 kB | 3.42 kB | Code-split admin module |
| `dist/assets/CategoryManager-aSoH68Qu.js` | 9.89 kB | 3.05 kB | Code-split admin module |
| `dist/assets/MediaLibraryPage-C2wGoDRo.js` | 9.44 kB | 3.04 kB | Code-split admin module |
| `dist/assets/SupplierManager-ODunkUuQ.js` | 8.81 kB | 2.35 kB | Code-split admin module |
| `dist/assets/CouponManager-CHW9PYVq.js` | 8.48 kB | 2.32 kB | Code-split admin module |
| `dist/assets/InventoryManager-N3HmlNdC.js` | 6.18 kB | 2.00 kB | Code-split admin module |
| `dist/assets/mediaService-C1YB-pEB.js` | 2.83 kB | 1.49 kB | Shared media service |
| Small Icon Chunks (< 1 kB) | ~1.5 kB | ~1.0 kB | Dynamic icons |
| **Initial Bundle Total** | **905.55 kB** | **243.74 kB** | **Target: < 300 kB raw / < 100 kB gzip** |

---

## 2. Lighthouse Audit Instructions (Mobile 4G Emulation)

To measure mobile Core Web Vitals on a mid-range Android phone over a simulated 4G network:

1. **Start the local preview server**:
   ```bash
   npm run build
   npm run preview -- --port 4173
   ```
2. **Run Lighthouse Mobile Audit**:
   - **Method A (CLI)**:
     ```bash
     npx lighthouse http://localhost:4173/ --preset=mobile --throttling-method=devtools --output=html --output-path=./lighthouse-home.html
     npx lighthouse http://localhost:4173/catalog --preset=mobile --throttling-method=devtools --output=html --output-path=./lighthouse-catalog.html
     npx lighthouse http://localhost:4173/product/kanchipuram-pure-zari-silk-saree --preset=mobile --throttling-method=devtools --output=html --output-path=./lighthouse-pdp.html
     ```
   - **Method B (Chrome DevTools)**:
     - Open Chrome in Incognito mode.
     - Navigate to `http://localhost:4173`.
     - Open DevTools (F12) > **Lighthouse** tab.
     - Select **Mode: Navigation**, **Device: Mobile**, **Categories: Performance, Accessibility, Best Practices, SEO**.
     - Click **Analyze page load**.

---

## 3. Page-by-Page Reliability & State Matrix (Baseline Audit)

| Screen / Page | Route | Loading Skeleton? | Empty State? | Error State + Retry? | Status |
|---|---|:---:|:---:|:---:|:---:|
| **Homepage** | `/` | ❌ Partial (Spinner) | ❌ No | ⚠️ Generic Toast | Needs Skeletons + Offline Banner |
| **Catalog / Filter Grid** | `/catalog` | ❌ Spinner | ⚠️ Basic text | ❌ Crash on fetch error | Needs Product Grid Skeleton + Clear Filters |
| **Product Detail (PDP)** | `/product/:slug` | ❌ Spinner | ❌ White screen on 404 | ❌ No retry | Needs PDP Skeleton + 404 Handloom Fallback |
| **Cart Drawer / Page** | `/cart` | N/A | ⚠️ Basic text | N/A | Needs "Explore Handlooms" CTA |
| **Checkout Portal** | `/checkout` | ❌ Spinner | N/A | ⚠️ Toast only | Needs Form UX, Auto-focus, Field-level errors |
| **Payment & UTR Portal** | `/pay/:orderNumber` | ❌ Spinner | ❌ Crash if missing | ⚠️ Alert only | Needs Payment Skeleton + Offline Warning |
| **Order Tracking** | `/tracking/:orderNumber?` | ❌ Spinner | ⚠️ Basic text | ⚠️ Alert text | Needs Milestone Skeletons + Retry |
| **Customer Account** | `/account` | ❌ Blank / redirect | ⚠️ Basic text | ❌ No retry | Needs 403 Login Guard + Skeletons |
| **Admin Dashboard** | `/admin/dashboard` | ❌ Spinner | ⚠️ Basic | ⚠️ Toast only | Needs Metric Skeletons |
| **Admin Orders** | `/admin/orders` | ❌ Spinner | ⚠️ Basic text | ❌ No retry | Needs Table Skeleton |
| **Admin Notifications** | `/admin/notifications` | ⚠️ Table text | ⚠️ Table text | ⚠️ Toast only | Needs Skeleton + Retry |

---

## 4. Phase 5 Performance Optimization Plan

1. **Error Boundaries & Resilience**:
   - Reusable class `<ErrorBoundary>` with bilingual English + Tamil fallback.
   - Separate boundaries for root, storefront routes, and admin area.
   - `lazyRetry` chunk failure recovery to prevent white screens after new deployments.
   - Global `unhandledrejection` and `error` listeners with non-blocking toasts.
   - 500 Error Page and Offline Banner.
2. **Code Splitting & Bundle Thinning**:
   - Split checkout, payment, account, tracking, policy pages from main bundle.
   - Lazy load `qrcode` solely on `/pay/:orderNumber`.
   - Configure `manualChunks` in `vite.config.ts` (`vendor-react`, `vendor-router`, `vendor-supabase`, `vendor-icons`).
   - Replace layout-jumping spinners with shimmering skeletons.
3. **Data Fetching Efficiency**:
   - Replace `select('*')` with targeted columns for catalog grids.
   - Session-level in-memory cache for static settings/categories.
   - Debounce catalog search by 300 ms.
   - Clean up Realtime channels and interval timers on unmount.
4. **Image Delivery & Cloudinary Optimization**:
   - Helper `cldUrl(url, {w, h, crop, format, quality})` injecting `f_auto,q_auto,w_<n>,c_fill`.
   - `fetchpriority="high"` and eager loading on Hero/LCP images; `loading="lazy"` + `decoding="async"` below the fold.
   - Client-side image compression for admin uploads (max ~1600px, quality 0.8).
5. **Observability & Error Monitoring**:
   - `@sentry/react` integration with PII scrubbing and lazy initialization.

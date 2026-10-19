# Nirai (நிறை) — Traditional Handloom & Ethnic Store

> **Sacred South Indian Handloom E-Commerce Platform**  
> Built with React 19, Vite, TypeScript, Tailwind CSS v4, and Supabase BaaS.

---

## Overview

**Nirai** is a specialized direct-to-consumer (D2C) e-commerce platform dedicated to authentic South Indian handloom textiles (Kanchipuram Silk, Madurai Sungudi, Chettinad Cotton, Temple Borders, and Traditional Dhoti sets). The application features bilingual accessibility (English & Tamil), guest-friendly checkout with manual UPI / UTR payment flows, multi-stage live order fulfillment tracking, and an administrative console for catalog and operations management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build & Dev Tooling** | [Vite 8](https://vitejs.dev/) (`@vitejs/plugin-react`) |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`) |
| **Database & Realtime** | [Supabase](https://supabase.com/) (PostgreSQL + RLS + Realtime sync) |
| **Media Storage** | [Cloudinary](https://cloudinary.com/) (Unsigned direct asset uploads) |
| **Routing** | [React Router DOM v7](https://reactrouter.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## Key Features

### Storefront & Customer Experience
- **Bilingual Interface**: Instant English and Tamil language switching across menus, product filters, specifications, care guides, and policies.
- **Handloom Catalog & Discovery**: Instant filtering by saree weave type, border style, occasion, fabric, price range, and search terms.
- **Catalog Price Tamper Protection**: Unit prices and order totals are recalculated and verified against live catalog records during checkout.
- **Dynamic UPI QR & Bank Transfer Flow**: Dedicated `/pay/:orderNumber` portal with dynamic UPI QR generation (`qrcode`), mobile deep linking (`upi://pay`), masked account details, countdown timer, and proof submission.
- **Live Fulfillment Tracking**: 5-step milestone tracking (`Ordered` → `Confirmed` → `Packed` → `Shipped` → `Delivered`) via order number and billing verification.
- **Crash-Resilience**: Top-level `ErrorBoundary` prevents application crashes and provides recovery fallbacks.

### Operations, Security & Admin Console
- **Manual Payment Verification Engine**: Offline UPI and Bank Transfer verification workflow. Customer submissions transition orders to `Verification Pending` (never auto-marked as Paid). Staff verify transactions against merchant statements before confirming orders.
- **Admin Reconciliation Queue**: Oldest-first review queue with duplicate UTR detection, mismatch warnings, and signed receipt previews. Detailed procedures documented in [ADMIN_GUIDE.md](ADMIN_GUIDE.md).
- **Automated Expiry & Restock**: Unpaid orders past the payment window (default 24h) are automatically cancelled with inventory restored to stock.
- **Admin Modules**: Dashboard analytics, Catalog Manager, Order Fulfillment & Status Lifecycle, Customer CRM, Stock Movements, Supplier Management, Courier Partner Integrations, Promotional Coupons, and Media Library.
- **Code-Split Bundles**: All admin modules are lazily loaded with `React.lazy()` and `<Suspense>`, keeping the initial customer storefront bundle lightweight.
- **Dynamic CMS**: In-browser banner and homepage section arrangement with Cloudinary media integration.

---

## Environment Variables

Copy the template from `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|:---:|---|
| `VITE_SUPABASE_URL` | **Yes** | Your Supabase project URL (`https://<project-id>.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Your public Supabase anon API key. |
| `VITE_CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary account Cloud Name. |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | **Yes** | Cloudinary unsigned upload preset for media storage. |
| `VITE_SENTRY_DSN` | Optional | Sentry DSN for privacy-preserving client error monitoring. |
| `APP_URL` / `SITE_URL` | Optional | Canonical base URL of the application (default: `http://localhost:3000`). |
| `RESEND_API_KEY` | **Yes (Prod)** | Resend API key for transactional emails (`re_...`). |
| `NOTIFY_FROM_EMAIL` | **Yes (Prod)** | Verified sending address (e.g. `"Nirai Handlooms <orders@nirai.in>"`). |
| `NOTIFY_WEBHOOK_SECRET` | **Yes** | Shared secret header authenticating Edge Function triggers. |
| `NOTIFY_DOMAIN_VERIFIED` | Optional | Set to `'true'` once DNS verification (SPF/DKIM/DMARC) is complete. |

> **Note**: Runtime environment configuration is validated on startup via `src/config/env.ts`. If required variables are missing or empty, a descriptive error will be thrown.

---

## Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite local development server on `http://localhost:3000`. |
| `npm run build` | Compiles TypeScript and builds optimized production assets in `/dist`. |
| `npm run preview` | Previews the production build locally on `http://localhost:4173`. |
| `npm run typecheck` | Runs TypeScript type checking without emitting files (`tsc --noEmit`). |
| `npm run analyze` | Builds with interactive Rollup bundle treemap analyzer (`dist/stats.html`). |
| `npm run clean` | Removes the compiled `/dist` directory. |

---

## Performance & Error Monitoring

- **Bundle Size & Reliability Report**: See [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md) for full chunk sizes, Core Web Vitals targets, and loading/empty/error state audits.
- **Sentry Integration**:
  - Lazily initialized via `requestIdleCallback` to protect the initial main thread.
  - Privacy First: `sendDefaultPii: false`, scrubbing of emails, phone numbers, and UTRs via `beforeSend`.
  - Sensitive routes (`/pay`, `/checkout`, `/account`, `/admin`) have bodies and headers completely stripped.
  - Zero crashes when blocked by client-side ad-blockers.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Anbarasan6/Nirai.git
cd Nirai

# Install dependencies
npm install
```

### 3. Database Setup (Supabase)
1. Create a project on [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [supabase-setup.sql](supabase-setup.sql) to create:
   - Product, category, order, coupon, supplier, courier, and stock movement tables.
   - Performance indexes.
   - Row Level Security (RLS) policies for public catalog reads and order placement.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Folder Structure

```text
├── public/                     # Public static assets
│   ├── robots.txt              # Search engine crawler directives
│   └── sitemap.xml             # Storefront XML sitemap
├── src/
│   ├── config/
│   │   └── env.ts              # Validated environment configuration
│   ├── context/
│   │   └── ShopContext.tsx      # Global state provider (cart, currency, auth, toast)
│   ├── components/
│   │   ├── admin/              # Lazy-loaded admin panels (Orders, Products, Couriers, etc.)
│   │   ├── common/             # Reusable UI (Header, Footer, AuthModal, ErrorBoundary)
│   │   └── storefront/         # Customer pages (Catalog, ProductDetail, Cart, Checkout, Tracking)
│   ├── data/
│   │   ├── initialData.ts      # Seed catalog, handloom categories, banners, and mock courier data
│   │   └── translations.ts     # English & Tamil dictionary strings
│   ├── pages/
│   │   ├── admin/AdminPages.tsx # Admin routing hub with code splitting
│   │   └── ...                 # Storefront route pages
│   ├── services/
│   │   ├── cloudinary.ts       # Cloudinary upload service
│   │   ├── mediaService.ts     # Image validation and optimization service
│   │   ├── storage.ts          # StorageService with price validation & fallback cache
│   │   └── supabase.ts         # Direct Supabase database client and sync
│   ├── types/
│   │   └── index.ts            # Core TypeScript interfaces (Product, Order, User, etc.)
│   ├── App.tsx                 # Root router and layout shell
│   └── main.tsx                # Application bootstrapping
├── .env.example                # Sanitized environment template
├── package.json                # Project dependencies and npm scripts
├── supabase-setup.sql          # Complete Supabase schema and RLS policies
├── PROJECT_ANALYSIS.md         # Full production-readiness architecture audit
├── SECURITY_TODO.md            # Manual key rotation and credential hardening steps
└── vite.config.ts              # Vite 8 configuration with Tailwind v4
```

---

## 🚨 Production Launch Blockers Checklist

Before promoting the storefront to production and accepting real customer orders, the following **mandatory blockers** must be resolved:

- [ ] **[CRITICAL] Supabase Auth Custom SMTP Configuration**:
  - The built-in Supabase Auth email service is capped at ~3-4 emails/hour. Real user registrations, confirmations, and password resets will fail.
  - Follow [docs/SUPABASE_SMTP_SETUP.md](docs/SUPABASE_SMTP_SETUP.md) to configure Resend Custom SMTP (`smtp.resend.com:465`).
  - Deploy bilingual (English & Tamil) email templates for Sign Up Confirmation and Password Reset.
- [ ] **[CRITICAL] Resend Sending Domain Verification (SPF / DKIM / DMARC)**:
  - Without a verified sending domain, Resend will **ONLY deliver emails to the account owner's own email address**. Real customer notifications will fail with HTTP 403.
  - Add DNS records for `nirai.in` (SPF: `v=spf1 include:resend.com ~all`, DKIM: `resend._domainkey`, DMARC: `v=DMARC1; p=none; rua=mailto:postmaster@nirai.in`).
  - Verify that the domain badge shows **Verified** in the Resend dashboard.
- [ ] **Configure Supabase Edge Function Secrets**:
  - `RESEND_API_KEY`: API key for outbound transactional emails.
  - `NOTIFY_FROM_EMAIL`: Set to verified domain email, e.g. `"Nirai Handlooms <orders@nirai.in>"`.
  - `NOTIFY_WEBHOOK_SECRET`: Secure shared secret header for authenticating triggers.
  - `CRON_SECRET`: Secret header for invoking automated background jobs.
- [ ] **Automated Expiry & Reminders Background Jobs**:
  - Verify `expire_unpaid_orders` runs every 15 minutes (`*/15 * * * *`).
  - Verify `check_payment_reminders` enqueues 4-hour payment expiration warnings.
- [ ] **Rotate Default Admin Passwords & Enforce RLS**:
  - Ensure all database tables enforce Row Level Security (RLS).
  - Verify anonymous users cannot execute privileged RPC functions.

---

## Production Deployment

### Vercel / Netlify
1. Connect your repository to Vercel or Netlify.
2. Set build command to `npm run build` and output directory to `dist`.
3. Add the production environment variables in your deployment dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
   - `APP_URL`
4. Configure SPA fallback rewriting so all non-asset routes point to `/index.html`.

---

## License

Private project © Nirai. All rights reserved.

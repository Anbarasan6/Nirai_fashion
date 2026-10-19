# Environments & Configuration Architecture

Nirai Handlooms operates with three distinct environments: **Local**, **Preview/Staging**, and **Production**.

---

## 1. Environment Separation Matrix

| Environment | Frontend Host | Supabase Project | Cloudinary Folder / Preset | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | `http://localhost:3000` | Local Supabase (`127.0.0.1:54322`) or Staging Project | `nirai_dev` | Developer machine (`.env.local`) |
| **Preview / Staging** | Vercel Preview (`*.vercel.app`) | Staging Supabase Project | `nirai_staging` | PR branch preview builds |
| **Production** | `https://nirai.in` (`dist/`) | Production Supabase Project (`lqzrahjmgzdsbosywjju`) | `nirai_prod` | Live storefront (Protected) |

---

## 2. Variable Classification & Scopes

### A. Client-Side Variables (`VITE_*`)
These variables are compiled into the JavaScript bundle in `dist/assets/` and are **publicly readable** by any visitor inspecting browser network requests or scripts.

> **CRITICAL SECURITY RULE:**  
> **NO SECRET OR PRIVATE CREDENTIAL MAY EVER CARRY A `VITE_` PREFIX.**

| Variable | Scope | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Vercel (Preview + Prod), Local | Public URL | Public Supabase API Gateway URL (`https://<project>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Vercel (Preview + Prod), Local | Public Key | RLS-restricted anonymous API key for public storefront |
| `VITE_CLOUDINARY_CLOUD_NAME` | Vercel (Preview + Prod), Local | Public Name | Cloudinary tenant account name |
| `VITE_CLOUDINARY_UPLOAD_PRESET`| Vercel (Preview + Prod), Local | Public Preset | Unsigned upload preset for customer payment proof uploads |
| `VITE_SENTRY_DSN` | Vercel (Preview + Prod) | Public DSN | Sentry project ingest DSN (optional, graceful fallback if empty) |
| `VITE_SITE_URL` | Vercel (Preview + Prod), Local | Public URL | Canonical site URL (Production: `https://nirai.in`) |
| `VITE_NOTIFY_DOMAIN_VERIFIED` | Vercel (Preview + Prod) | Boolean Flag | Enables verified domain status in Admin notifications tab |

---

### B. Server-Only Secrets
These credentials **NEVER exist in Vercel client environment** or in `import.meta.env`. They are stored exclusively in **Supabase Vault / Edge Function Secrets** or as private GitHub Actions repository secrets.

| Secret Name | Storage Location | Accessible By | Purpose |
| :--- | :--- | :--- | :--- |
| `RESEND_API_KEY` | Supabase Secrets | `send-notifications` Edge Function | Transacting customer emails via Resend |
| `NOTIFY_WEBHOOK_SECRET` | Supabase Secrets | Database Webhook / Cron Header | Authenticating edge function invocations |
| `CRON_SECRET` | Supabase Secrets | `pg_cron` / `pg_net` | Authorizing scheduled batch jobs |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secrets / GitHub Secrets | Supabase Edge Functions & CI | Elevated privileges for internal database operations |
| `DATABASE_URL` | Local / Staging / CI | Node test runner (`npm run test:db`) | Direct Postgres connection for SQL test suite |

---

## 3. Environment Validation Script

A build-time validation hook runs via `src/config/env.ts` during every compilation. If any required variable (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`) is missing or blank, Vite terminates with a clear configuration error.

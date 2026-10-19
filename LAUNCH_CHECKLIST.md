# Nirai Handlooms (நிறை) — Comprehensive Production Launch Checklist

> [!CAUTION]
> **MANDATORY PRE-LAUNCH AUDIT**  
> Complete every item on this checklist before pointing public DNS or accepting real customer transactions.

---

## 1. 🔑 Secrets and Keys
- [ ] **Rotate Exposed Keys**: Rotate any Gemini API key, AI Gateway key, Resend key, or Supabase service role key that ever lived in git history or developer logs.
- [ ] **Full-History Secret Scan**: Run a full-history Gitleaks scan (`gitleaks detect --verbose`) to ensure zero unmasked secrets remain in git commits.
- [ ] **Verify Zero Client Secrets**: Confirm no server secret has a `VITE_` prefix in `.env` files or in Vercel client environment variables.
- [ ] **Supabase Vault Secrets**: Confirm `RESEND_API_KEY`, `NOTIFY_WEBHOOK_SECRET`, `CRON_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` live exclusively in Supabase secrets.

---

## 2. 🗄️ Supabase Database & Authentication
- [ ] **Row Level Security (RLS)**: Confirm 100% of public tables enforce RLS (`npm run prod:check`).
- [ ] **Minimal Anon Grants**: Verify `anon` role can only read active products, active categories, and settings, and invoke safe RPCs (`quote_cart`, `track_order`, `submit_payment_proof`).
- [ ] **Custom SMTP via Resend**: Configure custom SMTP in **Supabase Dashboard > Authentication > SMTP Settings** (`smtp.resend.com`, port 465/587).
- [ ] **Bilingual Email Templates**: Deploy English + Tamil templates for Confirm Sign Up, Reset Password, and Magic Link.
- [ ] **Site URL & Redirect URLs**:
  - Site URL: `https://nirai.in`
  - Redirect URLs: `https://nirai.in/**`, `https://*.vercel.app/**`, `http://localhost:3000/**`
- [ ] **Password Security & Leaked-Password Protection**: Enable HaveIBeenPwned leaked password protection and minimum 8-character password policy in Supabase Auth.
- [ ] **Email Confirmations & Rate Limits**: Enable email confirmations on signup. Turn on Supabase Auth CAPTCHA (Cloudflare Turnstile or hCaptcha) and rate limits.

---

## 3. 💳 Payments & Reconciliation
- [ ] **Live Account Verification**: Send a test payment of ₹1 from GPay/PhonePe to the merchant UPI VPA and verify funds appear in the business bank account; execute a ₹1 refund to test reversal.
- [ ] **Dynamic QR Code**: Verify that scanning the QR code on the `/pay/:orderNumber` page pre-fills the exact merchant VPA and order amount.
- [ ] **Payment Deadline**: Verify the deadline is set (default: 24 hours).
- [ ] **Hourly Expiry Cron**: Confirm `expire_unpaid_orders()` cron job is active (`SELECT * FROM cron.job;`) and restocks inventory when orders expire.
- [ ] **Reconciliation Routine**: Establish daily 15-30 minute verification sweeps as documented in `docs/FIRST_72_HOURS_RUNBOOK.md`.

---

## 4. 📬 Notifications & Deliverability
- [ ] **Resend Custom Domain**: Add DNS records (SPF, DKIM, DMARC) for `nirai.in` in Resend Dashboard and confirm **Verified** status.
- [ ] **Inbox Deliverability Test**: Send test notifications to real Gmail, Yahoo, and Outlook inboxes and verify they land in the primary inbox, not Spam.
- [ ] **Sender Address**: Set `NOTIFY_FROM_EMAIL="Nirai Handlooms <orders@nirai.in>"`.
- [ ] **Outbox Concurrency**: Confirm outbox claiming uses `claim_notifications()` with `FOR UPDATE SKIP LOCKED`.

---

## 5. 🛍️ Catalog & Content
- [ ] **No Demo/Test Products**: Run `npm run prod:check` to ensure no mock or seed products exist in production database.
- [ ] **High-Resolution Images**: Verify all active products use real Cloudinary URLs with responsive transformations (`cldUrl`).
- [ ] **Accurate Inventory**: Count physical stock in warehouse and update `stock` and `low_stock_threshold` values.

---

## 6. 📊 Monitoring & Alerts
- [ ] **Sentry DSN**: Set `VITE_SENTRY_DSN` in Vercel Production environment with PII scrubbing verified (`tests/unit/sentryScrubber.test.ts`).
- [ ] **Uptime Monitor**: Configure UptimeRobot or BetterStack to ping `https://nirai.in/api/health` every 2 minutes.
- [ ] **5 Core Production Alerts**: Configure all 5 alerts detailed in `docs/UPTIME_AND_ALERTS.md` (Site Down, Outbox Failure > 0, Stale Pending Proofs > 24h, Expiry Missed > 1h, Sentry spike).

---

## 7. 🔍 SEO & Social Sharing
- [ ] **Sitemap Submission**: Submit `https://nirai.in/sitemap.xml` in Google Search Console.
- [ ] **robots.txt**: Verify `robots.txt` disallows `/admin`, `/account`, `/checkout`, `/pay`, `/tracking`, `/reset-password`.
- [ ] **WhatsApp / Social Preview Test**: Share a link to `https://nirai.in/product/<slug>` on WhatsApp, Facebook, and X to verify the edge middleware renders the preview image, title, and price.

---

## 8. ⚡ Performance & Budgets
- [ ] **First-Load JS Budget**: Gzip size must remain within 10% of committed `bundle-baseline.json` (`npm run budget:check`).
- [ ] **Lighthouse Mobile Score**: Run Lighthouse audit on `/`, `/catalog`, and PDP (target: Performance > 85, Accessibility > 95, SEO > 95).

---

## 9. ⚖️ Legal & Compliance
- [ ] **Legal Audit**: Review `docs/LEGAL_AND_TRUST_AUDIT.md`.
- [ ] **Grievance Officer**: Add designated Grievance Officer details to `/contact` and `/terms`.
- [ ] **Real GSTIN**: Replace placeholder GSTIN with real 15-digit GSTIN in footer and invoice templates.
- [ ] **Country of Origin**: Ensure "Country of Origin: India" is declared on product specifications.

---

## 10. 💾 Backups & Disaster Recovery
- [ ] **Supabase Pro Plan**: Enable Supabase Pro ($25/mo) for daily automated backups.
- [ ] **Manual Export Routine**: Schedule weekly `pg_dump` of business tables (`docs/BACKUPS_AND_DISASTER_RECOVERY.md`).
- [ ] **Restore Rehearsal**: Rehearse restoring database dump into a local test database.

---

## 11. 🔄 Rollback Readiness
- [ ] **Vercel Instant Rollback**: Confirm team members know how to trigger instant deployment rollback in Vercel dashboard (<60s).
- [ ] **Migration Rollback Scripts**: Ensure rollback scripts exist in `supabase/rollbacks/` for all schema alterations.
- [ ] **Checkout Killswitch**: Test emergency checkout pause toggle in `/admin/content`.

---

## 12. 👥 Team Access & MFA
- [ ] **Multi-Factor Authentication (MFA)**: Enforce MFA on:
  - [ ] GitHub organization / repository accounts
  - [ ] Vercel account
  - [ ] Supabase organization account
  - [ ] Resend account
  - [ ] Cloudinary account
  - [ ] Domain registrar / DNS provider account
- [ ] **Delete Demo Users**: Remove all non-production user accounts and assign strict RBAC (`admin`, `staff`).

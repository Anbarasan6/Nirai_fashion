# Nirai Handlooms (நிறை) — Production Launch Checklist

> [!CAUTION]
> **MANDATORY PRE-LAUNCH AUDIT**  
> Complete every item on this checklist before pointing public DNS or accepting real customer transactions.

---

## 🚨 Launch Blockers (Must Complete First)

### 1. Supabase Auth Custom SMTP (Rate-Limit Bypass)
- [ ] **Problem**: Default Supabase Auth email service is capped at ~3-4 emails per hour. Customers attempting to sign up, verify email, or reset password will get blocked.
- [ ] **Resolution**: Configure Resend Custom SMTP in Supabase Dashboard:
  - **Host**: `smtp.resend.com`
  - **Port**: `465` (SSL) or `587` (TLS)
  - **Username**: `resend`
  - **Password**: `<YOUR_RESEND_API_KEY>`
  - **Sender Email**: `orders@nirai.in` (or your verified domain address)
- [ ] **Deploy Bilingual Templates**: Copy and paste the English + Tamil templates from [docs/SUPABASE_SMTP_SETUP.md](docs/SUPABASE_SMTP_SETUP.md) into **Supabase Dashboard > Authentication > Email Templates** for:
  - Confirm Sign Up (`Verify your Nirai Account | உங்கள் நிறை கணக்கை உறுதிப்படுத்தவும்`)
  - Reset Password (`Reset your Nirai Password | உங்கள் நிறை கடவுச்சொல்லை மீட்டமைக்கவும்`)
  - Magic Link (`Your Nirai Sign-In Link | உங்கள் நிறை உள்நுழைவு இணைப்பு`)

---

### 2. Resend Sending Domain Verification (Deliverability)
- [ ] **Problem**: Without a verified domain, Resend runs in Sandbox Mode and will **ONLY deliver emails to the account owner's email address**. All customer notifications will fail with HTTP 403.
- [ ] **Resolution**: Add the following DNS records to your domain registrar (GoDaddy, Cloudflare, etc.):
  - **SPF**: `TXT` `@` with `v=spf1 include:resend.com ~all`
  - **DKIM**: `TXT` / `CNAME` `resend._domainkey` with the unique key from Resend Dashboard
  - **DMARC**: `TXT` `_dmarc` with `v=DMARC1; p=none; rua=mailto:postmaster@nirai.in`
- [ ] **Verification**: Ensure the domain shows **Verified** status in the Resend dashboard.
- [ ] **Set Flag**: Set `NOTIFY_DOMAIN_VERIFIED=true` in Edge Function environment.

---

## 🔑 Required Secrets & Environment Variables

Configure these secrets in Supabase Edge Functions:

```bash
# Set Edge Function secrets
supabase secrets set RESEND_API_KEY="re_..."
supabase secrets set NOTIFY_FROM_EMAIL="Nirai Handlooms <orders@nirai.in>"
supabase secrets set NOTIFY_WEBHOOK_SECRET="your_secure_random_webhook_secret"
supabase secrets set SITE_URL="https://nirai.in"
supabase secrets set NOTIFY_DOMAIN_VERIFIED="true"
supabase secrets set CRON_SECRET="your_secure_cron_secret"
```

In your frontend hosting platform (Vercel, Netlify):
```env
VITE_SUPABASE_URL=https://lqzrahjmgzdsbosywjju.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
VITE_NOTIFY_WEBHOOK_SECRET=your_secure_random_webhook_secret
APP_URL=https://nirai.in
```

---

## ⏰ Automated Scheduled Jobs (pg_cron)

Verify scheduled background tasks in Supabase SQL Editor (`SELECT * FROM cron.job;`):

- [ ] **`expire-unpaid-orders`**: Runs every 15 minutes (`*/15 * * * *`)
  - Executes `public.expire_unpaid_orders()`
  - Cancels orders exceeding 24h payment window and restores reserved stock to inventory
- [ ] **`payment-reminders`**: Runs every 15 minutes (`*/15 * * * *`)
  - Executes `public.check_payment_reminders()`
  - Enqueues reminders 4 hours before deadline for unpaid orders
- [ ] **`send-notifications`**: Runs every 5 minutes (`*/5 * * * *`)
  - Invokes `send-notifications` Edge Function
  - Processes pending outbox rows with `claim_notifications()` (FOR UPDATE SKIP LOCKED)

---

## 🛡️ Security & Role Enforcement

- [ ] **Row Level Security**: Verify `notifications_outbox` has RLS enabled and 0 public policies (access only via service role or `list_notifications` RPC).
- [ ] **Staff Authorization**: Verify only staff/admin accounts can access `/admin` and execute verification RPCs.
- [ ] **Storage Buckets**: Ensure `payment-receipts` bucket is private with signed URLs for staff viewing.

---

## 🧪 Pre-Launch Smoke Tests

1. Place a guest test order:
   - Verify `order_placed` notification row created in `notifications_outbox`.
   - Verify Pay Now link points to `/pay/<orderNumber>`.
2. Submit UPI UTR payment proof:
   - Verify order status moves to `Verification Pending`.
   - Verify customer receives `payment_proof_received` notification.
   - Verify admin receives `admin_payment_pending` alert.
3. Verify payment in `/admin/orders?tab=payments`:
   - Click "Approve & Confirm Order".
   - Verify `payment_verified` notification enqueued.
4. Mark Shipped with Courier & AWB:
   - Verify `shipped` notification enqueued with tracking link.

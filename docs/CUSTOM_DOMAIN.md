# Custom Domain Configuration Guide (`nirai.in`)

---

## 1. Vercel Domain Setup

1. Go to **Vercel Dashboard > Project > Settings > Domains**.
2. Add both domain variants:
   - `nirai.in`
   - `www.nirai.in`
3. Configure **Redirect Rule**:
   - Recommended: Select `www.nirai.in` to automatically 308-redirect to the apex domain `nirai.in` (or vice-versa).
4. Vercel will automatically provision and renew Let's Encrypt / DigiCert SSL certificates (HTTPS).

---

## 2. DNS Records Configuration (Registrar / Cloudflare / Route53)

Configure the following DNS records at your domain registrar or DNS provider:

| Type | Name / Host | Target / Value | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (apex) | `76.76.21.21` | Auto / 3600 | Points `nirai.in` to Vercel Anycast edge |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 3600 | Handles `www.nirai.in` routing |

---

## 3. External Services Update Checklist

Once the custom domain is active and resolves with valid HTTPS:

### A. Supabase Authentication
In **Supabase Dashboard > Authentication > URL Configuration**:
1. **Site URL**: `https://nirai.in`
2. **Redirect URLs**:
   - `https://nirai.in/**`
   - `https://*.vercel.app/**` (For Staging / Preview environments only)
   - `http://localhost:3000/**` (For Local development)

### B. Resend (Sending Domain)
In **Resend Dashboard > Domains**:
1. Add `nirai.in`.
2. Add the generated DNS records to your DNS provider:
   - **SPF**: `TXT @ v=spf1 include:resend.com ~all`
   - **DKIM**: `TXT resend._domainkey <unique-key>`
   - **DMARC**: `TXT _dmarc v=DMARC1; p=none; rua=mailto:dmarc@nirai.in`
3. Once verified, update `NOTIFY_FROM_EMAIL` in Supabase Secrets to:  
   `Nirai Handlooms <orders@nirai.in>`.

### C. Cloudinary Media Security
In **Cloudinary Dashboard > Settings > Security**:
1. **Allowed Origins**: `https://nirai.in`, `https://*.vercel.app`, `http://localhost:3000`.
2. Restrict unsigned upload presets (`VITE_CLOUDINARY_UPLOAD_PRESET`) to allow only image mime-types (`image/jpeg`, `image/png`, `image/webp`).

### D. Sentry (Error Tracking)
In **Sentry Dashboard > Project Settings > Inbound Filters**:
1. **Allowed Domains**: `nirai.in`, `*.vercel.app`, `localhost`.
2. Scrub IP addresses and PII enabled.

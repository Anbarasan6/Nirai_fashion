# Security Checklist & Key Rotation Action Plan

> **CRITICAL**: The following keys, credentials, or presets were previously present in development files or earlier commit history. Before launching to public production, execute the following manual rotation steps.

---

## 1. Supabase Anonymous API Key Rotation
- [ ] **Action**: Rotate the Supabase `anon` public key.
- **Where**: [Supabase Dashboard](https://supabase.com/dashboard) → Select Project → **Project Settings** → **API** → **JWT Secret / API Keys**.
- **Steps**:
  1. Under **Project API Keys**, note your current `anon` key.
  2. Click **Generate new JWT Secret** / **Rotate API Keys** (follow Supabase prompts to regenerate).
  3. Copy the newly generated `anon` key.
  4. Update `VITE_SUPABASE_ANON_KEY` in your local `.env` and in your production deployment dashboard (e.g., Vercel, Netlify).
  5. Verify that your Supabase Row Level Security (RLS) policies from `supabase-setup.sql` remain enabled.

---

## 2. Cloudinary Upload Preset & Storage Hardening
- [ ] **Action**: Deactivate the old upload preset and create a new restricted preset.
- **Where**: [Cloudinary Console](https://console.cloudinary.com/) → **Settings (Gear Icon)** → **Upload** → **Upload presets**.
- **Steps**:
  1. Locate the legacy preset name (`nirai_preset`).
  2. Click **Delete** or **Disable** to prevent unauthorized uploads through the old identifier.
  3. Click **Add Upload Preset**:
     - **Mode**: *Unsigned*
     - **Folder**: `nirai/media`
     - **Allowed Formats**: `jpg, jpeg, png, webp`
     - **Max File Size**: `10485760` bytes (10 MB)
     - **Delivery Type**: *upload*
  4. Save the preset with a new unique name (e.g., `nirai_prod_media_2026`).
  5. Update `VITE_CLOUDINARY_UPLOAD_PRESET` and `VITE_CLOUDINARY_CLOUD_NAME` in your `.env` and production host.

---

## 3. Revoke Exposed Google Gemini API Key
- [ ] **Action**: Revoke the Gemini API key exposed in previous commit history.
- **Where**: [Google AI Studio API Keys](https://aistudio.google.com/app/apikey) or [Google Cloud Credentials Console](https://console.cloud.google.com/apis/credentials).
- **Steps**:
  1. Open the API keys dashboard.
  2. Find the key that was previously configured for this project.
  3. Click **Delete / Revoke**.
  4. *Note*: The Nirai e-commerce storefront does not use Google Gemini API in production; this key has been completely removed from dependencies and code.

---

## 4. Change Default Admin Credentials
- [ ] **Action**: Update admin email and set a strong, unique administrative passkey.
- **Where**: Supabase SQL Editor / `users` table or Admin Settings.
- **Steps**:
  1. The default demo administrator in seed data used `admin@nirai.in` with temporary passkeys (`admin123` / `Nirai@2026`).
  2. Update your production admin record in the Supabase `users` table:
     ```sql
     UPDATE users 
     SET password = 'YOUR_NEW_SECURE_ADMIN_PASSPHRASE', 
         email = 'your-secure-admin@nirai.in' 
     WHERE email = 'admin@nirai.in';
     ```
  3. Verify that 1-click test authorization buttons remain deleted in [AdminLayout.tsx](file:///d:/projects/Nirai_New/Nirai/src/components/admin/AdminLayout.tsx).

---

## 5. Payment Gateway Production Keys (Razorpay / Cashfree)
- [ ] **Action**: Prepare production payment gateway separation.
- **Rules**:
  1. **NEVER** expose `RAZORPAY_KEY_SECRET` in any file with a `VITE_` prefix or in client-side code.
  2. Only public `KEY_ID` (e.g., `rzp_live_xxxxxxxx`) belongs in frontend configurations.
  3. Server-side payment verification (signature calculation with HMAC SHA256) and webhooks MUST run within a backend service or Supabase Edge Function (`/supabase/functions/verify-payment`).

---

## 6. Purging Git History (Optional Before Making Repository Public)
- [ ] **Action**: Purge historical commits if making the repository open-source.
- If this repository will ever be published as an open-source public repository, run [git-filter-repo](https://github.com/newren/git-filter-repo) or [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to remove old commits where keys were originally introduced:
  ```bash
  # Example with git-filter-repo:
  pip install git-filter-repo
  git-filter-repo --replace-text <(echo 'old_secret_value==>REDACTED')
  ```
  *(If maintaining as a private repository, rotating keys as described in steps 1–4 is sufficient).*

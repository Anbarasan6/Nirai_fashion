# Vercel Deployment & Branch Strategy Guide

---

## 1. Branch Strategy

- **`main`**: Represents the **Production** branch. Every commit or merge to `main` automatically triggers a production deployment on Vercel at `https://nirai.in`.
- **`prod-hardening`**: The feature hardening branch. Merges into `main` exclusively through a Pull Request with all CI checks passing.
- **Feature Branches**: Branch off `main` or `prod-hardening`. Opening a PR creates an isolated Vercel **Preview Deployment**.

---

## 2. Exact Vercel Project Settings

Configure these in the Vercel Dashboard under **Project Settings**:

| Setting | Value |
| :--- | :--- |
| **Framework Preset** | `Vite` |
| **Root Directory** | `./` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm ci` |
| **Node.js Version** | `22.x` |
| **Production Branch** | `main` |

---

## 3. Environment Variable Scopes in Vercel

Under **Project Settings > Environment Variables**, add variables with specific scopes:

### Production Scope Only (Applies to `main`):
- `VITE_SUPABASE_URL`: `https://lqzrahjmgzdsbosywjju.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `<PRODUCTION_ANON_KEY>`
- `VITE_CLOUDINARY_CLOUD_NAME`: `<PRODUCTION_CLOUD_NAME>`
- `VITE_CLOUDINARY_UPLOAD_PRESET`: `<PRODUCTION_UPLOAD_PRESET>`
- `VITE_SITE_URL`: `https://nirai.in`
- `VITE_NOTIFY_DOMAIN_VERIFIED`: `true` (when DNS is verified)
- `VITE_SENTRY_DSN`: `<PRODUCTION_SENTRY_DSN>`

### Preview Scope Only (Applies to PR Previews):
- `VITE_SUPABASE_URL`: `<STAGING_SUPABASE_URL>`
- `VITE_SUPABASE_ANON_KEY`: `<STAGING_ANON_KEY>`
- `VITE_CLOUDINARY_CLOUD_NAME`: `<STAGING_CLOUD_NAME>`
- `VITE_CLOUDINARY_UPLOAD_PRESET`: `<STAGING_UPLOAD_PRESET>`
- `VITE_SITE_URL`: `https://staging.nirai.in` (or preview URL)
- `VITE_NOTIFY_DOMAIN_VERIFIED`: `false`

---

## 4. Preview Deployment Protection

To prevent search engines or uninvited visitors from browsing staging or testing orders:
1. Navigate to **Project Settings > Deployment Protection**.
2. Enable **Vercel Authentication** or **Password Protection** for **Preview Deployments**.
3. Choose **Standard Protection** (Visitors must enter a password or log in via Vercel SSO to see preview URLs).
4. Ensure **Production Deployment Protection** is disabled (storefront is public).

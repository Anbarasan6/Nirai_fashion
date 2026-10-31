# Docker Setup & Free Domain Hosting Guide

This guide explains how to containerize the **Nirai E-Commerce** platform with Docker and Nginx, and host it using **100% free domain and hosting options**.

---

## 1. Architecture Overview

- **Multi-stage Dockerfile**:
  - **Stage 1 (Builder)**: Node.js 20 Alpine compiles TypeScript and bundles the Vite SPA using production tree-shaking and minification.
  - **Stage 2 (Runner)**: Ultralightweight Nginx (~25MB image) serves static assets with Gzip compression, immutable 1-year caching for `/assets/`, SPA client-side routing fallback, security headers, and an active `/health` check.
- **Docker Compose**: Orchestrates the web container and an optional **Cloudflare Zero-Trust Tunnel** for free HTTPS domain mapping.

---

## 2. Local Docker Quickstart

### Step 1: Prepare Environment File
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure your public variables are populated:
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
VITE_SITE_URL=http://localhost
```

### Step 2: Build & Run the Container
```bash
docker compose up --build -d
```

### Step 3: Verify Container Health
Visit `http://localhost` in your browser.
Test the health check endpoint:
```bash
curl http://localhost/health
# Returns: healthy (HTTP 200)
```

To stop the container:
```bash
docker compose down
```

---

## 3. Top 3 Free Domain & Hosting Options

You can host the Docker container or deploy the repository using any of the following free methods:

### Option A: Render.com (Recommended — Simplest Free Cloud Docker Hosting)

Render provides a **free web service tier** with automated Docker builds, free continuous deployment from GitHub, and a **free HTTPS subdomain** (`*.onrender.com`).

1. Push your changes to GitHub:
   ```bash
   git add Dockerfile nginx.conf .dockerignore docker-compose.yml
   git commit -m "feat(docker): add production multi-stage Dockerfile and Nginx setup"
   git push origin main
   ```
2. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New > Web Service**.
3. Select your GitHub repository (`Nirai_fashion`).
4. Select **Docker** as the runtime environment.
5. In **Environment Variables / Build Arguments**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
   - `VITE_SITE_URL`: `https://your-service-name.onrender.com`
6. Click **Create Web Service**.
7. Your store will be live at `https://your-service-name.onrender.com` with free automated SSL.

---

### Option B: Cloudflare Zero Trust Tunnel (Host Docker with 100% Free HTTPS Domain)

If you are running Docker on your own machine, a local server, or a free VPS (such as Oracle Cloud Always Free VM), you can expose it using **Cloudflare Tunnels**.
- **No port forwarding required** (no router changes).
- **Free automated SSL** certificate.
- Works with free subdomains or custom domains.

#### Steps:
1. Log in to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/).
2. Navigate to **Networks > Tunnels** and click **Create a Tunnel**.
3. Name your tunnel (e.g., `nirai-store`) and select **Docker**.
4. Cloudflare will give you a tunnel run token (e.g., `eyJhIjoi...`).
5. Add the token to your `.env` file:
   ```ini
   CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...
   ```
6. Start both the web container and the tunnel:
   ```bash
   docker compose --profile tunnel up -d
   ```
7. In the Cloudflare Tunnel dashboard, set **Public Hostname**:
   - Subdomain: `store` (or root `@`)
   - Service Type: `HTTP`
   - URL: `web:80`
8. Your store is now accessible globally on your domain over HTTPS!

---

### Option C: Koyeb (Global Free Edge Docker Hosting)

Koyeb offers a **Free Eco Tier** designed for containerized applications.

1. Create a free account at [koyeb.com](https://www.koyeb.com/).
2. Click **Create App** and choose **GitHub**.
3. Select your repository and choose **Dockerfile** build method.
4. Set the port to `80`.
5. Enter your `VITE_*` build arguments in the environment settings.
6. Deploy to receive an instant free URL: `https://<app-name>.koyeb.app`.

---

## 4. How to Get a Free Custom Domain

If you want a custom domain instead of a provider subdomain (`.onrender.com` / `.koyeb.app`), use one of these free options:

1. **DuckDNS** (100% Free Subdomains forever):
   - Register a free subdomain like `nirai-store.duckdns.org` at [duckdns.org](https://www.duckdns.org/).
   - Point the DNS record to your server or configure it via Cloudflare / Nginx.
2. **FreeDNS (afraid.org)**:
   - Provides free subdomains under popular shared domains.
3. **GitHub Student Developer Pack**:
   - If you have an active `.edu` email or student status, claim a **free `.me` or `.tech` domain for 1 year** via Namecheap or Name.com.

---

## 5. Important Production Notes for Free Hosting

1. **Vite Build-Time Variables**:
   In Vite, any `VITE_*` variable is baked into the JavaScript bundle during `npm run build`. When deploying to Render, Koyeb, or Docker, ensure you configure them as **Build Arguments** or **Environment Variables** before triggering the build.
2. **Supabase Allowed Redirect URLs**:
   Whenever your free domain URL changes (e.g. `https://nirai.onrender.com`), make sure to add it to:
   - **Supabase Dashboard > Authentication > URL Configuration > Redirect URLs**:
     `https://your-free-domain.onrender.com/**`

# ==============================================================================
# Nirai E-Commerce - Production Multi-Stage Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Static SPA Bundle
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install security updates & build dependencies
RUN apk add --no-cache libc6-compat

# Install npm dependencies first (utilizes Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy application source files
COPY . .

# Build arguments for Vite client-side environment variables
# Note: Vite injects VITE_* environment variables during static build time.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET
ARG VITE_SITE_URL
ARG VITE_SENTRY_DSN

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME \
    VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN

# Build production bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Ultralightweight Nginx Production Server (~25MB)
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Remove default nginx boilerplate configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy optimized nginx reverse proxy & SPA configuration
COPY nginx.conf /etc/nginx/conf.d/nirai.conf

# Copy static artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Healthcheck for container orchestrators (Render, Koyeb, Docker Compose, Coolify)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/health || exit 1

# Start Nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]

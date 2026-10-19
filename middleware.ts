/**
 * Vercel Edge Middleware for Social Crawler Previews (WhatsApp, X, Facebook, Googlebot, etc.)
 *
 * Intercepts requests ONLY from known crawlers that do not execute client-side JS,
 * fetches public entity metadata (active products/categories/storefront),
 * and returns lightweight, pre-rendered HTML with full OpenGraph/JSON-LD metadata.
 *
 * All human visitor traffic passes directly through to the client-side SPA.
 */

import {
  isBotUserAgent,
  renderCrawlerPageHtml,
  type CrawlerProduct,
  type CrawlerCategory,
} from './src/utils/seoBotHelper';

// Supabase configuration
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://lqzrahjmgzdsbosywjju.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const SITE_URL =
  process.env.SITE_URL ||
  process.env.VITE_SITE_URL ||
  'https://nirai.in';

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const config = {
  matcher: ['/', '/product/:path*', '/catalog/:path*'],
};

/**
 * Fetch with strict 2-second timeout using AbortController
 */
async function fetchWithTimeout(url: string, headers: HeadersInit, timeoutMs = 2000): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
    });
    return res;
  } catch {
    return null; // Timed out or network error -> fall back to pass-through
  } finally {
    clearTimeout(timer);
  }
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const userAgent = request.headers.get('user-agent');

  // If not a known crawler, immediately pass through untouched
  if (!isBotUserAgent(userAgent)) {
    return undefined;
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Supabase REST headers (public read-only via anon key)
  const restHeaders: HeadersInit = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Accept: 'application/json',
  };

  try {
    // 1. Product Detail Page: /product/:slug
    const productMatch = pathname.match(/^\/product\/([a-zA-Z0-9_-]+)/);
    if (productMatch) {
      const slug = productMatch[1];
      if (!slug || !SUPABASE_URL || !SUPABASE_ANON_KEY) return undefined;

      // Only query active products
      const endpoint = `${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=id,sku,name_en,name_ta,slug,description_en,images,final_price,stock,brand`;
      const res = await fetchWithTimeout(endpoint, restHeaders, 2000);

      if (!res || !res.ok) return undefined;
      const products: CrawlerProduct[] = await res.json();
      const product = products?.[0];

      if (!product) {
        return undefined; // Inactive or not found -> SPA will render 404
      }

      const imageUrl =
        Array.isArray(product.images) && product.images.length > 0 && product.images[0]
          ? product.images[0]
          : DEFAULT_OG_IMAGE;

      const title = `${product.name_en} | Nirai Handlooms`;
      const description =
        product.description_en ||
        `Handcrafted authentic handloom saree in pure traditional weave. Buy online with fast delivery across India.`;
      const canonicalUrl = `${SITE_URL}/product/${product.slug}`;

      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name_en,
        image: imageUrl,
        description,
        sku: product.sku || product.slug,
        brand: {
          '@type': 'Brand',
          name: product.brand || 'Nirai Handlooms',
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'INR',
          price: product.final_price,
          availability:
            product.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      };

      const extraMeta = `
  <meta property="product:price:amount" content="${product.final_price}" />
  <meta property="product:price:currency" content="INR" />
      `;

      const html = renderCrawlerPageHtml({
        title,
        description,
        canonicalUrl,
        imageUrl,
        type: 'product',
        jsonLd,
        extraMeta,
      });

      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    // 2. Category Page: /catalog/:categorySlug
    const categoryMatch = pathname.match(/^\/catalog\/([a-zA-Z0-9_-]+)/);
    if (categoryMatch) {
      const categorySlug = categoryMatch[1];
      if (!categorySlug || !SUPABASE_URL || !SUPABASE_ANON_KEY) return undefined;

      const endpoint = `${SUPABASE_URL}/rest/v1/categories?slug=eq.${encodeURIComponent(categorySlug)}&is_active=eq.true&select=id,slug,name_en,name_ta,description_en,image`;
      const res = await fetchWithTimeout(endpoint, restHeaders, 2000);

      if (!res || !res.ok) return undefined;
      const categories: CrawlerCategory[] = await res.json();
      const category = categories?.[0];

      if (!category) return undefined;

      const imageUrl = category.image || DEFAULT_OG_IMAGE;
      const title = `${category.name_en} Sarees Collection | Nirai Handlooms`;
      const description =
        category.description_en ||
        `Explore handcrafted ${category.name_en} sarees directly from master artisans. 100% authentic South Indian handlooms.`;
      const canonicalUrl = `${SITE_URL}/catalog/${category.slug}`;

      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url: canonicalUrl,
      };

      const html = renderCrawlerPageHtml({
        title,
        description,
        canonicalUrl,
        imageUrl,
        type: 'website',
        jsonLd,
      });

      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    // 3. Home Page: /
    if (pathname === '/' || pathname === '') {
      const title = 'Nirai Handlooms | Where Tradition Feels Complete';
      const description =
        'Authentic handwoven Kanchipuram, Banarasi, Soft Silk & Pure Cotton sarees direct from master weavers. Transparent pricing and secure delivery across India.';
      const canonicalUrl = `${SITE_URL}/`;

      const jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Nirai Handlooms',
          url: SITE_URL,
          logo: `${SITE_URL}/icon-512.png`,
          sameAs: ['https://instagram.com/niraihandlooms'],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Nirai Handlooms',
          url: SITE_URL,
        },
      ];

      const html = renderCrawlerPageHtml({
        title,
        description,
        canonicalUrl,
        imageUrl: DEFAULT_OG_IMAGE,
        type: 'website',
        jsonLd,
      });

      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }
  } catch {
    // If any error occurs during crawler handling, pass through to SPA
    return undefined;
  }

  // Pass through all other paths
  return undefined;
}

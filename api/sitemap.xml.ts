/**
 * Vercel Serverless Function: /api/sitemap.xml
 * Dynamically builds sitemap including active products, categories, and public static pages.
 * Never includes inactive products, admin, or customer account/checkout routes.
 * Cached for 1 hour with stale-while-revalidate.
 */

export const config = {
  runtime: 'nodejs',
};

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://lqzrahjmgzdsbosywjju.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const SITE_URL = (
  process.env.SITE_URL ||
  process.env.VITE_SITE_URL ||
  'https://nirai.in'
).replace(/\/$/, '');

interface SupabaseProductRow {
  slug: string;
  updated_at?: string;
  created_at?: string;
}

interface SupabaseCategoryRow {
  slug: string;
  updated_at?: string;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: any, res: any) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Static public routes (strictly excluding /admin, /account, /checkout, /pay, /tracking, /reset-password)
    const staticUrls = [
      { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
      { loc: `${SITE_URL}/catalog`, priority: '0.9', changefreq: 'daily', lastmod: today },
      { loc: `${SITE_URL}/about`, priority: '0.5', changefreq: 'monthly', lastmod: today },
      { loc: `${SITE_URL}/contact`, priority: '0.5', changefreq: 'monthly', lastmod: today },
      { loc: `${SITE_URL}/policies`, priority: '0.4', changefreq: 'monthly', lastmod: today },
      { loc: `${SITE_URL}/privacy-policy`, priority: '0.3', changefreq: 'monthly', lastmod: today },
      { loc: `${SITE_URL}/shipping-policy`, priority: '0.3', changefreq: 'monthly', lastmod: today },
      { loc: `${SITE_URL}/refund-policy`, priority: '0.3', changefreq: 'monthly', lastmod: today },
      { loc: `${SITE_URL}/return-policy`, priority: '0.3', changefreq: 'monthly', lastmod: today },
      { loc: `${SITE_URL}/cancellation-policy`, priority: '0.3', changefreq: 'monthly', lastmod: today },
      { loc: `${SITE_URL}/terms`, priority: '0.3', changefreq: 'monthly', lastmod: today },
      { loc: `${SITE_URL}/faq`, priority: '0.4', changefreq: 'monthly', lastmod: today },
    ];

    let dynamicUrls: Array<{ loc: string; priority: string; changefreq: string; lastmod: string }> = [];

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const restHeaders = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      };

      // 1. Fetch active categories
      try {
        const catRes = await fetch(
          `${SUPABASE_URL}/rest/v1/categories?is_active=eq.true&select=slug,updated_at`,
          { headers: restHeaders }
        );
        if (catRes.ok) {
          const categories: SupabaseCategoryRow[] = await catRes.json();
          categories.forEach((c) => {
            if (c.slug) {
              const lastmod = c.updated_at ? c.updated_at.split('T')[0] : today;
              dynamicUrls.push({
                loc: `${SITE_URL}/catalog/${encodeURIComponent(c.slug)}`,
                priority: '0.8',
                changefreq: 'weekly',
                lastmod,
              });
            }
          });
        }
      } catch (err) {
        console.warn('Sitemap categories fetch failed:', err);
      }

      // 2. Fetch active products
      try {
        const prodRes = await fetch(
          `${SUPABASE_URL}/rest/v1/products?is_active=eq.true&select=slug,updated_at,created_at`,
          { headers: restHeaders }
        );
        if (prodRes.ok) {
          const products: SupabaseProductRow[] = await prodRes.json();
          products.forEach((p) => {
            if (p.slug) {
              const lastmod = p.updated_at
                ? p.updated_at.split('T')[0]
                : p.created_at
                ? p.created_at.split('T')[0]
                : today;
              dynamicUrls.push({
                loc: `${SITE_URL}/product/${encodeURIComponent(p.slug)}`,
                priority: '0.8',
                changefreq: 'weekly',
                lastmod,
              });
            }
          });
        }
      } catch (err) {
        console.warn('Sitemap products fetch failed:', err);
      }
    }

    const allUrls = [...staticUrls, ...dynamicUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`.trim();

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error: any) {
    console.error('Error generating sitemap:', error);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(500).send('Error generating sitemap');
  }
}

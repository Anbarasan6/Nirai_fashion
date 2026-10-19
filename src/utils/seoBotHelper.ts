/**
 * SEO Crawler and Bot Helpers for Vercel Edge Middleware
 * Matches social platforms and search engines that don't execute client-side JS
 */

export const BOT_USER_AGENTS_REGEX =
  /(WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Googlebot|bingbot)/i;

/**
 * Checks if the request User-Agent matches known social and search crawlers
 */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || typeof userAgent !== 'string') return false;
  return BOT_USER_AGENTS_REGEX.test(userAgent);
}

/**
 * Safely HTML-escapes all strings to prevent XSS or broken tag injection
 */
export function escapeHtml(unsafe: string | number | null | undefined): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface CrawlerProduct {
  id: string;
  sku: string;
  name_en: string;
  name_ta?: string | null;
  slug: string;
  description_en?: string | null;
  images?: string[] | null;
  final_price: number;
  stock: number;
  brand?: string | null;
  is_active?: boolean;
}

export interface CrawlerCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ta?: string | null;
  description_en?: string | null;
  image?: string | null;
  is_active?: boolean;
}

/**
 * Builds minimal, valid HTML with complete OpenGraph, Twitter, canonical, and JSON-LD tags
 */
export function renderCrawlerPageHtml({
  title,
  description,
  canonicalUrl,
  imageUrl,
  type = 'website',
  jsonLd,
  extraMeta = '',
}: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  type?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  extraMeta?: string;
}): string {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeUrl = escapeHtml(canonicalUrl);
  const safeImage = escapeHtml(imageUrl);
  const safeType = escapeHtml(type);

  const jsonLdScript = jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${safeUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:type" content="${safeType}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:site_name" content="Nirai Handlooms" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />
  ${extraMeta}
  ${jsonLdScript}
</head>
<body style="font-family: system-ui, sans-serif; background: #FAF9F5; color: #2D1619; padding: 2rem; max-width: 600px; margin: 0 auto; text-align: center;">
  <h1>${safeTitle}</h1>
  <p>${safeDesc}</p>
  <img src="${safeImage}" alt="${safeTitle}" style="max-width: 100%; border-radius: 8px; margin-top: 1rem;" />
  <p><a href="${safeUrl}" style="color: #431B21; font-weight: bold;">Visit Nirai Handlooms</a></p>
</body>
</html>`;
}

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Product } from '../../types';

export interface SeoBreadcrumbItem {
  name: string;
  url: string;
}

export interface SeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

export const DEFAULT_SITE_TITLE = 'Nirai Handlooms | Where Tradition Feels Complete';
export const DEFAULT_SITE_DESCRIPTION =
  'Premier South Indian traditional and contemporary ethnic clothing e-commerce platform. Authentic Kanchipuram silk sarees, Salem cotton dhotis, pure linen shirts, and celebratory kids wear.';
export const DEFAULT_SITE_URL = 'https://nirai.in';
export const DEFAULT_OG_IMAGE = 'https://nirai.in/og-image.jpg';

/**
 * Strips tracking query parameters (utm_*, fbclid, gclid, etc.)
 * and catalog filters/sorting to prevent duplicate-content indexing.
 */
export function cleanCanonicalUrl(rawPathOrUrl?: string): string {
  let target = rawPathOrUrl || (typeof window !== 'undefined' ? window.location.pathname : '/');

  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = `${DEFAULT_SITE_URL}${target.startsWith('/') ? '' : '/'}${target}`;
  }

  try {
    const parsed = new URL(target, DEFAULT_SITE_URL);

    // Normalize path: remove trailing slash (except root)
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    return `${DEFAULT_SITE_URL}${pathname}`;
  } catch {
    return `${DEFAULT_SITE_URL}/`;
  }
}

/**
 * Builds Schema.org/Product structured data.
 * STRICT RULE: AggregateRating is NEVER included unless real reviews exist (reviewCount > 0 && rating > 0).
 */
export function buildProductJsonLd(product: Product, productUrl: string): Record<string, any> {
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((img) => (img.startsWith('http') ? img : `${DEFAULT_SITE_URL}${img}`))
    : [DEFAULT_OG_IMAGE];

  const price = product.finalPrice || product.basePrice || 0;
  const inStock = (product.stock ?? 0) > 0;

  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameEn,
    image: images,
    description: product.shortDescEn || product.descriptionEn || `${product.nameEn} handcrafted by Nirai artisans.`,
    sku: product.sku || `NIRAI-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Nirai Handlooms',
    },
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'INR',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: productUrl,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Nirai Handlooms',
      },
    },
  };

  // Only add AggregateRating if real reviews exist and rating data is genuine
  if (product.reviewCount && product.reviewCount > 0 && product.rating && product.rating > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.rating.toFixed(1)),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return data;
}

/**
 * Builds Schema.org/BreadcrumbList structured data.
 */
export function buildBreadcrumbJsonLd(items: SeoBreadcrumbItem[]): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${DEFAULT_SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Builds Schema.org/Organization + Schema.org/WebSite structured data for Homepage.
 */
export function buildHomeJsonLd(): Record<string, any>[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Nirai Handlooms',
      url: DEFAULT_SITE_URL,
      logo: `${DEFAULT_SITE_URL}/favicon.svg`,
      description: DEFAULT_SITE_DESCRIPTION,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-98400-00000',
        contactType: 'Customer Service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Tamil'],
      },
      sameAs: [
        'https://instagram.com/niraihandlooms',
        'https://facebook.com/niraihandlooms',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Nirai Handlooms',
      url: DEFAULT_SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${DEFAULT_SITE_URL}/catalog?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

export const Seo: React.FC<SeoProps> = ({
  title,
  description = DEFAULT_SITE_DESCRIPTION,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  ogUrl,
  twitterCard = 'summary_large_image',
  noindex = false,
  jsonLd,
}) => {
  // Title formatting rule: "Page | Nirai Handlooms"
  const formattedTitle = title
    ? (title.toLowerCase().includes('nirai') ? title : `${title} | Nirai Handlooms`)
    : DEFAULT_SITE_TITLE;

  const canonicalUrl = cleanCanonicalUrl(canonical);
  const effectiveOgTitle = ogTitle ? (ogTitle.includes('Nirai') ? ogTitle : `${ogTitle} | Nirai Handlooms`) : formattedTitle;
  const effectiveOgDesc = ogDescription || description;
  const effectiveOgUrl = ogUrl || canonicalUrl;
  const effectiveOgImage = ogImage.startsWith('http') ? ogImage : `${DEFAULT_SITE_URL}${ogImage}`;

  const jsonLdPayloads = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      {/* Primary HTML Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots Directive */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:title" content={effectiveOgTitle} />
      <meta property="og:description" content={effectiveOgDesc} />
      <meta property="og:url" content={effectiveOgUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Nirai Handlooms" />
      <meta property="og:image" content={effectiveOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={effectiveOgTitle} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={effectiveOgTitle} />
      <meta name="twitter:description" content={effectiveOgDesc} />
      <meta name="twitter:image" content={effectiveOgImage} />
      <meta name="twitter:image:alt" content={effectiveOgTitle} />

      {/* Structured Data (JSON-LD) */}
      {jsonLdPayloads.map((payload, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(payload)}
        </script>
      ))}
    </Helmet>
  );
};

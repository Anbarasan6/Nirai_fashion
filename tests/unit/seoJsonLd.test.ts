import { describe, it, expect } from 'vitest';
import {
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  buildHomeJsonLd,
  cleanCanonicalUrl,
} from '../../src/components/common/Seo';
import type { Product } from '../../src/types';

describe('SEO & JSON-LD Builders', () => {
  const baseProduct: Product = {
    id: 'prod_001',
    sku: 'KAN-SILK-001',
    slug: 'kanchipuram-pure-silk-red',
    nameEn: 'Bridal Kanchipuram Pure Silk Saree',
    nameTa: 'காஞ்சிபுரம் பட்டுப் புடவை',
    descriptionEn: 'Pure zari woven bridal silk saree.',
    descriptionTa: '',
    shortDescEn: '',
    shortDescTa: '',
    categoryId: 'sarees',
    brand: 'Nirai Handlooms',
    images: ['https://nirai.in/images/kanchi_red_1.jpg'],
    basePrice: 15000,
    regularDiscount: 10,
    specialDiscount: 0,
    finalPrice: 13500,
    stock: 5,
    lowStockThreshold: 2,
    isFeatured: true,
    isActive: true,
    fabric: 'Pure Mulberry Silk',
    material: 'Silk',
    style: 'Bridal',
    careInstructionsEn: 'Dry clean only',
    careInstructionsTa: '',
    variants: [],
    rating: 0,
    reviewCount: 0,
    reviews: [],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
  };

  describe('buildProductJsonLd', () => {
    it('builds standard Product schema with INR price and InStock availability', () => {
      const json = buildProductJsonLd(baseProduct, 'https://nirai.in/product/kanchipuram-pure-silk-red');

      expect(json['@context']).toBe('https://schema.org');
      expect(json['@type']).toBe('Product');
      expect(json.name).toBe(baseProduct.nameEn);
      expect(json.sku).toBe(baseProduct.sku);
      expect(json.offers.price).toBe(13500);
      expect(json.offers.priceCurrency).toBe('INR');
      expect(json.offers.availability).toBe('https://schema.org/InStock');
    });

    it('sets OutOfStock availability when stock is 0', () => {
      const outOfStock = { ...baseProduct, stock: 0 };
      const json = buildProductJsonLd(outOfStock, 'https://nirai.in/product/out-of-stock');
      expect(json.offers.availability).toBe('https://schema.org/OutOfStock');
    });

    it('strictly OMITS aggregateRating when reviewCount is 0 or rating is 0', () => {
      const json = buildProductJsonLd(baseProduct, 'https://nirai.in/product/test');
      expect(json.aggregateRating).toBeUndefined();
    });

    it('includes aggregateRating ONLY when real review data exists', () => {
      const reviewedProduct: Product = {
        ...baseProduct,
        rating: 4.8,
        reviewCount: 12,
      };
      const json = buildProductJsonLd(reviewedProduct, 'https://nirai.in/product/reviewed');
      expect(json.aggregateRating).toBeDefined();
      expect(json.aggregateRating.ratingValue).toBe(4.8);
      expect(json.aggregateRating.reviewCount).toBe(12);
    });
  });

  describe('buildBreadcrumbJsonLd', () => {
    it('creates an ordered schema.org/BreadcrumbList', () => {
      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Sarees', url: '/catalog/sarees' },
        { name: 'Kanchipuram Silk', url: '/product/kanchipuram-pure-silk-red' },
      ];
      const json = buildBreadcrumbJsonLd(breadcrumbs);

      expect(json['@type']).toBe('BreadcrumbList');
      expect(json.itemListElement).toHaveLength(3);
      expect(json.itemListElement[0].position).toBe(1);
      expect(json.itemListElement[0].name).toBe('Home');
      expect(json.itemListElement[1].position).toBe(2);
      expect(json.itemListElement[1].name).toBe('Sarees');
    });
  });

  describe('buildHomeJsonLd', () => {
    it('creates Organization and WebSite schema items', () => {
      const schemas = buildHomeJsonLd();
      expect(Array.isArray(schemas)).toBe(true);
      expect(schemas[0]['@type']).toBe('Organization');
      expect(schemas[1]['@type']).toBe('WebSite');
      expect(schemas[0].name).toBe('Nirai Handlooms');
    });
  });

  describe('cleanCanonicalUrl', () => {
    it('strips tracking query parameters (utm_*, fbclid, gclid)', () => {
      const dirtyUrl = 'https://nirai.in/catalog?utm_source=facebook&utm_medium=cpc&fbclid=IwAR123';
      const clean = cleanCanonicalUrl(dirtyUrl);
      expect(clean).toBe('https://nirai.in/catalog');
    });

    it('strips catalog sort and filter query params to avoid duplicate content', () => {
      const catalogSortUrl = 'https://nirai.in/catalog?sort=price-asc&fabric=silk';
      const clean = cleanCanonicalUrl(catalogSortUrl);
      expect(clean).toBe('https://nirai.in/catalog');
    });

    it('formats relative paths to absolute production URL', () => {
      expect(cleanCanonicalUrl('/product/kanchi-saree')).toBe('https://nirai.in/product/kanchi-saree');
    });
  });
});

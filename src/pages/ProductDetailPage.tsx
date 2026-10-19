import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { StorageService } from '../services/storage';
import { ProductDetailPage as PDPComponent } from '../components/storefront/ProductDetailPage';
import { ProductDetailSkeleton } from '../components/common/Skeletons';
import {
  Seo,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  cleanCanonicalUrl,
} from '../components/common/Seo';
import type { Category } from '../types';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { openProduct, products, isStoreLoading } = useShop();
  const navigate = useNavigate();

  const categories = useMemo(() => StorageService.getCategories(), []);

  useEffect(() => {
    if (slug) {
      openProduct(slug);
    }
  }, [slug]);

  const product = useMemo(() => {
    if (!slug) return null;
    return products.find((p) => p.slug === slug || p.id === slug) || null;
  }, [slug, products]);

  const category = useMemo(() => {
    if (!product) return null;
    return categories.find((c: Category) => c.id === product.categoryId || c.slug === product.categoryId) || null;
  }, [product, categories]);

  const structuredData = useMemo(() => {
    if (!product) return undefined;
    const productUrl = cleanCanonicalUrl(`/product/${product.slug}`);
    const productJsonLd = buildProductJsonLd(product, productUrl);

    const breadcrumbsList = [
      { name: 'Home', url: '/' },
      { name: 'Catalog', url: '/catalog' },
    ];
    if (category) {
      breadcrumbsList.push({ name: category.nameEn, url: `/catalog/${category.slug}` });
    }
    breadcrumbsList.push({ name: product.nameEn, url: `/product/${product.slug}` });

    const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbsList);
    return [productJsonLd, breadcrumbJsonLd];
  }, [product, category]);

  if (isStoreLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Seo title="Loading Ensemble..." />
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (slug && !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Seo title="Product Not Found" noindex={true} />
        <h2 className="font-serif text-2xl font-bold text-slate-800">
          Product Not Found
        </h2>
        <p className="text-xs text-stone-500">
          The requested traditional wear item could not be found in our collection.
        </p>
        <button
          onClick={() => navigate('/catalog')}
          className="px-5 py-2.5 bg-[#2D1619] text-amber-100 text-xs font-semibold rounded-lg cursor-pointer"
        >
          Browse All Handlooms
        </button>
      </div>
    );
  }

  return (
    <>
      {product && (
        <Seo
          title={product.nameEn}
          description={product.shortDescEn || product.descriptionEn}
          canonical={`/product/${product.slug}`}
          ogImage={product.images?.[0]}
          ogType="product"
          jsonLd={structuredData}
        />
      )}
      <PDPComponent />
    </>
  );
};

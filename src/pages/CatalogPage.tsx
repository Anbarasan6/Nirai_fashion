import React, { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { StorageService } from '../services/storage';
import { ProductListingPage } from '../components/storefront/ProductListingPage';
import { Seo, buildBreadcrumbJsonLd } from '../components/common/Seo';
import type { Category } from '../types';

export const CatalogPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams] = useSearchParams();
  const { setSelectedCategory } = useShop();

  const categories = useMemo(() => StorageService.getCategories(), []);

  useEffect(() => {
    const categoryParam = categorySlug || searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categorySlug, searchParams, setSelectedCategory]);

  const currentCategory = useMemo(() => {
    if (!categorySlug) return null;
    return categories.find((c: Category) => c.slug === categorySlug || c.id === categorySlug) || null;
  }, [categorySlug, categories]);

  const pageTitle = currentCategory
    ? `${currentCategory.nameEn} Collection`
    : 'All Handloom Collections';

  const pageDescription = currentCategory?.descriptionEn
    ? currentCategory.descriptionEn
    : 'Explore authentic South Indian handlooms, Kanchipuram silk sarees, Salem cotton dhotis, and traditional ethnic wear directly from master weavers.';

  const canonicalPath = categorySlug ? `/catalog/${categorySlug}` : '/catalog';

  const breadcrumbs = useMemo(() => {
    const list = [
      { name: 'Home', url: '/' },
      { name: 'Catalog', url: '/catalog' },
    ];
    if (currentCategory) {
      list.push({ name: currentCategory.nameEn, url: `/catalog/${currentCategory.slug}` });
    }
    return buildBreadcrumbJsonLd(list);
  }, [currentCategory]);

  return (
    <>
      <Seo
        title={pageTitle}
        description={pageDescription}
        canonical={canonicalPath}
        ogImage={currentCategory?.image}
        jsonLd={breadcrumbs}
      />
      <ProductListingPage />
    </>
  );
};

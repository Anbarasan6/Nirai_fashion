import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ProductListingPage } from '../components/storefront/ProductListingPage';

export const CatalogPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams] = useSearchParams();
  const { setSelectedCategory } = useShop();

  useEffect(() => {
    const categoryParam = categorySlug || searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categorySlug, searchParams, setSelectedCategory]);

  return <ProductListingPage />;
};

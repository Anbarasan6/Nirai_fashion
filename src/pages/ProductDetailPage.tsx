import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ProductDetailPage as PDPComponent } from '../components/storefront/ProductDetailPage';
import { ProductDetailSkeleton } from '../components/common/Skeletons';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { openProduct, products, isStoreLoading } = useShop();
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) {
      openProduct(slug);
    }
  }, [slug]);

  if (isStoreLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProductDetailSkeleton />
      </div>
    );
  }

  const productExists = products.some((p) => p.slug === slug || p.id === slug);

  if (slug && !productExists) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
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

  return <PDPComponent />;
};

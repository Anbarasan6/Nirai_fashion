import React from 'react';
import { Product } from '../../types';
import { useShop } from '../../context/ShopContext';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Heart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { language, openProduct, addToCart, toggleWishlist, isInWishlist } = useShop();

  const isFavorited = isInWishlist(product.id);
  const primaryImage = product.images[0] || '';
  const isOutOfStock = product.stock <= 0;

  // Total discount calculation
  const totalDiscountPercent =
    product.regularDiscount + (product.specialDiscount || 0);

  const displayName = language === 'ta' && product.nameTa ? product.nameTa : product.nameEn;
  const displayDesc = language === 'ta' && product.shortDescTa ? product.shortDescTa : product.shortDescEn;

  return (
    <div className="group relative flex flex-col bg-[#FAF9F5] border border-[#E5DFD3] rounded-xl overflow-hidden hover:border-[#C4B9A5] hover:shadow-md transition-all duration-200">
      {/* Product Image Container */}
      <div
        onClick={() => openProduct(product.slug)}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#F2EDE2] cursor-pointer"
      >
        <ImageWithFallback
          src={primaryImage}
          alt={product.nameEn}
          fallbackText={product.nameEn}
          cldWidth={480}
          cldHeight={640}
          cldCrop="fill"
          responsive={true}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-103"
        />

        {/* Favorite Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:text-rose-600 transition-colors shadow-xs"
          aria-label="Add to Wishlist"
        >
          <Heart
            className={`w-4 h-4 ${isFavorited ? 'fill-rose-600 text-rose-600' : ''}`}
          />
        </button>

        {/* Subtle Text Tag (Zero-Pill rule: clean unboxed tag) */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-900 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-sm shadow-2xs">
          {isOutOfStock ? (
            <span className="text-rose-700 font-semibold">Sold Out</span>
          ) : product.stock <= product.lowStockThreshold ? (
            <span className="text-amber-800 font-semibold">Only {product.stock} left</span>
          ) : (
            <span className="text-emerald-800 font-medium">In Stock</span>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Metadata line with typographic separators (NO PILLS) */}
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-stone-500 font-medium mb-1">
            <span>{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span>{product.fabric.split(' ')[0]}</span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => openProduct(product.slug)}
            className="font-serif text-sm font-semibold text-slate-900 group-hover:text-[#5A1D24] transition-colors line-clamp-1 cursor-pointer"
            title={displayName}
          >
            {displayName}
          </h3>

          {/* Short description */}
          <p className="text-xs text-stone-500 mt-1 line-clamp-1">
            {displayDesc}
          </p>

          {/* Ratings row */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-stone-600">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="font-semibold text-slate-800 tabular-nums">{product.rating}</span>
              <span className="text-[11px] text-stone-400 tabular-nums">({product.reviewCount})</span>
            </div>
          )}
        </div>

        {/* Price & Action row */}
        <div className="pt-2 border-t border-[#ECE6D9] flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-base font-bold text-slate-900 tabular-nums">
                ₹{product.finalPrice.toLocaleString()}
              </span>
              {totalDiscountPercent > 0 && (
                <span className="text-xs text-stone-400 line-through tabular-nums">
                  ₹{product.basePrice.toLocaleString()}
                </span>
              )}
            </div>
            {totalDiscountPercent > 0 && (
              <span className="text-[11px] font-semibold text-[#8B2630] tabular-nums">
                {totalDiscountPercent}% OFF
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => addToCart(product)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                : 'bg-[#2D1619] hover:bg-[#431B21] text-amber-100 shadow-xs'
            }`}
          >
            {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </div>
  );
};

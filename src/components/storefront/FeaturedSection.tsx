import React, { useRef, useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { Product } from '../../types';
import { ChevronLeft, ChevronRight, Star, Heart, ShoppingBag } from 'lucide-react';

export const FeaturedSection: React.FC = () => {
  const {
    language,
    t,
    openPdp,
    addToCart,
    wishlist,
    toggleWishlist,
    showToast,
  } = useShop();

  const featuredProducts = StorageService.getPublicProducts().filter((p) => p.isFeatured);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth continuous auto-scroll, pauses on hover
  useEffect(() => {
    if (isHovered || !scrollContainerRef.current) return;

    const timer = setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 1, behavior: 'auto' });
      }
    }, 35);

    return () => clearInterval(timer);
  }, [isHovered]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const distance = 360;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  if (featuredProducts.length === 0) return null;

  return (
    <section
      id="featured-section"
      className="py-16 sm:py-20 bg-[#FAF9F5] border-b border-[#EAE5DC]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Navigation Controls */}
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-amber-900/80 font-bold block mb-1">
              {language === 'ta' ? 'கைத்தறி சிறப்புகள்' : 'Signature Weaves'}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              {language === 'ta' ? 'சிறப்புத் தொகுப்பு' : 'Featured Collection'}
            </h2>
          </div>

          {/* Left/Right Carousel Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Scroll left"
              className="w-9 h-9 rounded-full border border-stone-300 bg-white hover:bg-stone-50 hover:border-amber-900 text-stone-700 hover:text-amber-950 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Scroll right"
              className="w-9 h-9 rounded-full border border-stone-300 bg-white hover:bg-stone-50 hover:border-amber-900 text-stone-700 hover:text-amber-950 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel (Smooth auto-scroll) */}
        <div
          ref={scrollContainerRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {featuredProducts.map((product) => {
            const isWishlisted = wishlist.includes(product.id);
            const displayName =
              language === 'ta' && product.nameTa ? product.nameTa : product.nameEn;
            const hasDiscount = product.regularDiscount > 0 || product.specialDiscount > 0;

            return (
              <div
                key={product.id}
                className="group flex-none w-[260px] sm:w-[280px] md:w-[310px] bg-white rounded-xl border border-[#E5DFD3] hover:border-amber-800/80 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* 5:6 Ratio Image Container */}
                <div
                  onClick={() => openPdp(product.slug)}
                  className="relative aspect-[5/6] bg-stone-100 overflow-hidden cursor-pointer"
                >
                  <img
                    src={product.images[0]}
                    alt={product.nameEn}
                    loading="lazy"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    aria-label="Wishlist"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-rose-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer z-10"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isWishlisted ? 'fill-rose-600 text-rose-600' : ''
                      }`}
                    />
                  </button>

                  {/* Discount percentage tag if active */}
                  {hasDiscount && (
                    <div className="absolute top-3 left-3 bg-[#2D1619] text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs tracking-wider">
                      {product.regularDiscount + product.specialDiscount}% OFF
                    </div>
                  )}
                </div>

                {/* Product Metadata & Action */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div onClick={() => openPdp(product.slug)} className="cursor-pointer">
                    <span className="text-[10px] uppercase tracking-wider text-amber-900 font-semibold block">
                      {product.fabric}
                    </span>
                    <h3 className="font-serif text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-amber-950 transition-colors mt-0.5">
                      {displayName}
                    </h3>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                      </div>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {product.rating.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        ({product.reviewCount || 1})
                      </span>
                    </div>

                    {/* Price and Discount Price */}
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-serif text-base font-bold text-slate-900 tabular-nums">
                        ₹{product.finalPrice.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-stone-400 line-through tabular-nums">
                          ₹{product.basePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(product);
                      showToast(`Added ${product.nameEn} to your bag`, 'success');
                    }}
                    className="w-full py-2.5 px-3 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t.product.addToCart}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

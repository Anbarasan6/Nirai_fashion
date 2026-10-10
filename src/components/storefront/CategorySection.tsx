import React, { useRef, useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { Category } from '../../types';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

export const CategorySection: React.FC = () => {
  const { language, setActiveTab, setSelectedCategory } = useShop();

  const categories = StorageService.getCategories()
    .filter((c) => c.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

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
    }, 30);

    return () => clearInterval(timer);
  }, [isHovered]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const distance = 340;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (categories.length === 0) return null;

  return (
    <section
      id="category-section"
      className="py-16 sm:py-20 bg-[#FAF9F5] border-b border-[#EAE5DC]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Navigation Controls */}
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-amber-900/80 font-bold block mb-1">
              {language === 'ta' ? 'பாரம்பரிய ஆடைகள்' : 'Curated Edits'}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              {language === 'ta' ? 'பாரம்பரிய கைத்தறி ஆடைகள்' : 'Authentic Handloom Silks'}
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

        {/* Horizontal Carousel (4-5 on desktop, 1-2 on mobile) */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => {
            const displayName =
              language === 'ta' && cat.nameTa ? cat.nameTa : cat.nameEn;

            return (
              <div
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className="group relative flex-none w-[220px] sm:w-[240px] md:w-[270px] lg:w-[280px] aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 border border-[#E5DFD3] hover:border-amber-800 shadow-2xs hover:shadow-md transition-all cursor-pointer"
              >
                {/* 4:5 Image */}
                <img
                  src={cat.image}
                  alt={cat.nameEn}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Subtle Editorial Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Minimal Name and Arrow */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-2 text-white">
                  <div>
                    <span className="text-[10px] tracking-widest uppercase text-amber-300/90 font-medium block">
                      {cat.level === 1 ? 'Department' : 'Collection'}
                    </span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                      {displayName}
                    </h3>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-amber-400 group-hover:text-slate-950 backdrop-blur-xs flex items-center justify-center transition-all text-white shrink-0">
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

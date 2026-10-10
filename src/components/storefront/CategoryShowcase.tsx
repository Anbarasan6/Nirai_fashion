import React from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ArrowUpRight } from 'lucide-react';

export const CategoryShowcase: React.FC = () => {
  const { language, setActiveTab, setSelectedCategory } = useShop();
  const categories = StorageService.getCategories().filter((c) => c.isActive && c.level <= 2);

  const handleSelect = (catId: string) => {
    setSelectedCategory(catId);
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-16 sm:py-20 bg-[#FAF9F5] border-b border-[#E8E2D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-800 font-semibold block mb-1">
              {language === 'ta' ? 'பாரம்பரிய பிரிவுகள்' : 'Curated Categories'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              {language === 'ta' ? 'அனைத்து குடும்பத்தினருக்குமான ஆடைகள்' : 'Handcrafted For Every Occasion'}
            </h2>
          </div>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setActiveTab('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#5A1D24] hover:text-[#7E242E] flex items-center gap-1 underline underline-offset-4 cursor-pointer"
          >
            <span>{language === 'ta' ? 'அனைத்து ஆடைகளையும் பார்க்க' : 'View Full Catalog'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const displayName = language === 'ta' && cat.nameTa ? cat.nameTa : cat.nameEn;
            const displayDesc = language === 'ta' && cat.descriptionTa ? cat.descriptionTa : cat.descriptionEn;

            return (
              <div
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className="group relative rounded-xl overflow-hidden bg-[#F2EDE2] border border-[#E5DFD3] hover:border-amber-700/60 shadow-xs hover:shadow-md transition-all cursor-pointer aspect-[3/4] flex flex-col justify-end"
              >
                <ImageWithFallback
                  src={cat.image}
                  alt={cat.nameEn}
                  fallbackText={cat.nameEn}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                <div className="relative z-10 p-4 text-white">
                  <span className="text-[10px] tracking-wider uppercase text-amber-300 font-medium block">
                    {cat.level === 1 ? 'Primary Department' : 'Handloom Edit'}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                    {displayName}
                  </h3>
                  {displayDesc && (
                    <p className="text-xs text-stone-300 line-clamp-1 mt-0.5">
                      {displayDesc}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-300 font-medium">
                    <span>{language === 'ta' ? 'ஆடைகளைத் தேடுக' : 'Explore Weaves'}</span>
                    <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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

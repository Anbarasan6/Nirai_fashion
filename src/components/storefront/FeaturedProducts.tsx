import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { ProductCard } from './ProductCard';
import { ArrowRight } from 'lucide-react';

export const FeaturedProducts: React.FC = () => {
  const { language, setActiveTab, setSelectedCategory } = useShop();
  const [filterTab, setFilterTab] = useState<'all' | 'cat-sarees' | 'cat-vesti' | 'cat-kids'>('all');

  // Load public products (with supplier isolation!)
  const allProducts = StorageService.getPublicProducts();

  const filteredProducts = allProducts.filter((p) => {
    if (filterTab === 'all') return p.isFeatured || true;
    return p.categoryId === filterTab || p.subCategoryId === filterTab;
  });

  return (
    <section className="py-16 sm:py-20 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-800 font-semibold block mb-1">
              {language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட உடைகள்' : 'Featured Handlooms'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              {language === 'ta' ? 'அசலான கைத்தறி ஆடைகள்' : 'Signature Handloom Weaves'}
            </h2>
          </div>

          {/* Interactive Filter Tabs (Buttons with click handlers per constitution) */}
          <div className="flex items-center gap-1 p-1 bg-[#EFE9DC] rounded-lg overflow-x-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-stone-600 hover:text-slate-900'
              }`}
            >
              {language === 'ta' ? 'அனைத்தும்' : 'All Silks & Handlooms'}
            </button>
            <button
              onClick={() => setFilterTab('cat-sarees')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'cat-sarees'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-stone-600 hover:text-slate-900'
              }`}
            >
              {language === 'ta' ? 'புடவைகள்' : 'Sarees'}
            </button>
            <button
              onClick={() => setFilterTab('cat-vesti')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'cat-vesti'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-stone-600 hover:text-slate-900'
              }`}
            >
              {language === 'ta' ? 'வேஷ்டி & ஆண்கள்' : 'Vesti & Dhoti'}
            </button>
            <button
              onClick={() => setFilterTab('cat-kids')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'cat-kids'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-stone-600 hover:text-slate-900'
              }`}
            >
              {language === 'ta' ? 'குழந்தைகள்' : 'Kids Traditional'}
            </button>
          </div>
        </div>

        {/* Product Cards Grid: 3-column (desktop), 2-column (tablet/mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => {
              setSelectedCategory(filterTab === 'all' ? null : filterTab);
              setActiveTab('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#3E1B21] text-[#3E1B21] hover:bg-[#3E1B21] hover:text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <span>{language === 'ta' ? 'முழு கைத்தறி தொகுப்பைப் பார்' : 'Explore All Traditional Ensembles'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};

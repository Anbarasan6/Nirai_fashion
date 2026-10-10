import React, { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { ProductCard } from './ProductCard';
import { Filter, SlidersHorizontal, X, ArrowLeft, RefreshCw } from 'lucide-react';

export const ProductListingPage: React.FC = () => {
  const {
    language,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    setActiveTab,
  } = useShop();

  // Load public products with isolated supplier sourcing data
  const rawProducts = StorageService.getPublicProducts();
  const categories = StorageService.getCategories();

  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(15000);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Extract unique fabrics
  const fabrics = useMemo(() => {
    const set = new Set<string>();
    rawProducts.forEach((p) => {
      if (p.fabric) set.add(p.fabric.split(' ')[0]);
    });
    return Array.from(set);
  }, [rawProducts]);

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((product) => {
      // Category filter
      if (selectedCategory && product.categoryId !== selectedCategory && product.subCategoryId !== selectedCategory) {
        return false;
      }
      // Search query (English & Tamil matching)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesEn = product.nameEn.toLowerCase().includes(query) || product.fabric.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query);
        const matchesTa = product.nameTa?.toLowerCase().includes(query) || product.descriptionTa?.toLowerCase().includes(query);
        if (!matchesEn && !matchesTa) return false;
      }
      // Stock filter
      if (inStockOnly && product.stock <= 0) {
        return false;
      }
      // Fabric filter
      if (selectedFabric !== 'all' && !product.fabric.toLowerCase().includes(selectedFabric.toLowerCase())) {
        return false;
      }
      // Price filter
      if (product.finalPrice > maxPrice) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.finalPrice - b.finalPrice;
      if (sortBy === 'price-desc') return b.finalPrice - a.finalPrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return b.isFeatured ? 1 : -1;
    });
  }, [rawProducts, selectedCategory, searchQuery, inStockOnly, selectedFabric, maxPrice, sortBy]);

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);
  const activeCategoryTitle = activeCategoryObj
    ? (language === 'ta' && activeCategoryObj.nameTa ? activeCategoryObj.nameTa : activeCategoryObj.nameEn)
    : (language === 'ta' ? 'அனைத்து ஆடைகளும்' : 'All Handloom Ensembles');

  const resetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setInStockOnly(false);
    setSelectedFabric('all');
    setMaxPrice(15000);
    setSortBy('featured');
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-6">
          <button
            onClick={() => setActiveTab('home')}
            className="hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <span>/</span>
          <span>Catalog</span>
          {activeCategoryObj && (
            <>
              <span>/</span>
              <span className="text-slate-900 font-medium">{activeCategoryTitle}</span>
            </>
          )}
        </div>

        {/* Page Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#E8E2D5] gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              {searchQuery ? `Search Results for "${searchQuery}"` : activeCategoryTitle}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Showing <span className="font-semibold text-slate-800 tabular-nums">{filteredProducts.length}</span> authentic creations
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#D8D2C5] bg-white text-slate-800"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500 font-medium hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-white border border-[#D8D2C5] rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-800"
              >
                <option value="featured">Featured Curations</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest Additions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Grid & Filter Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
          {/* Desktop Filter Sidebar */}
          <aside className={`lg:block ${showMobileFilters ? 'block' : 'hidden'} space-y-6 lg:border-r lg:border-[#ECE6D9] lg:pr-6`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE6D9]">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-800" />
                <span>Refine Weaves</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-[11px] text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-serif font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Categories
              </h4>
              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left py-1.5 px-2 rounded-md transition-colors ${
                    selectedCategory === null
                      ? 'bg-amber-100/70 font-semibold text-amber-950'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  All Categories ({rawProducts.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`w-full text-left py-1.5 px-2 rounded-md transition-colors ${
                      selectedCategory === c.id
                        ? 'bg-amber-100/70 font-semibold text-amber-950'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {language === 'ta' && c.nameTa ? c.nameTa : c.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-4 border-t border-[#ECE6D9]">
              <div className="flex items-center justify-between text-xs mb-2">
                <h4 className="font-serif font-bold text-slate-900 uppercase tracking-wider">
                  Price Limit
                </h4>
                <span className="font-semibold text-slate-900 tabular-nums">
                  Up to ₹{maxPrice.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-amber-800 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1 tabular-nums">
                <span>₹1,000</span>
                <span>₹15,000</span>
              </div>
            </div>

            {/* Fabric / Material Filter */}
            <div className="pt-4 border-t border-[#ECE6D9]">
              <h4 className="text-xs font-serif font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Fabric & Material
              </h4>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setSelectedFabric('all')}
                  className={`w-full text-left py-1 px-2 rounded-md transition-colors ${
                    selectedFabric === 'all'
                      ? 'bg-amber-100/70 font-semibold text-amber-950'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  All Fabrics
                </button>
                {fabrics.map((fab) => (
                  <button
                    key={fab}
                    onClick={() => setSelectedFabric(fab)}
                    className={`w-full text-left py-1 px-2 rounded-md transition-colors ${
                      selectedFabric === fab
                        ? 'bg-amber-100/70 font-semibold text-amber-950'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {fab}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Only Checkbox */}
            <div className="pt-4 border-t border-[#ECE6D9]">
              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-stone-300 text-amber-800 focus:ring-amber-800 w-4 h-4"
                />
                <span>In Stock Available Only</span>
              </label>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white/60 border border-[#E5DFD3] rounded-xl p-8">
                <h3 className="font-serif text-lg font-bold text-slate-800">
                  No traditional ensembles match your criteria
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Try clearing your active filters, increasing the price range, or searching for a different handloom term.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-5 px-4 py-2 bg-[#2D1619] text-amber-100 text-xs font-semibold rounded-lg hover:bg-[#431B21] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

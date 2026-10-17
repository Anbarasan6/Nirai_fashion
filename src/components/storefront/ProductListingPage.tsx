import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { fetchProductsPaginated } from '../../services/supabase';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import {
  Filter,
  SlidersHorizontal,
  X,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const ProductListingPage: React.FC = () => {
  const {
    language,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    setActiveTab,
  } = useShop();

  const categories = StorageService.getCategories();

  // Server-side pagination and filter state
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Client-side visual sorting and local price/fabric filters
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(15000);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch paginated products from Supabase
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    const sortMap: Record<string, 'price-asc' | 'price-desc' | 'rating' | 'newest'> = {
      'price-asc': 'price-asc',
      'price-desc': 'price-desc',
      'rating': 'rating',
      'newest': 'newest',
      'featured': 'newest',
    };

    const res = await fetchProductsPaginated({
      page,
      pageSize,
      search: searchQuery.trim() || undefined,
      categoryId: selectedCategory && selectedCategory !== 'all' ? selectedCategory : undefined,
      sortBy: sortMap[sortBy] || 'newest',
      includeInactive: false,
    });

    if (res.error) {
      setFetchError(res.error);
      setProducts([]);
      setTotalCount(0);
      setTotalPages(1);
    } else {
      setProducts(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages || 1);
    }
    setIsLoading(false);
  }, [page, pageSize, searchQuery, selectedCategory, sortBy]);

  // Re-fetch whenever filters or page changes
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Reset page to 1 when search or category changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory]);

  // Unique fabrics present in current page results
  const fabrics = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.fabric) set.add(p.fabric.split(' ')[0]);
    });
    return Array.from(set);
  }, [products]);

  // Apply secondary local sub-filters (inStockOnly, fabric, maxPrice)
  const displayProducts = useMemo(() => {
    return products.filter((p) => {
      if (inStockOnly && p.stock <= 0) return false;
      if (selectedFabric !== 'all' && !p.fabric.toLowerCase().includes(selectedFabric.toLowerCase())) {
        return false;
      }
      if (p.finalPrice > maxPrice) return false;
      return true;
    });
  }, [products, inStockOnly, selectedFabric, maxPrice]);

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);
  const activeCategoryTitle = activeCategoryObj
    ? language === 'ta' && activeCategoryObj.nameTa
      ? activeCategoryObj.nameTa
      : activeCategoryObj.nameEn
    : language === 'ta'
    ? 'அனைத்து ஆடைகளும்'
    : 'All Handloom Ensembles';

  const resetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setInStockOnly(false);
    setSelectedFabric('all');
    setMaxPrice(15000);
    setSortBy('featured');
    setPage(1);
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-6">
          <button
            onClick={() => setActiveTab('home')}
            className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <span>/</span>
          <span>Catalog</span>
          {activeCategoryObj && (
            <>
              <span>/</span>
              <span className="font-semibold text-slate-800">{activeCategoryTitle}</span>
            </>
          )}
        </div>

        {/* Header Title & Sorting Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E8E2D5] pb-5 mb-8 gap-4">
          <div>
            <span className="text-xs font-serif uppercase tracking-widest text-amber-900 font-bold block mb-1">
              Direct Artisanal Weaves
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              {activeCategoryTitle}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              {isLoading
                ? 'Loading creations...'
                : `Showing ${displayProducts.length} of ${totalCount} authentic handloom creations`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium text-slate-800 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-900" />
              <span>Filters</span>
            </button>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-900 cursor-pointer"
              >
                <option value="featured">Featured Artisanal Edit</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside
            className={`lg:block ${
              showMobileFilters ? 'block mb-6' : 'hidden'
            } bg-white rounded-xl border border-[#E5DFD3] p-5 space-y-6 shadow-2xs self-start`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE6D9]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-900" />
                <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Filters
                </h3>
              </div>
              <button
                onClick={resetFilters}
                className="text-[11px] text-amber-900 hover:text-amber-950 font-semibold cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-serif font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Categories
              </h4>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setPage(1);
                  }}
                  className={`w-full text-left py-1.5 px-2 rounded-md transition-colors ${
                    !selectedCategory
                      ? 'bg-[#2D1619] text-amber-100 font-semibold'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  All Categories
                </button>
                {categories
                  .filter((c) => c.level === 1 && c.isActive)
                  .map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setPage(1);
                      }}
                      className={`w-full text-left py-1.5 px-2 rounded-md transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-[#2D1619] text-amber-100 font-semibold'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {language === 'ta' && cat.nameTa ? cat.nameTa : cat.nameEn}
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
            {fabrics.length > 0 && (
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
            )}

            {/* In Stock Only Checkbox */}
            <div className="pt-4 border-t border-[#ECE6D9]">
              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-stone-300 text-amber-800 focus:ring-amber-800 w-4 h-4 cursor-pointer"
                />
                <span>In Stock Available Only</span>
              </label>
            </div>
          </aside>

          {/* Main Catalog Area */}
          <main className="lg:col-span-3 space-y-6">
            {/* Error State with Retry Button (Fulfilling Requirement 2: No Silent Demo Fallback) */}
            {fetchError && (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <h3 className="font-serif text-sm font-bold text-rose-900">
                  Unable to connect to database
                </h3>
                <p className="text-xs text-rose-700 max-w-md mx-auto">
                  {fetchError}
                </p>
                <button
                  onClick={loadProducts}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
              </div>
            )}

            {/* Loading Skeletons */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-[#E5DFD3] p-4 space-y-3 animate-pulse"
                  >
                    <div className="bg-stone-200 h-64 rounded-lg w-full" />
                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                    <div className="h-5 bg-stone-200 rounded w-1/3 pt-2" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !fetchError && displayProducts.length === 0 && (
              <div className="text-center py-20 bg-white/60 border border-[#E5DFD3] rounded-xl p-8 space-y-3">
                <h3 className="font-serif text-lg font-bold text-slate-800">
                  No traditional ensembles match your criteria
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Try clearing your active filters, increasing the price range, or searching for a different handloom weave term.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-3 px-4 py-2 bg-[#2D1619] text-amber-100 text-xs font-semibold rounded-lg hover:bg-[#431B21] transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Product Cards Grid */}
            {!isLoading && !fetchError && displayProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Server-Side Pagination Controls */}
            {!isLoading && !fetchError && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E8E2D5]">
                <span className="text-xs text-stone-500">
                  Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
                  <span className="font-semibold text-slate-800">{totalPages}</span> ({totalCount} items)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page === 1}
                    className="p-2 border border-stone-300 rounded-lg text-slate-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setPage(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          page === pageNum
                            ? 'bg-[#2D1619] text-amber-100'
                            : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page >= totalPages}
                    className="p-2 border border-stone-300 rounded-lg text-slate-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

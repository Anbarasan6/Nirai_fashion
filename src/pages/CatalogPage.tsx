import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, SlidersHorizontal, ShoppingBag, Heart, Search, RotateCcw } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CatalogPage: React.FC = () => {
  const { language, t, products, categories, addToCart, toggleWishlist, isInWishlist } = useShop();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL state sync
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [maxPrice, setMaxPrice] = useState<number>(25000);
  const [selectedFabric, setSelectedFabric] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Extract unique fabric types
  const fabricTypes = useMemo(() => {
    const types = new Set<string>();
    products.forEach(p => {
      if (p.fabric_type) types.add(p.fabric_type);
    });
    return Array.from(types);
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category Filter
      if (selectedCategory !== 'all' && p.category_id !== selectedCategory) return false;

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchEn = p.name_en.toLowerCase().includes(q);
        const matchTa = p.name_ta?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        if (!matchEn && !matchTa && !matchSku) return false;
      }

      // Max Price
      const price = p.discount_price || p.price;
      if (price > maxPrice) return false;

      // Fabric Type
      if (selectedFabric !== 'all' && p.fabric_type !== selectedFabric) return false;

      // In Stock
      if (inStockOnly && (!p.is_in_stock || p.stock_quantity <= 0)) return false;

      return true;
    }).sort((a, b) => {
      const priceA = a.discount_price || a.price;
      const priceB = b.discount_price || b.price;

      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'newest') return (b.is_new_arrival ? 1 : 0) - (a.is_new_arrival ? 1 : 0);
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    });
  }, [products, selectedCategory, searchQuery, maxPrice, selectedFabric, inStockOnly, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setMaxPrice(25000);
    setSelectedFabric('all');
    setInStockOnly(false);
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title & Search Bar Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#E2D9C8]">
        <div>
          <h1 className="font-serif-luxury text-2xl sm:text-4xl font-extrabold text-[#2D1619]">
            {t('catalog')}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5B5E] mt-1">
            Showing {filteredProducts.length} authentic handloom saree weaves
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-white text-xs px-3.5 py-2.5 rounded-xl border border-[#D4AF37]/40 focus:outline-none focus:border-[#4A0E17]"
            />
            <Search className="w-4 h-4 text-[#8A7B7E] absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#D4AF37]/40 text-[#2D1619] focus:outline-none"
          >
            <option value="featured">{t('sortFeatured')}</option>
            <option value="price-low">{t('sortPriceLowHigh')}</option>
            <option value="price-high">{t('sortPriceHighLow')}</option>
            <option value="newest">{t('sortNewest')}</option>
          </select>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden p-2.5 bg-[#2D1619] text-[#F4E8C1] rounded-xl flex items-center gap-1.5 text-xs font-bold"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <aside className={`lg:block ${mobileFilterOpen ? 'block' : 'hidden'} space-y-6 bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm h-fit`}>
          <div className="flex items-center justify-between pb-4 border-b border-[#F2ECDF]">
            <div className="flex items-center gap-2 font-bold text-sm text-[#2D1619]">
              <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
              <span>Filter Sarees</span>
            </div>
            <button
              onClick={resetFilters}
              className="text-xs text-[#800020] hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('resetFilters')}</span>
            </button>
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2D1619] uppercase tracking-wider block">
              {t('categories')}
            </label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg transition font-medium ${
                  selectedCategory === 'all'
                    ? 'bg-[#4A0E17] text-[#F4E8C1] font-bold'
                    : 'text-[#4A0E17] hover:bg-[#F4E8C1]/30'
                }`}
              >
                {t('allCategories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition font-medium ${
                    selectedCategory === cat.id
                      ? 'bg-[#4A0E17] text-[#F4E8C1] font-bold'
                      : 'text-[#4A0E17] hover:bg-[#F4E8C1]/30'
                  }`}
                >
                  {language === 'ta' && cat.name_ta ? cat.name_ta : cat.name_en}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3 pt-4 border-t border-[#F2ECDF]">
            <div className="flex justify-between items-center text-xs font-bold text-[#2D1619]">
              <span>{t('priceRange')}</span>
              <span className="text-[#4A0E17]">Up to ₹{maxPrice.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="30000"
              step="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#4A0E17] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8A7B7E]">
              <span>₹1,000</span>
              <span>₹30,000</span>
            </div>
          </div>

          {/* Fabric Type Filter */}
          {fabricTypes.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-[#F2ECDF]">
              <label className="text-xs font-bold text-[#2D1619] uppercase tracking-wider block">
                {t('fabricType')}
              </label>
              <select
                value={selectedFabric}
                onChange={(e) => setSelectedFabric(e.target.value)}
                className="w-full bg-[#FBF9F5] text-xs px-3 py-2 border border-[#D4AF37]/40 rounded-lg text-[#2D1619] focus:outline-none"
              >
                <option value="all">All Fabric Weaves</option>
                {fabricTypes.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}

          {/* In Stock Only Checkbox */}
          <div className="pt-4 border-t border-[#F2ECDF]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-[#4A0E17] rounded"
              />
              <span className="text-xs font-semibold text-[#2D1619]">
                {t('inStockOnly')}
              </span>
            </label>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E2D9C8] space-y-4">
              <p className="text-sm font-semibold text-[#4A0E17]">
                {t('noProductsFound')}
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold rounded-full hover:bg-[#2D1619] transition"
              >
                {t('resetFilters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const name = language === 'ta' && product.name_ta ? product.name_ta : product.name_en;
                const price = product.discount_price || product.price;
                const inWishlist = isInWishlist(product.id);

                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl overflow-hidden border border-[#E2D9C8] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#F2ECDF]">
                      <img
                        src={product.images[0]}
                        alt={name}
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      />

                      <button
                        onClick={() => toggleWishlist(product)}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${
                          inWishlist ? 'bg-[#800020] text-white' : 'bg-white/80 text-[#2D1619] hover:bg-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-white' : ''}`} />
                      </button>

                      {product.discount_price && (
                        <div className="absolute top-3 left-3 bg-[#4A0E17] text-[#F4E8C1] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-[#8A7B7E] uppercase tracking-wider">
                          {product.fabric_type || 'Pure Silk'}
                        </span>
                        <h3
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="font-serif-luxury text-sm font-bold text-[#2D1619] hover:text-[#4A0E17] transition cursor-pointer line-clamp-2 mt-1"
                        >
                          {name}
                        </h3>
                      </div>

                      <div className="pt-2 border-t border-[#F2ECDF] flex items-center justify-between">
                        <div>
                          <div className="text-base font-extrabold text-[#4A0E17]">
                            ₹{price.toLocaleString('en-IN')}
                          </div>
                          {product.discount_price && (
                            <div className="text-xs text-[#8A7B7E] line-through">
                              ₹{product.price.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => addToCart(product, 1)}
                          className="p-2.5 rounded-full bg-[#2D1619] hover:bg-[#4A0E17] text-[#F4E8C1] transition shadow-md"
                          title={t('addToCart')}
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

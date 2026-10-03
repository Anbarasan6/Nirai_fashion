import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Search, Menu, X, Globe, ShieldCheck, Truck, UserCheck, ChevronRight, Tag, User } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const Header: React.FC = () => {
  const { language, setLanguage, t, cartCount, wishlist, setIsCartOpen, settings, products, user } = useShop();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Search Autocomplete suggestions
  const searchSuggestions = searchQuery.trim()
    ? products.filter(p => p.name_en.toLowerCase().includes(searchQuery.toLowerCase()) || p.name_ta?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#2D1619] text-[#FBF9F5] shadow-xl border-b border-[#D4AF37]/30">
      {/* Top Announcement Bar */}
      <div className="bg-[#4A0E17] text-[#F4E8C1] py-1.5 px-4 text-xs font-medium tracking-wide border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
            <span>{language === 'ta' ? settings.announcement_ta : settings.announcement_en}</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11px] text-[#ECE6D9]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#D4AF37]" /> 100% Direct Weaver Pure Silk
            </span>
            <span className="text-[#D4AF37]">|</span>
            <Link to="/tracking" className="hover:text-[#D4AF37] transition">
              {t('trackOrder')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Luxury Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-[#F4E8C1] hover:text-[#D4AF37] focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo & Tagline */}
        <Link to="/" className="flex flex-col items-center lg:items-start group">
          <span className="font-serif-luxury text-2xl sm:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#F4E8C1] via-[#D4AF37] to-[#F4E8C1] group-hover:scale-105 transition-transform duration-300">
            {t('brandName')}
          </span>
          <span className="text-[10px] sm:text-xs text-[#D5CEBF] font-light tracking-widest uppercase">
            {t('subBrand')}
          </span>
        </Link>

        {/* Search Bar with Autocomplete Dropdown */}
        <div className="hidden md:block flex-1 max-w-md mx-6 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-[#3D2024] text-[#FBF9F5] placeholder-[#A09295] text-xs sm:text-sm pl-4 pr-10 py-2 rounded-full border border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] transition"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37] hover:text-white transition"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white text-[#2D1619] rounded-2xl border border-[#D4AF37]/50 shadow-2xl overflow-hidden z-50 animate-fadeIn">
              <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-[#8A7B7E] bg-[#FBF9F5] border-b border-[#F2ECDF]">
                Instant Saree Matches
              </div>
              <div className="divide-y divide-[#F2ECDF]">
                {searchSuggestions.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      navigate(`/product/${prod.id}`);
                      setIsSearchFocused(false);
                      setSearchQuery('');
                    }}
                    className="p-3 hover:bg-[#F4E8C1]/30 flex items-center gap-3 cursor-pointer transition"
                  >
                    <img src={prod.images[0]} alt={prod.name_en} className="w-8 h-10 object-cover rounded-md border border-[#E2D9C8]" />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-bold text-[#2D1619] truncate">{prod.name_en}</p>
                      <p className="text-[#8A7B7E] text-[10px]">{prod.fabric_type}</p>
                    </div>
                    <span className="font-extrabold text-xs text-[#4A0E17]">
                      ₹{(prod.discount_price || prod.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3D2024] hover:bg-[#4A0E17] border border-[#D4AF37]/40 text-xs font-semibold text-[#F4E8C1] transition shadow-sm"
            title="Toggle Language (English / Tamil)"
          >
            <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* User Account Link */}
          <Link
            to={user ? '/account' : '/auth'}
            className="flex items-center gap-1 text-xs text-[#F4E8C1] hover:text-[#D4AF37] transition"
            title={user ? user.name : 'Sign In'}
          >
            <User className="w-5 h-5 text-[#D4AF37]" />
            <span className="hidden xl:inline">{user ? user.name.split(' ')[0] : 'Account'}</span>
          </Link>

          {/* Wishlist Button */}
          <Link
            to="/wishlist"
            className="relative p-2 text-[#F4E8C1] hover:text-[#D4AF37] transition"
            title={t('wishlist')}
          >
            <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#2D1619] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#D4AF37] text-[#2D1619] px-3.5 py-1.5 rounded-full font-bold text-xs sm:text-sm transition shadow-lg group"
          >
            <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">{t('cart')}</span>
            {cartCount > 0 && (
              <span className="bg-[#2D1619] text-[#F4E8C1] text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Admin Link */}
          <Link
            to="/admin"
            className="hidden lg:flex items-center gap-1 text-xs text-[#D5CEBF] hover:text-[#D4AF37] transition border-l border-[#D4AF37]/30 pl-3"
            title={t('adminPortal')}
          >
            <UserCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Admin</span>
          </Link>
        </div>
      </div>

      {/* Primary Navigation Menu */}
      <nav className="hidden lg:block bg-[#231114] border-t border-[#D4AF37]/20 py-2.5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-8 text-xs font-medium tracking-wider uppercase text-[#ECE6D9]">
          <Link to="/" className={`hover:text-[#D4AF37] transition py-1 relative ${isActive('/') ? 'text-[#D4AF37] font-bold' : ''}`}>
            {t('home')}
          </Link>
          <Link to="/catalog" className={`hover:text-[#D4AF37] transition py-1 relative ${isActive('/catalog') ? 'text-[#D4AF37] font-bold' : ''}`}>
            {t('catalog')}
          </Link>
          <Link to="/deals" className={`hover:text-[#D4AF37] transition py-1 flex items-center gap-1 text-[#F4E8C1] ${isActive('/deals') ? 'text-[#D4AF37] font-bold' : ''}`}>
            <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Offers & Deals</span>
          </Link>
          <Link to="/about" className="hover:text-[#D4AF37] transition py-1">
            About Us
          </Link>
          <Link to="/contact" className="hover:text-[#D4AF37] transition py-1">
            Contact Us
          </Link>
          <Link to="/tracking" className="hover:text-[#D4AF37] transition py-1">
            {t('trackOrder')}
          </Link>
          <Link to="/policies" className="hover:text-[#D4AF37] transition py-1">
            {t('policies')}
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#231114] border-t border-[#D4AF37]/30 px-4 py-4 space-y-4 animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-[#3D2024] text-[#FBF9F5] placeholder-[#A09295] text-xs pl-4 pr-10 py-2.5 rounded-full border border-[#D4AF37]/40"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37]">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-col space-y-2 text-sm font-medium text-[#ECE6D9]">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-[#3D2024] flex items-center justify-between">
              <span>{t('home')}</span>
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>
            <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-[#3D2024] flex items-center justify-between">
              <span>{t('catalog')}</span>
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>
            <Link to="/deals" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-[#3D2024] text-[#F4E8C1] flex items-center justify-between">
              <span>Offers & Deals</span>
              <Tag className="w-4 h-4 text-[#D4AF37]" />
            </Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-[#3D2024] flex items-center justify-between">
              <span>About Us</span>
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-[#3D2024] flex items-center justify-between">
              <span>Contact Support</span>
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>
            <Link to="/tracking" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-[#3D2024] flex items-center justify-between">
              <span>{t('trackOrder')}</span>
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded-lg bg-[#3D2024] text-[#D4AF37] font-bold flex items-center justify-between">
              <span>Admin Portal</span>
              <UserCheck className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

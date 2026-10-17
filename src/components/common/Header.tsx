import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import {
  ShoppingBag,
  Heart,
  Search,
  Globe,
  Menu,
  X,
  ShieldCheck,
  Package,
  User as UserIcon,
  BookOpen,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    language,
    setLanguage,
    t,
    cartItemCount,
    setIsCartOpen,
    wishlist,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    currentUser,
    viewMode,
    setViewMode,
    storeSettings,
    openAuthModal,
    logout,
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleNavClick = (path: string, categoryId?: string) => {
    if (categoryId !== undefined) {
      setSelectedCategory(categoryId);
    }
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#E8E2D5] transition-all">
      {/* Top Announcement Bar */}
      {storeSettings.isAnnouncementActive && (
        <div className="bg-[#3D1418] text-[#F5EADB] px-4 py-2 text-center text-xs tracking-wide font-medium flex items-center justify-center gap-2 border-b border-[#541C22]">
          <span>{language === 'ta' ? storeSettings.announcementTa : storeSettings.announcementEn}</span>
          <span className="hidden sm:inline opacity-60">|</span>
          <button
            onClick={() => handleNavClick('/catalog')}
            className="underline underline-offset-2 hover:text-white transition-colors cursor-pointer"
          >
            {language === 'ta' ? 'இப்போதே வாங்கு' : 'Shop Handlooms'}
          </button>
        </div>
      )}

      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Mobile menu toggle & Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-md"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link
            to="/"
            onClick={() => {
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group transition-opacity"
            title="Nirai Handlooms Home"
          >
            {/* Desktop Brand Logo */}
            {storeSettings.logo?.desktopLogoUrl && !logoError ? (
              <img
                src={storeSettings.logo.desktopLogoUrl}
                alt={storeSettings.logo.altText || 'Nirai Handloom Silks'}
                onError={() => setLogoError(true)}
                className="hidden sm:block h-10 w-auto max-w-[200px] object-contain transition-transform group-hover:scale-102"
              />
            ) : (
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#3D1418] text-[#F5EADB] flex items-center justify-center font-serif font-black text-base border border-amber-500/30 shadow-xs group-hover:scale-105 transition-transform">
                  ந
                </div>
                <div className="flex flex-col">
                  <span className="font-serif font-black tracking-[0.2em] text-[#2D1619] group-hover:text-[#5A1D24] text-xl leading-none transition-colors">
                    NIRAI
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.28em] text-[#8C2D38] font-bold mt-0.5">
                    HANDLOOMS
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Brand Logo */}
            {storeSettings.logo?.mobileLogoUrl && !logoError ? (
              <img
                src={storeSettings.logo.mobileLogoUrl}
                alt={storeSettings.logo.altText || 'Nirai'}
                onError={() => setLogoError(true)}
                className="sm:hidden h-8 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <div className="sm:hidden flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-[#3D1418] text-[#F5EADB] flex items-center justify-center font-serif font-black text-sm border border-amber-500/30">
                  ந
                </div>
                <span className="font-serif font-black tracking-[0.18em] text-[#2D1619] text-lg">
                  NIRAI
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-slate-700">
          <Link
            to="/"
            className={`transition-colors hover:text-[#5A1D24] ${
              isActive('/') ? 'text-[#5A1D24] font-bold border-b border-[#5A1D24] pb-0.5' : ''
            }`}
          >
            {t.nav.home}
          </Link>

          <Link
            to="/catalog"
            className={`transition-colors hover:text-[#5A1D24] ${
              isActive('/catalog') ? 'text-[#5A1D24] font-bold border-b border-[#5A1D24] pb-0.5' : ''
            }`}
          >
            {t.nav.sarees}
          </Link>

          <Link
            to="/catalog?category=vesti"
            onClick={() => setSelectedCategory('cat-vesti')}
            className="transition-colors hover:text-[#5A1D24]"
          >
            {t.nav.vesti}
          </Link>

          <Link
            to="/catalog?category=women"
            onClick={() => setSelectedCategory('cat-women')}
            className="transition-colors hover:text-[#5A1D24]"
          >
            {t.nav.women}
          </Link>

          <Link
            to="/about"
            className={`transition-colors hover:text-[#5A1D24] ${
              isActive('/about') ? 'text-[#5A1D24] font-bold border-b border-[#5A1D24] pb-0.5' : ''
            }`}
          >
            About Us
          </Link>

          <Link
            to="/contact"
            className={`transition-colors hover:text-[#5A1D24] ${
              isActive('/contact') ? 'text-[#5A1D24] font-bold border-b border-[#5A1D24] pb-0.5' : ''
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* Zone 3: Interactive Action Suite */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-amber-900 transition-colors bg-[#F2EDE2] px-2.5 py-1.5 rounded-lg cursor-pointer"
            title="Switch Language / மொழியை மாற்றுக"
          >
            <Globe className="w-3.5 h-3.5 text-amber-900" />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* Search Trigger / Input */}
          <div className="relative">
            {showSearchInput ? (
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search Kanchi silks, dhotis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNavClick('/catalog');
                    }
                  }}
                  autoFocus
                  className="w-44 sm:w-56 p-1.5 pl-3 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-900 bg-white"
                />
                <button
                  onClick={() => setShowSearchInput(false)}
                  className="p-1 text-stone-400 hover:text-slate-700 ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                className="p-2 text-slate-700 hover:text-amber-900 transition-colors cursor-pointer"
                title="Search Store"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Wishlist Icon */}
          <Link
            to="/account"
            className="relative p-2 text-slate-700 hover:text-rose-700 transition-colors"
            title="Wishlist"
          >
            <Heart className="w-5 h-5 text-slate-700" />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-700 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* User Account / Profile Dropdown */}
          <div className="relative">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-800 hover:text-amber-900 bg-white border border-stone-200/90 hover:border-amber-900/30 px-2.5 py-1.5 rounded-full cursor-pointer shadow-2xs transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-[#5A1D24] text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs">
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate text-xs font-medium text-slate-800">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-stone-100">
                      <p className="font-bold text-slate-900 text-sm leading-tight truncate">{currentUser.name}</p>
                      <p className="text-xs text-stone-400 truncate mt-0.5">{currentUser.email}</p>
                    </div>

                    <Link
                      to="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-left px-4 py-2.5 hover:bg-stone-50 flex items-center gap-2.5 text-slate-700 font-medium text-xs transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-amber-900" />
                      <span>My Account & Orders</span>
                    </Link>

                    <Link
                      to="/tracking"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-left px-4 py-2.5 hover:bg-stone-50 flex items-center gap-2.5 text-slate-700 font-medium text-xs transition-colors"
                    >
                      <Package className="w-4 h-4 text-amber-900" />
                      <span>Track Order</span>
                    </Link>

                    {/* Switch to Admin Mode */}
                    {(currentUser.role === 'admin' || currentUser.role === 'super_admin' || currentUser.role === 'staff') && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setViewMode('admin');
                          navigate('/admin/dashboard');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-stone-50 flex items-center gap-2.5 text-amber-900 font-bold text-xs transition-colors border-t border-stone-100"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-800" />
                        <span>Admin Management Suite</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-rose-50 flex items-center gap-2.5 text-rose-600 font-medium text-xs border-t border-stone-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 rounded-full text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Cart Pill Button matching screenshot */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-[#2D1619] hover:bg-[#431B21] text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Cart</span>
            <span className="w-5 h-5 rounded-full bg-[#E5A83B] text-[#2D1619] text-xs font-extrabold flex items-center justify-center">
              {cartItemCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 py-4 space-y-3 text-xs">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-bold text-slate-900 border-b border-stone-100"
          >
            {t.nav.home}
          </Link>
          <Link
            to="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-bold text-slate-900 border-b border-stone-100"
          >
            {t.nav.sarees}
          </Link>
          <Link
            to="/catalog?category=vesti"
            onClick={() => {
              setSelectedCategory('cat-vesti');
              setMobileMenuOpen(false);
            }}
            className="block py-2 font-bold text-slate-900 border-b border-stone-100"
          >
            {t.nav.vesti}
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-bold text-slate-900 border-b border-stone-100"
          >
            About Us
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-bold text-slate-900 border-b border-stone-100"
          >
            Contact
          </Link>
          <Link
            to="/tracking"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-bold text-amber-900"
          >
            Track Order Status
          </Link>
        </div>
      )}
    </header>
  );
};

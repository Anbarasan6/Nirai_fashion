import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Heart, Truck, ShoppingCart } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { language, cartCount, wishlist, setIsCartOpen } = useShop();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#2D1619]/95 backdrop-blur-lg border-t border-[#D4AF37]/40 shadow-2xl py-2 px-4">
      <div className="flex justify-around items-center text-[10px] font-bold text-[#ECE6D9]">
        
        {/* Home Link */}
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-1 transition ${
            isActive('/') ? 'text-[#D4AF37]' : 'hover:text-[#F4E8C1]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>{language === 'ta' ? 'முகப்பு' : 'Home'}</span>
        </Link>

        {/* Shop Catalog Link */}
        <Link
          to="/catalog"
          className={`flex flex-col items-center gap-1 p-1 transition ${
            isActive('/catalog') ? 'text-[#D4AF37]' : 'hover:text-[#F4E8C1]'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>{language === 'ta' ? 'சேலைகள்' : 'Shop'}</span>
        </Link>

        {/* Order Tracking Link */}
        <Link
          to="/tracking"
          className={`flex flex-col items-center gap-1 p-1 transition ${
            isActive('/tracking') ? 'text-[#D4AF37]' : 'hover:text-[#F4E8C1]'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span>{language === 'ta' ? 'ஆர்டர்' : 'Track'}</span>
        </Link>

        {/* Wishlist Link */}
        <Link
          to="/catalog"
          className="flex flex-col items-center gap-1 p-1 relative hover:text-[#F4E8C1] transition"
        >
          <Heart className="w-5 h-5" />
          <span>{language === 'ta' ? 'விருப்பம்' : 'Wishlist'}</span>
          {wishlist.length > 0 && (
            <span className="absolute -top-1 right-1 bg-[#D4AF37] text-[#2D1619] text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
              {wishlist.length}
            </span>
          )}
        </Link>

        {/* Cart Drawer Trigger */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center gap-1 p-1 relative text-[#D4AF37] hover:text-white transition"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#800020] text-[#F4E8C1] text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-[#D4AF37]">
                {cartCount}
              </span>
            )}
          </div>
          <span>{language === 'ta' ? 'கூடை' : 'Cart'}</span>
        </button>

      </div>
    </div>
  );
};

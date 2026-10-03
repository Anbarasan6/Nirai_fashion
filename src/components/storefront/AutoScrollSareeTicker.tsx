import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const AutoScrollSareeTicker: React.FC = () => {
  const { language, products, addToCart, toggleWishlist, isInWishlist } = useShop();
  const navigate = useNavigate();

  const duplicatedProducts = [...products, ...products, ...products];

  return (
    <div className="w-full overflow-hidden py-4 relative bg-[#2D1619]/40 border-y border-[#D4AF37]/20">
      <div className="animate-marquee flex gap-6 px-4">
        {duplicatedProducts.map((product, idx) => {
          const name = language === 'ta' && product.name_ta ? product.name_ta : product.name_en;
          const price = product.discount_price || product.price;
          const inWishlist = isInWishlist(product.id);

          return (
            <div
              key={`${product.id}-${idx}`}
              className="w-56 sm:w-64 shrink-0 bg-white rounded-2xl overflow-hidden border border-[#E2D9C8] shadow-md hover:shadow-2xl transition-all duration-300 group"
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
                  className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition ${
                    inWishlist ? 'bg-[#800020] text-white' : 'bg-white/80 text-[#2D1619] hover:bg-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-white' : ''}`} />
                </button>
              </div>

              <div className="p-3 space-y-2">
                <span className="text-[9px] font-bold text-[#8A7B7E] uppercase tracking-wider block">
                  {product.fabric_type}
                </span>
                <h4
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="font-serif-luxury text-xs font-bold text-[#2D1619] truncate cursor-pointer hover:text-[#4A0E17]"
                >
                  {name}
                </h4>

                <div className="flex items-center justify-between pt-1 border-t border-[#F2ECDF]">
                  <span className="text-xs font-extrabold text-[#4A0E17]">
                    ₹{price.toLocaleString('en-IN')}
                  </span>

                  <button
                    onClick={() => addToCart(product, 1)}
                    className="p-1.5 bg-[#2D1619] hover:bg-[#4A0E17] text-[#F4E8C1] rounded-full transition shadow-sm"
                    title="Quick Add"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

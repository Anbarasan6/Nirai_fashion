import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const WishlistPage: React.FC = () => {
  const { language, wishlist, toggleWishlist, addToCart } = useShop();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-[#ECE6D9] text-[#800020] rounded-full flex items-center justify-center">
          <Heart className="w-8 h-8 fill-[#800020]" />
        </div>
        <h2 className="text-2xl font-bold text-[#4A0E17]">Your Wishlist is Empty</h2>
        <p className="text-xs text-[#6B5B5E]">Save your favorite handloom silk sarees to view them later.</p>
        <Link to="/catalog" className="inline-block px-6 py-2.5 bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold rounded-full">
          Explore Saree Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-[#E2D9C8] pb-4">
        <h1 className="font-serif-luxury text-2xl sm:text-4xl font-extrabold text-[#2D1619]">
          My Saved Wishlist ({wishlist.length} Sarees)
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map(product => {
          const name = language === 'ta' && product.name_ta ? product.name_ta : product.name_en;
          const price = product.discount_price || product.price;

          return (
            <div key={product.id} className="bg-white rounded-2xl border border-[#E2D9C8] overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="aspect-[3/4] overflow-hidden bg-[#F2ECDF] relative">
                <img src={product.images[0]} alt={name} className="w-full h-full object-cover" />
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-3 right-3 p-2 bg-red-700 text-white rounded-full shadow-md"
                  title="Remove from Wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <h3 className="font-serif-luxury text-xs font-bold text-[#2D1619] truncate">{name}</h3>
                <div className="text-sm font-extrabold text-[#4A0E17]">₹{price.toLocaleString('en-IN')}</div>
                <button
                  onClick={() => {
                    addToCart(product, 1);
                    toggleWishlist(product);
                  }}
                  className="w-full py-2.5 bg-[#2D1619] text-[#F4E8C1] font-bold text-xs rounded-xl hover:bg-[#4A0E17] flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                  <span>Move to Cart</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

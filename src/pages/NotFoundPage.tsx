import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const NotFoundPage: React.FC = () => {
  const { products } = useShop();
  const navigate = useNavigate();
  const suggested = products.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-8">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-[#F4E8C1] text-[#4A0E17] rounded-full flex items-center justify-center">
          <Compass className="w-8 h-8 text-[#4A0E17]" />
        </div>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl font-extrabold text-[#2D1619]">
          404 - Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5B5E] max-w-md mx-auto">
          The saree page or path you requested does not exist. Explore our recommended handloom collections below:
        </p>
        <Link to="/catalog" className="inline-block px-6 py-3 bg-[#2D1619] text-[#F4E8C1] font-bold text-xs rounded-full hover:bg-[#4A0E17]">
          Browse Saree Catalog
        </Link>
      </div>

      {/* Suggested Products Grid */}
      <div className="pt-8 border-t border-[#E2D9C8] space-y-4 text-left">
        <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] text-center">
          Popular Weaver Sarees You Might Like
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {suggested.map(p => (
            <div key={p.id} className="p-3 bg-white rounded-2xl border border-[#E2D9C8] space-y-2">
              <img src={p.images[0]} alt={p.name_en} className="w-full aspect-[3/4] object-cover rounded-xl" />
              <h4 className="font-serif-luxury text-xs font-bold text-[#2D1619] truncate">{p.name_en}</h4>
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xs text-[#4A0E17]">₹{(p.discount_price || p.price).toLocaleString('en-IN')}</span>
                <button onClick={() => navigate(`/product/${p.id}`)} className="text-xs font-bold text-[#4A0E17] underline">View</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

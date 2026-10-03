import React from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const DealsPage: React.FC = () => {
  const { coupons } = useShop();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Deals Header */}
      <div className="bg-[#2D1619] text-[#FBF9F5] p-8 rounded-3xl border-2 border-[#D4AF37]/50 shadow-2xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4A0E17] text-[#D4AF37] rounded-full text-xs font-bold border border-[#D4AF37]">
          <Flame className="w-4 h-4 text-[#D4AF37] animate-pulse" />
          <span>Weaver Direct Festival Offers</span>
        </div>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl font-extrabold text-[#F4E8C1]">
          Exclusive Saree Deals & Promo Codes
        </h1>
        <p className="text-xs sm:text-sm text-[#ECE6D9] max-w-xl mx-auto">
          Save more with direct 0% gateway fee UPI payments and authentic weaver coupons on pure Elampillai & Kanchipuram silks.
        </p>
      </div>

      {/* Active Coupons Grid */}
      <div className="space-y-6">
        <h3 className="font-serif-luxury text-2xl font-bold text-[#2D1619]">
          Active Promo Coupons
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map(c => (
            <div key={c.id} className="p-6 bg-white rounded-3xl border-2 border-[#D4AF37]/40 shadow-md flex justify-between items-center relative overflow-hidden">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#8A7B7E] uppercase tracking-wider block">Verified Coupon</span>
                <h4 className="font-mono font-black text-2xl text-[#4A0E17] tracking-wider">{c.code}</h4>
                <p className="text-sm font-bold text-[#2D1619]">
                  {c.discount_type === 'percentage' ? `Flat ${c.discount_value}% OFF` : `Flat ₹${c.discount_value} Instant OFF`}
                </p>
                <p className="text-xs text-[#6B5B5E]">Valid on orders above ₹{c.min_order_amount.toLocaleString('en-IN')}</p>
              </div>

              <Link
                to="/catalog"
                className="px-5 py-3 bg-[#2D1619] text-[#F4E8C1] text-xs font-bold rounded-xl hover:bg-[#4A0E17] transition shrink-0"
              >
                Apply Coupon
              </Link>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

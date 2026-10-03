import React, { useState } from 'react';
import { Tag } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import type { Coupon } from '../../types';

export const AdminCouponsPage: React.FC = () => {
  const { coupons } = useShop();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(4999);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCoupon: Coupon = {
      id: `coup_${Date.now()}`,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_amount: Number(minOrderAmount),
      is_active: true
    };

    await StorageService.saveCoupon(newCoupon);
    setCode('');
  };

  const toggleCouponActive = async (coup: Coupon) => {
    const updated = { ...coup, is_active: !coup.is_active };
    await StorageService.saveCoupon(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Coupon List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
        <h2 className="font-serif-luxury text-lg font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-3">
          Weaver Coupon Codes & Discount Rules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {coupons.map((c) => (
            <div key={c.id} className="p-4 bg-[#FBF9F5] rounded-xl border border-[#E2D9C8] flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-mono font-extrabold text-sm text-[#4A0E17]">{c.code}</span>
                </div>
                <p className="text-xs text-[#2D1619] mt-1 font-semibold">
                  {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                </p>
                <p className="text-[11px] text-[#8A7B7E] mt-0.5">
                  Min Order: ₹{c.min_order_amount.toLocaleString('en-IN')}
                </p>
              </div>

              <button
                onClick={() => toggleCouponActive(c)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                  c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {c.is_active ? 'ACTIVE' : 'INACTIVE'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Coupon Form */}
      <form onSubmit={handleCreateCoupon} className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4 text-xs h-fit">
        <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-2">
          Create New Promo Coupon
        </h3>

        <div>
          <label className="font-bold text-[#2D1619] block mb-1">Coupon Code *</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SILK20"
            className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-mono uppercase"
            required
          />
        </div>

        <div>
          <label className="font-bold text-[#2D1619] block mb-1">Discount Type</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as any)}
            className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
          >
            <option value="percentage">Percentage Discount (%)</option>
            <option value="fixed">Fixed Amount Discount (₹)</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-[#2D1619] block mb-1">Discount Value *</label>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-bold text-[#4A0E17]"
            required
          />
        </div>

        <div>
          <label className="font-bold text-[#2D1619] block mb-1">Minimum Order Amount (₹)</label>
          <input
            type="number"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(Number(e.target.value))}
            className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[#2D1619] text-[#F4E8C1] font-bold rounded-xl hover:bg-[#4A0E17]"
        >
          Save Coupon Code
        </button>
      </form>

    </div>
  );
};

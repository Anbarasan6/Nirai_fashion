import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { Coupon } from '../../types';
import { Tag, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

export const CouponManager: React.FC = () => {
  const { showToast } = useShop();
  const [coupons, setCoupons] = useState<Coupon[]>(() => StorageService.getCoupons());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(1000);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(1500);
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [isActive, setIsActive] = useState(true);

  const syncCoupons = () => {
    setCoupons(StorageService.getCoupons());
  };

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setCode('FESTIVE20');
    setDescription('Festive 20% discount on traditional handlooms');
    setDiscountType('PERCENTAGE');
    setDiscountValue(20);
    setMinOrderAmount(1500);
    setMaxDiscountAmount(2000);
    setValidUntil('2026-12-31');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderAmount(c.minOrderAmount);
    setMaxDiscountAmount(c.maxDiscountAmount);
    setValidUntil(c.validUntil);
    setIsActive(c.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const payload: Coupon = {
      id: editingCoupon?.id || `coup-${Date.now()}`,
      code: code.trim().toUpperCase(),
      description,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      validUntil,
      isActive,
      usageCount: editingCoupon?.usageCount || 0,
    };

    StorageService.saveCoupon(payload);
    syncCoupons();
    setIsModalOpen(false);
    showToast(editingCoupon ? 'Coupon updated' : 'Coupon created', 'success');
  };

  const handleDelete = (id: string, cCode: string) => {
    if (confirm(`Delete coupon code ${cCode}?`)) {
      StorageService.deleteCoupon(id);
      syncCoupons();
      showToast('Coupon removed', 'info');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Promotional Coupons & Festive Offers
          </h2>
          <p className="text-xs text-stone-500">
            Configure discount codes with minimum order limits and expiry dates.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl border border-[#E2DBD0] shadow-2xs p-5 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-900">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-mono text-base font-bold text-slate-900">
                      {c.code}
                    </h3>
                    <span className="text-[11px] text-emerald-800 font-semibold">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {c.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-stone-600 mt-3 leading-relaxed">
                {c.description}
              </p>

              <div className="mt-3 pt-3 border-t border-stone-100 space-y-1 text-[11px] text-stone-500">
                <div className="flex justify-between">
                  <span>Min Order Amount:</span>
                  <span className="font-semibold text-slate-800 tabular-nums">₹{c.minOrderAmount.toLocaleString()}</span>
                </div>
                {c.maxDiscountAmount && (
                  <div className="flex justify-between">
                    <span>Max Discount Cap:</span>
                    <span className="font-semibold text-slate-800 tabular-nums">₹{c.maxDiscountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Valid Until:</span>
                  <span className="font-mono text-slate-800">{c.validUntil}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400 font-medium">Used: {c.usageCount} times</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 text-stone-600 hover:text-amber-900 rounded hover:bg-stone-100"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.code)}
                  className="p-1.5 text-stone-600 hover:text-rose-600 rounded hover:bg-stone-100"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-serif text-base font-bold text-slate-900">
                {editingCoupon ? 'Edit Promo Coupon' : 'Create Promo Coupon'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. NIRAI10"
                  className="w-full p-2 border border-stone-300 rounded-md uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Offer Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 10% instant festive discount"
                  className="w-full p-2 border border-stone-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md bg-white font-semibold"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full p-2 border border-stone-300 rounded-md font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Max Cap (₹, optional)</label>
                  <input
                    type="number"
                    value={maxDiscountAmount || ''}
                    onChange={(e) => setMaxDiscountAmount(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Valid Until (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-md font-mono"
                />
              </div>

              <label className="flex items-center gap-2 font-semibold text-stone-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-900"
                />
                <span>Active Coupon</span>
              </label>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

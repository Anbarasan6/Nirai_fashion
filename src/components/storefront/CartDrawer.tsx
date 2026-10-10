import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { X, Trash2, ArrowRight, Truck, Tag, ShoppingBag } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    language,
    t,
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    cartSubtotal,
    cartItemCount,
    freeShippingThreshold,
    isFreeShipping,
    amountNeededForFreeShipping,
    shippingFee,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponDiscount,
    cartGrandTotal,
    setActiveTab,
  } = useShop();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError(null);
    const result = applyCoupon(couponInput.trim());
    if (!result.success) {
      setCouponError(result.message);
    } else {
      setCouponInput('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setActiveTab('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Free shipping percentage progress
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF9F5] border-l border-[#E5DFD3] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E8E2D5] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-900" />
              <h2 className="font-serif text-lg font-bold text-slate-900">
                {t.cart.title}
              </h2>
              <span className="text-xs font-semibold text-stone-500 tabular-nums">
                ({cartItemCount} items)
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-slate-800 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator Bar */}
          <div className="px-5 py-3.5 bg-[#F4EFE6] border-b border-[#E8E2D5] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                <Truck className="w-4 h-4 text-amber-800 shrink-0" />
                <span>
                  {isFreeShipping
                    ? t.freeDelivery.unlocked
                    : t.freeDelivery.away(amountNeededForFreeShipping)}
                </span>
              </div>
              <span className="font-bold text-slate-800 tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#DFD8C8] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-700 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-800">{t.cart.empty}</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    {t.cart.emptySub}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setActiveTab('catalog');
                  }}
                  className="px-5 py-2.5 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {t.cart.startShopping}
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemTotal = (item.product.finalPrice || item.product.basePrice) * item.quantity;
                return (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="flex gap-3.5 p-3 bg-white rounded-xl border border-[#E5DFD3] shadow-2xs"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                      <ImageWithFallback
                        src={item.product.images[0]}
                        alt={item.product.nameEn}
                        fallbackText={item.product.nameEn}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-serif text-xs font-bold text-slate-900 line-clamp-1">
                            {language === 'ta' && item.product.nameTa ? item.product.nameTa : item.product.nameEn}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.productId, item.variantId)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {item.selectedVariant?.size || item.selectedVariant?.name || 'Standard'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100">
                        {/* Stepper */}
                        <div className="flex items-center border border-stone-200 rounded-md bg-stone-50 overflow-hidden">
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-200 font-bold"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-semibold text-slate-900 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-200 font-bold"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <span className="font-serif text-xs font-bold text-slate-900 tabular-nums">
                          ₹{itemTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-[#E8E2D5] bg-white space-y-4">
              {/* Coupon Form */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Tag className="w-4 h-4" />
                    <span className="font-bold">{appliedCoupon.code}</span>
                    <span>(-₹{couponDiscount.toLocaleString()})</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-stone-500 hover:text-rose-600 font-semibold text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Try NIRAI10 or PONGAL2026"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800 uppercase font-semibold"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                  )}
                </form>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-100 pt-3">
                <div className="flex justify-between">
                  <span>{t.cart.itemTotal}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    ₹{cartSubtotal.toLocaleString()}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Promo Coupon Discount</span>
                    <span className="tabular-nums">-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t.cart.shippingFee}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 uppercase font-bold">FREE</span>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-slate-950 font-serif">
                  <span>{t.cart.grandTotal}</span>
                  <span className="text-base tabular-nums">₹{cartGrandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>{t.cart.checkoutBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

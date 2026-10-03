import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const CartDrawer: React.FC = () => {
  const {
    language,
    t,
    cart,
    removeFromCart,
    updateCartQuantity,
    isCartOpen,
    setIsCartOpen,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discountAmount,
    shippingFee,
    grandTotal
  } = useShop();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ success: boolean; text: string } | null>(null);
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    const result = applyCoupon(couponCodeInput.trim());
    setCouponMessage({ success: result.success, text: result.message });
    if (result.success) setCouponCodeInput('');
  };

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FBF9F5] text-[#1E1012] shadow-2xl flex flex-col border-l border-[#D4AF37]/40 animate-slideLeft">
          
          {/* Drawer Header */}
          <div className="p-4 bg-[#2D1619] text-[#FBF9F5] flex items-center justify-between border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-serif-luxury text-base font-bold text-[#F4E8C1]">
                {t('shoppingCart')} ({cart.length})
              </h3>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 text-[#F4E8C1] hover:text-[#D4AF37] rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-[#ECE6D9] text-[#4A0E17] rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium text-[#4A0E17]">
                  {t('cartEmpty')}
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/catalog');
                  }}
                  className="px-6 py-2.5 bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold rounded-full hover:bg-[#2D1619] transition shadow-md"
                >
                  {t('startShopping')}
                </button>
              </div>
            ) : (
              cart.map((item, index) => {
                const price = item.product.discount_price || item.product.price;
                const name = language === 'ta' && item.product.name_ta ? item.product.name_ta : item.product.name_en;
                const image = item.product.images[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80';

                return (
                  <div
                    key={`${item.product.id}-${item.selected_variant || index}`}
                    className="flex gap-3 p-3 bg-white rounded-xl border border-[#E2D9C8] shadow-sm relative group"
                  >
                    <img
                      src={image}
                      alt={name}
                      className="w-20 h-24 object-cover rounded-lg border border-[#ECE6D9] shrink-0"
                    />
                    
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="text-xs font-bold text-[#2D1619] truncate leading-tight">
                          {name}
                        </h4>
                        {item.selected_variant && (
                          <span className="inline-block mt-1 text-[11px] font-medium text-[#4A0E17] bg-[#F4E8C1] px-2 py-0.5 rounded-full">
                            Color: {item.selected_variant}
                          </span>
                        )}
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-sm font-extrabold text-[#4A0E17]">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          {item.product.discount_price && (
                            <span className="text-xs text-[#8A7B7E] line-through">
                              ₹{item.product.price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F2ECDF]">
                        <div className="flex items-center border border-[#D4AF37]/50 rounded-lg overflow-hidden bg-[#FBF9F5]">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selected_variant)}
                            className="p-1 hover:bg-[#ECE6D9] text-[#4A0E17]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-[#2D1619]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selected_variant)}
                            className="p-1 hover:bg-[#ECE6D9] text-[#4A0E17]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id, item.selected_variant)}
                          className="text-[#8A7B7E] hover:text-[#800020] p-1 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer Summary */}
          {cart.length > 0 && (
            <div className="p-4 bg-white border-t border-[#E2D9C8] space-y-3">
              {/* Coupon Form */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-[#F4E8C1]/60 border border-[#D4AF37] rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#4A0E17]">
                    <Tag className="w-4 h-4 text-[#D4AF37]" />
                    <span>Coupon: {appliedCoupon.code} (-₹{discountAmount})</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-[#800020] underline font-medium hover:text-[#2D1619]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code (e.g. SILK15)"
                    className="flex-1 text-xs px-3 py-2 border border-[#D4AF37]/50 rounded-lg focus:outline-none focus:border-[#4A0E17] bg-[#FBF9F5]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2D1619] text-[#F4E8C1] text-xs font-bold rounded-lg hover:bg-[#4A0E17] transition"
                  >
                    {t('applyCoupon')}
                  </button>
                </form>
              )}

              {couponMessage && !appliedCoupon && (
                <p className={`text-[11px] ${couponMessage.success ? 'text-green-700' : 'text-red-600'}`}>
                  {couponMessage.text}
                </p>
              )}

              {/* Price Calculation Lines */}
              <div className="space-y-1.5 text-xs text-[#4A0E17]">
                <div className="flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span className="font-semibold">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Weaver Coupon Discount</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B5B5E]">
                  <span>Shipping Fee</span>
                  <span>{shippingFee === 0 ? <strong className="text-green-700">FREE</strong> : `₹${shippingFee}`}</span>
                </div>
                <div className="pt-2 border-t border-[#E2D9C8] flex justify-between text-base font-extrabold text-[#2D1619]">
                  <span>{t('totalAmount')}</span>
                  <span className="text-[#4A0E17]">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Zero Fee Guarantee Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#0B6623] font-medium bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-[#0B6623]" />
                <span>0% Gateway Surcharge via Instant UPI QR scan</span>
              </div>

              {/* Proceed to Checkout Button */}
              <button
                onClick={handleCheckoutClick}
                className="w-full py-3 bg-gradient-to-r from-[#4A0E17] via-[#2D1619] to-[#4A0E17] text-[#F4E8C1] font-bold text-sm rounded-xl hover:shadow-xl transition flex items-center justify-center gap-2 group"
              >
                <span>{t('proceedToCheckout')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#D4AF37]" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

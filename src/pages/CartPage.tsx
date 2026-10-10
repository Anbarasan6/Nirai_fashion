import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowLeft, ShieldCheck } from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    cartSubtotal,
    freeShippingThreshold,
    isFreeShipping,
    amountNeededForFreeShipping,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    couponDiscount,
    cartGrandTotal,
    language,
  } = useShop();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-slate-800">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Explore our handcrafted Kanchipuram silks, Chettinad cottons, and Salem dhotis to fill your bag with tradition.
        </p>
        <button
          onClick={() => navigate('/catalog')}
          className="mt-4 px-6 py-3 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 text-xs font-semibold rounded-xl cursor-pointer"
        >
          Explore Handloom Collections
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Shopping Bag ({cart.length} items)
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Review your selected handloom items before proceeding to payment.
            </p>
          </div>
          <button
            onClick={() => navigate('/catalog')}
            className="text-xs font-medium text-amber-900 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/80 text-xs text-amber-950">
          {isFreeShipping ? (
            <p className="font-semibold text-emerald-800">
              🎉 Congratulations! You unlocked Free Shipping across India!
            </p>
          ) : (
            <p>
              Add <strong className="font-serif">₹{amountNeededForFreeShipping.toLocaleString()}</strong> more to get <strong className="text-amber-900">FREE Shipping</strong> (Threshold: ₹{freeShippingThreshold.toLocaleString()})
            </p>
          )}
          <div className="w-full bg-amber-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-amber-800 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (cartSubtotal / freeShippingThreshold) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DFD3] shadow-2xs flex gap-4 items-start"
              >
                <div className="w-20 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                  <ImageWithFallback
                    src={item.product.images[0]}
                    alt={item.product.nameEn}
                    fallbackText={item.product.nameEn}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-serif font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
                        {language === 'ta' && item.product.nameTa ? item.product.nameTa : item.product.nameEn}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-stone-500 mt-0.5">
                      Variant: <span className="font-medium text-slate-700">{item.selectedVariant.name}</span>
                      {item.selectedVariant.size && ` · Size: ${item.selectedVariant.size}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                    <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-stone-50">
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="p-1.5 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="p-1.5 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-serif font-bold text-slate-950 text-base tabular-nums">
                        ₹{((item.product.finalPrice || item.product.basePrice) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-xs text-rose-700 hover:text-rose-900 font-medium underline cursor-pointer"
            >
              Clear Entire Bag
            </button>
          </div>

          {/* Cart Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-5 sticky top-24">
              <h3 className="font-serif text-base font-bold text-slate-900 border-b border-stone-100 pb-3">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    ₹{cartSubtotal.toLocaleString()}
                  </span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span className="tabular-nums">-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Delivery Fee</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {isFreeShipping ? <span className="text-emerald-700 uppercase font-bold">FREE</span> : 'Calculated at Checkout'}
                  </span>
                </div>

                <div className="flex justify-between pt-3 border-t border-stone-200 text-base font-bold text-slate-950 font-serif">
                  <span>Total Payable</span>
                  <span className="tabular-nums">₹{cartGrandTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>Proceed to Direct UPI Checkout</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                <span>100% Handloom Authenticity Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

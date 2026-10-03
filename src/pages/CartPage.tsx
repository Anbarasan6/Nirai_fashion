import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Truck } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CartPage: React.FC = () => {
  const {
    language,
    t,
    cart,
    removeFromCart,
    updateCartQuantity,
    cartTotal,
    discountAmount,
    shippingFee,
    grandTotal
  } = useShop();

  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-[#ECE6D9] text-[#4A0E17] rounded-full flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#4A0E17]">{t('cartEmpty')}</h2>
        <p className="text-xs text-[#6B5B5E]">Explore Salem & Kanchipuram pure silk handloom sarees.</p>
        <Link to="/catalog" className="inline-block px-6 py-2.5 bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold rounded-full">
          {t('startShopping')}
        </Link>
      </div>
    );
  }

  const freeShippingNeeded = Math.max(0, 2999 - cartTotal);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div className="border-b border-[#E2D9C8] pb-4">
        <h1 className="font-serif-luxury text-2xl sm:text-4xl font-extrabold text-[#2D1619]">
          {t('shoppingCart')} ({cart.length} Sarees)
        </h1>
      </div>

      {/* Free Shipping Progress Indicator */}
      <div className="p-4 bg-[#F4E8C1]/60 border border-[#D4AF37] rounded-2xl flex items-center gap-3 text-xs">
        <Truck className="w-5 h-5 text-[#4A0E17] shrink-0" />
        {freeShippingNeeded > 0 ? (
          <span>
            Add <strong className="text-[#4A0E17]">₹{freeShippingNeeded.toLocaleString('en-IN')}</strong> more to your cart to qualify for <strong>FREE Express Shipping</strong> across India!
          </span>
        ) : (
          <span className="font-bold text-[#0B6623]">
            ✓ Congratulations! Your order qualifies for FREE Express Shipping!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, index) => {
            const price = item.product.discount_price || item.product.price;
            const name = language === 'ta' && item.product.name_ta ? item.product.name_ta : item.product.name_en;

            return (
              <div key={`${item.product.id}-${index}`} className="flex gap-4 p-4 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm">
                <img src={item.product.images[0]} alt={name} className="w-24 h-28 object-cover rounded-xl border border-[#ECE6D9] shrink-0" />
                
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-serif-luxury text-sm font-bold text-[#2D1619] truncate">{name}</h3>
                    {item.selected_variant && (
                      <span className="inline-block mt-1 text-[11px] font-semibold text-[#4A0E17] bg-[#F4E8C1] px-2 py-0.5 rounded-full">
                        Color: {item.selected_variant}
                      </span>
                    )}
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-[#4A0E17]">₹{price.toLocaleString('en-IN')}</span>
                      {item.product.discount_price && (
                        <span className="text-xs text-[#8A7B7E] line-through">₹{item.product.price.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F2ECDF]">
                    <div className="flex items-center border border-[#D4AF37]/50 rounded-lg overflow-hidden bg-[#FBF9F5]">
                      <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selected_variant)} className="p-1 hover:bg-[#ECE6D9]">
                        <Minus className="w-3.5 h-3.5 text-[#4A0E17]" />
                      </button>
                      <span className="px-3 text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selected_variant)} className="p-1 hover:bg-[#ECE6D9]">
                        <Plus className="w-3.5 h-3.5 text-[#4A0E17]" />
                      </button>
                    </div>

                    <button onClick={() => removeFromCart(item.product.id, item.selected_variant)} className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1">
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Calculation Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
            <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-3">
              Order Summary
            </h3>

            <div className="space-y-2 text-xs text-[#4A0E17]">
              <div className="flex justify-between">
                <span>{t('subtotal')}</span>
                <span className="font-semibold">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-[#6B5B5E]">
                <span>Shipping Fee</span>
                <span>{shippingFee === 0 ? <strong className="text-green-700">FREE</strong> : `₹${shippingFee}`}</span>
              </div>

              <div className="pt-3 border-t border-[#E2D9C8] flex justify-between text-lg font-extrabold text-[#2D1619]">
                <span>{t('totalAmount')}</span>
                <span className="text-[#4A0E17]">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-gradient-to-r from-[#4A0E17] via-[#2D1619] to-[#4A0E17] text-[#F4E8C1] font-extrabold text-sm rounded-xl hover:shadow-xl transition flex items-center justify-center gap-2 shadow-md"
            >
              <span>{t('proceedToCheckout')}</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { PaymentMethod, Address } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Truck,
  CreditCard,
  Banknote,
  Sparkles,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const {
    language,
    t,
    cart,
    clearCart,
    cartSubtotal,
    shippingFee,
    couponDiscount,
    appliedCoupon,
    cartGrandTotal,
    setActiveTab,
    openTracking,
    currentUser,
    showToast,
  } = useShop();

  const [fullName, setFullName] = useState(currentUser?.name || 'Priya Sundaram');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98401 22334');
  const [email, setEmail] = useState(currentUser?.email || 'priya@example.com');
  const [street, setStreet] = useState('Flat 4B, Shanthi Nivas, 12th Cross St, Besant Nagar');
  const [landmark, setLandmark] = useState('Near Murugan Temple');
  const [city, setCity] = useState('Chennai');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('600090');

  const [deliveryType, setDeliveryType] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE_UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompleteOrder, setOrderCompleteOrder] = useState<any>(null);

  if (cart.length === 0 && !orderCompleteOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-slate-800">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-xs text-stone-500 mt-2">
          Please add items to your bag before proceeding to checkout.
        </p>
        <button
          onClick={() => setActiveTab('catalog')}
          className="mt-6 px-5 py-2.5 bg-[#2D1619] text-amber-100 text-xs font-semibold rounded-lg"
        >
          Browse Handloom Collections
        </button>
      </div>
    );
  }

  // Delivery fee adjustments
  const finalShippingFee = deliveryType === 'express' ? 199 : shippingFee;
  const finalPayable = Math.max(0, cartSubtotal - couponDiscount + finalShippingFee);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !street || !city || !pincode) {
      showToast('Please fill in all required shipping address fields', 'error');
      return;
    }

    setIsProcessing(true);

    // Simulate order placement & payment verification
    setTimeout(() => {
      const shippingAddress: Address = {
        id: `addr-${Date.now()}`,
        fullName,
        phone,
        street,
        landmark,
        city,
        state,
        pincode,
        isDefault: true,
      };

      const orderItems = cart.map((item) => ({
        productId: item.productId,
        productName: item.product.nameEn,
        productImage: item.product.images[0] || '',
        variantId: item.variantId,
        variantName: item.selectedVariant.name,
        size: item.selectedVariant.size,
        color: item.selectedVariant.color,
        sku: item.selectedVariant.sku || item.product.sku,
        unitPrice: item.product.finalPrice || item.product.basePrice,
        quantity: item.quantity,
        totalPrice: (item.product.finalPrice || item.product.basePrice) * item.quantity,
      }));

      const newOrder = StorageService.createOrder({
        customerId: currentUser?.id || `guest-${Date.now()}`,
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress,
        items: orderItems,
        subtotal: cartSubtotal,
        discountAmount: couponDiscount,
        couponCode: appliedCoupon?.code,
        shippingFee: finalShippingFee,
        freeShippingApplied: finalShippingFee === 0,
        grandTotal: finalPayable,
        status: 'Confirmed',
        paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
        paymentMethod,
        shippingDetails: {
          courierName: 'BlueDart Express',
          trackingId: `NIRAI${Math.floor(10000000 + Math.random() * 90000000)}IN`,
          trackingUrl: 'https://www.bluedart.com',
          estimatedDelivery: deliveryType === 'express' ? 'Within 48 hours' : 'Within 3-4 days',
        },
      });

      setIsProcessing(false);
      setOrderCompleteOrder(newOrder);
      clearCart();
      showToast(`Order #${newOrder.orderNumber} placed successfully!`, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  // Order Success Receipt View
  if (orderCompleteOrder) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-[#E5DFD3] shadow-md p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-800 font-bold block mb-1">
                Order Confirmed
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                Nandri for shopping at Nirai!
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Your handcrafted attire is now being prepared by our fulfillment team.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-[#FAF8F3] p-4 rounded-xl border border-[#E5DFD3] text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Order Number</span>
                <span className="font-bold text-slate-900 font-mono">{orderCompleteOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Total Amount Paid / Payable</span>
                <span className="font-bold text-slate-900 font-serif tabular-nums">
                  ₹{orderCompleteOrder.grandTotal.toLocaleString()} ({orderCompleteOrder.paymentMethod})
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Assigned Courier</span>
                <span className="font-semibold text-slate-900">
                  {orderCompleteOrder.shippingDetails?.courierName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Estimated Delivery</span>
                <span className="font-semibold text-emerald-800">
                  {orderCompleteOrder.shippingDetails?.estimatedDelivery}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => openTracking(orderCompleteOrder.orderNumber)}
                className="px-6 py-3 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Truck className="w-4 h-4" />
                <span>Track Live Order Status</span>
              </button>

              <button
                onClick={() => setActiveTab('catalog')}
                className="px-6 py-3 border border-stone-300 hover:bg-stone-50 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-8">
          <button
            onClick={() => setActiveTab('catalog')}
            className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Bag</span>
          </button>
          <span>/</span>
          <span className="text-slate-900 font-medium">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Multi-Step Checkout Form */}
          <div className="lg:col-span-7 space-y-8">
            <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-8">
              {/* Step 1: Shipping Address */}
              <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <div className="w-6 h-6 rounded-full bg-amber-900 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </div>
                  <h3 className="font-serif text-base font-bold text-slate-900">
                    {t.checkout.shippingAddress}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.fullName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.phone} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">
                      Email Address (for order updates)
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.street} *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.landmark}
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.city} *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.state} *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.pincode} *
                    </label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Delivery Method */}
              <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <div className="w-6 h-6 rounded-full bg-amber-900 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </div>
                  <h3 className="font-serif text-base font-bold text-slate-900">
                    {t.checkout.deliveryMethod}
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <label
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      deliveryType === 'standard'
                        ? 'border-amber-900 bg-amber-50/50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryType === 'standard'}
                        onChange={() => setDeliveryType('standard')}
                        className="text-amber-900 focus:ring-amber-900"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {t.checkout.standardDelivery}
                        </span>
                        <span className="text-stone-500">Delivered within 3 to 5 business days</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      deliveryType === 'express'
                        ? 'border-amber-900 bg-amber-50/50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryType === 'express'}
                        onChange={() => setDeliveryType('express')}
                        className="text-amber-900 focus:ring-amber-900"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">
                            {t.checkout.expressDelivery}
                          </span>
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                            Priority
                          </span>
                        </div>
                        <span className="text-stone-500">Delivered within 24 to 48 hours</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">₹199</span>
                  </label>
                </div>
              </div>

              {/* Step 3: Payment Options */}
              <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <div className="w-6 h-6 rounded-full bg-amber-900 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </div>
                  <h3 className="font-serif text-base font-bold text-slate-900">
                    {t.checkout.paymentMethod}
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Online Payment (UPI / Cards) */}
                  <label
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'ONLINE_UPI'
                        ? 'border-amber-900 bg-amber-50/50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'ONLINE_UPI'}
                        onChange={() => setPaymentMethod('ONLINE_UPI')}
                        className="text-amber-900 focus:ring-amber-900"
                      />
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-amber-800" />
                        <div>
                          <span className="font-bold text-slate-900 block">
                            Instant UPI / Cards / Netbanking
                          </span>
                          <span className="text-stone-500">Google Pay, PhonePe, Paytm & Major Credit/Debit Cards</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Instant Confirmation
                    </span>
                  </label>

                  {/* Cash on Delivery */}
                  <label
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-amber-900 bg-amber-50/50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="text-amber-900 focus:ring-amber-900"
                      />
                      <div className="flex items-center gap-2.5">
                        <Banknote className="w-4 h-4 text-amber-800" />
                        <div>
                          <span className="font-bold text-slate-900 block">
                            Cash on Delivery (COD)
                          </span>
                          <span className="text-stone-500">Pay in cash or UPI when your order is delivered</span>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button for Mobile view */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isProcessing ? t.checkout.processing : `${t.checkout.placeOrder} (₹${finalPayable.toLocaleString()})`}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6 sticky top-24">
              <h3 className="font-serif text-base font-bold text-slate-900 border-b border-stone-100 pb-3">
                {t.checkout.orderSummary} ({cart.length} items)
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 text-xs">
                    <div className="w-14 h-16 rounded-md overflow-hidden bg-stone-100 shrink-0">
                      <ImageWithFallback
                        src={item.product.images[0]}
                        alt={item.product.nameEn}
                        fallbackText={item.product.nameEn}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif font-semibold text-slate-900 line-clamp-1">
                          {language === 'ta' && item.product.nameTa ? item.product.nameTa : item.product.nameEn}
                        </h4>
                        <span className="text-[11px] text-stone-500">
                          Qty: {item.quantity} · {item.selectedVariant.size || 'Free Size'}
                        </span>
                      </div>
                      <span className="font-serif font-bold text-slate-900 tabular-nums">
                        ₹{((item.product.finalPrice || item.product.basePrice) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Details */}
              <div className="space-y-2 text-xs border-t border-stone-100 pt-4 text-stone-600">
                <div className="flex justify-between">
                  <span>Items Total</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    ₹{cartSubtotal.toLocaleString()}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span className="tabular-nums">-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {finalShippingFee === 0 ? (
                      <span className="text-emerald-700 uppercase font-bold">FREE</span>
                    ) : (
                      `₹${finalShippingFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-stone-200 text-base font-bold text-slate-950 font-serif">
                  <span>Grand Total</span>
                  <span className="tabular-nums">₹{finalPayable.toLocaleString()}</span>
                </div>
              </div>

              {/* Desktop Place Order Button */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className="hidden lg:flex w-full py-4 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>{isProcessing ? t.checkout.processing : t.checkout.placeOrder}</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                <span>{t.checkout.guarantee}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

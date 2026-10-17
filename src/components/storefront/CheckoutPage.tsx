import React, { useState, useEffect } from 'react';
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
  Smartphone,
  Banknote,
  QrCode,
  Copy,
  ExternalLink,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

// UPI deep-link builders
function buildGPayLink(upiId: string, amount: number, name: string) {
  return `tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
}
function buildPhonePeLink(upiId: string, amount: number, name: string) {
  return `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
}
function buildPaytmLink(upiId: string, amount: number, name: string) {
  return `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
}
function buildGenericUpiLink(upiId: string, amount: number, name: string) {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Nirai Handlooms Order')}`;
}

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
    storeSettings,
  } = useShop();

  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [deliveryType, setDeliveryType] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE_UPI');
  const [utrNumber, setUtrNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompleteOrder, setOrderCompleteOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const upi = storeSettings?.upiDetails;
  const bank = storeSettings?.bankDetails;

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

  const copyUpiId = () => {
    if (upi?.upiId) {
      navigator.clipboard.writeText(upi.upiId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !street || !city || !pincode) {
      showToast('Please fill in all required shipping address fields', 'error');
      return;
    }

    if (paymentMethod === 'ONLINE_UPI' && !utrNumber.trim()) {
      showToast('Please enter your UPI Transaction / UTR Reference number after payment', 'error');
      return;
    }

    setIsProcessing(true);

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
        paymentStatus: paymentMethod === 'ONLINE_UPI' ? 'PENDING_VERIFICATION' : 'Paid',
        paymentMethod,
        utrNumber: utrNumber.trim() || undefined,
        shippingDetails: {
          courierName: 'BlueDart Express',
          trackingId: `NIRAI${Math.floor(10000000 + Math.random() * 90000000)}IN`,
          trackingUrl: 'https://www.bluedart.com',
          estimatedDelivery: deliveryType === 'express' ? 'Within 48 hours' : 'Within 3-5 days',
        },
      });

      setIsProcessing(false);
      setOrderCompleteOrder(newOrder);
      clearCart();
      showToast(`Order #${newOrder.orderNumber} placed! Payment verification in progress.`, 'success');
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
                <span className="text-stone-500">Amount Paid</span>
                <span className="font-bold text-slate-900 font-serif tabular-nums">
                  ₹{orderCompleteOrder.grandTotal.toLocaleString()} ({orderCompleteOrder.paymentMethod})
                </span>
              </div>
              {orderCompleteOrder.utrNumber && (
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">UTR / Ref No.</span>
                  <span className="font-semibold text-slate-900 font-mono">{orderCompleteOrder.utrNumber}</span>
                </div>
              )}
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

            {/* Payment pending notice */}
            {orderCompleteOrder.paymentStatus === 'PENDING_VERIFICATION' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-amber-800">
                    Your UPI payment is pending verification. Our team will confirm within 30 minutes. 
                    You'll receive a WhatsApp/SMS notification once verified.
                  </p>
                </div>
              </div>
            )}

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
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setPincode(val);
                        if (val.length === 6) {
                          if (val.startsWith('600') || val.startsWith('601') || val.startsWith('602') || val.startsWith('603')) {
                            setCity('Chennai'); setState('Tamil Nadu');
                          } else if (val.startsWith('625')) {
                            setCity('Madurai'); setState('Tamil Nadu');
                          } else if (val.startsWith('641')) {
                            setCity('Coimbatore'); setState('Tamil Nadu');
                          } else if (val.startsWith('636')) {
                            setCity('Salem'); setState('Tamil Nadu');
                          } else if (val.startsWith('631')) {
                            setCity('Kanchipuram'); setState('Tamil Nadu');
                          } else if (val.startsWith('627')) {
                            setCity('Tirunelveli'); setState('Tamil Nadu');
                          }
                        }
                      }}
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800 font-mono"
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
                  {/* UPI Payment Option */}
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
                        <Smartphone className="w-4 h-4 text-amber-800" />
                        <div>
                          <span className="font-bold text-slate-900 block">
                            UPI / QR Code Payment
                          </span>
                          <span className="text-stone-500">GPay, PhonePe, Paytm &amp; Any UPI App</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  </label>

                  {/* Online Card */}
                  <label
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'ONLINE_CARD'
                        ? 'border-amber-900 bg-amber-50/50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'ONLINE_CARD'}
                        onChange={() => setPaymentMethod('ONLINE_CARD')}
                        className="text-amber-900 focus:ring-amber-900"
                      />
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-amber-800" />
                        <div>
                          <span className="font-bold text-slate-900 block">
                            Credit / Debit Card
                          </span>
                          <span className="text-stone-500">Visa, Mastercard, RuPay &amp; Netbanking</span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Bank Transfer */}
                  <label
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-amber-900 bg-amber-50/50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'BANK_TRANSFER'}
                        onChange={() => setPaymentMethod('BANK_TRANSFER')}
                        className="text-amber-900 focus:ring-amber-900"
                      />
                      <div className="flex items-center gap-2.5">
                        <Banknote className="w-4 h-4 text-amber-800" />
                        <div>
                          <span className="font-bold text-slate-900 block">
                            Direct Bank Transfer (NEFT/IMPS)
                          </span>
                          <span className="text-stone-500">Transfer to our bank account directly</span>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* UPI Payment Panel - QR Code & App Links */}
                {paymentMethod === 'ONLINE_UPI' && upi && (
                  <div className="mt-4 space-y-4 border border-amber-200 rounded-xl bg-amber-50/40 p-4">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-amber-800" />
                      <span className="text-xs font-bold text-slate-900">Pay ₹{finalPayable.toLocaleString()} via UPI</span>
                    </div>

                    {/* UPI ID with copy button */}
                    <div className="bg-white rounded-lg border border-stone-200 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-stone-500 mb-0.5">UPI ID</p>
                        <p className="text-sm font-bold text-slate-900 font-mono">{upi.upiId}</p>
                        <p className="text-[10px] text-stone-500">{upi.merchantName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={copyUpiId}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          copied
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-900 text-amber-100 hover:bg-amber-800'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    {/* QR Code Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowQR(!showQR)}
                      className="w-full text-xs font-semibold text-amber-900 border border-amber-300 bg-white rounded-lg py-2 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      {showQR ? 'Hide QR Code' : 'Show QR Code to Scan'}
                    </button>

                    {showQR && (
                      <div className="flex flex-col items-center gap-3 py-2">
                        {/* QR Code - uses Google Charts API to generate a real QR */}
                        <div className="bg-white p-3 rounded-xl border-2 border-amber-200 shadow-sm">
                          <img
                            src={
                              upi.qrCodeImageUrl
                                ? upi.qrCodeImageUrl
                                : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(buildGenericUpiLink(upi.upiId, finalPayable, upi.merchantName))}&bgcolor=ffffff&color=2D1619&margin=10`
                            }
                            alt="UPI QR Code"
                            className="w-48 h-48 object-contain"
                            onError={(e) => {
                              // Fallback: show a placeholder
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-900">Scan with any UPI App</p>
                          <p className="text-[10px] text-stone-500 mt-0.5">{upi.qrCodeNote || 'GPay · PhonePe · Paytm · BHIM'}</p>
                          <p className="text-sm font-bold text-amber-900 mt-1">₹{finalPayable.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    {/* Pay via App Buttons */}
                    <div>
                      <p className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider mb-2">
                        Or Pay directly via app
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <a
                          href={buildGPayLink(upi.upiId, finalPayable, upi.merchantName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1.5 p-2.5 bg-white border border-stone-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/30 transition-all text-center"
                        >
                          <span className="text-lg">🟢</span>
                          <span className="text-[10px] font-bold text-slate-700">Google Pay</span>
                        </a>
                        <a
                          href={buildPhonePeLink(upi.upiId, finalPayable, upi.merchantName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1.5 p-2.5 bg-white border border-stone-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/30 transition-all text-center"
                        >
                          <span className="text-lg">🟣</span>
                          <span className="text-[10px] font-bold text-slate-700">PhonePe</span>
                        </a>
                        <a
                          href={buildPaytmLink(upi.upiId, finalPayable, upi.merchantName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1.5 p-2.5 bg-white border border-stone-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/30 transition-all text-center"
                        >
                          <span className="text-lg">🔵</span>
                          <span className="text-[10px] font-bold text-slate-700">Paytm</span>
                        </a>
                      </div>
                    </div>

                    {/* UTR number input */}
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        Enter UPI Transaction / UTR Reference Number *
                      </label>
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. 123456789012 (12-digit UTR from your UPI app)"
                        className="w-full p-2.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800 font-mono"
                      />
                      <p className="text-[10px] text-stone-500 mt-1">
                        After paying, enter the Transaction ID / UTR number from your UPI app to confirm your order.
                      </p>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Details Panel */}
                {paymentMethod === 'BANK_TRANSFER' && bank && (
                  <div className="mt-4 border border-blue-200 rounded-xl bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-blue-700" />
                      <span className="text-xs font-bold text-slate-900">Bank Transfer Details</span>
                    </div>
                    <div className="bg-white rounded-lg border border-stone-200 p-3 space-y-2 text-xs">
                      {[
                        { label: 'Account Name', value: bank.accountName },
                        { label: 'Account No.', value: bank.accountNumber },
                        { label: 'IFSC Code', value: bank.ifscCode },
                        { label: 'Bank', value: bank.bankName },
                        { label: 'Branch', value: bank.branch },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-stone-500">{label}</span>
                          <span className="font-semibold text-slate-900 font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        Enter NEFT/IMPS Transaction Reference *
                      </label>
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. HDFC12345678901234"
                        className="w-full p-2.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Card payment note */}
                {paymentMethod === 'ONLINE_CARD' && (
                  <div className="mt-4 border border-stone-200 rounded-xl bg-stone-50 p-4 text-xs text-stone-600 space-y-1">
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      Payment Gateway Coming Soon
                    </p>
                    <p>
                      Card payments will be available shortly. Please use UPI or Bank Transfer to complete your order now.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button for Mobile view */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={isProcessing || paymentMethod === 'ONLINE_CARD'}
                  className="w-full py-4 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isProcessing ? t.checkout.processing : `Confirm Order (₹${finalPayable.toLocaleString()})`}</span>
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
                disabled={isProcessing || paymentMethod === 'ONLINE_CARD'}
                className="hidden lg:flex w-full py-4 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

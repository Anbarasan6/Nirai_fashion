import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { quoteCartViaRpc } from '../../services/supabase';
import { PaymentMethod, Address, CartQuote, PaymentSettings } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Truck,
  Smartphone,
  Banknote,
  AlertTriangle,
  Loader2,
  ArrowRight,
  HandCoins,
} from 'lucide-react';

// Zod validation schema for Indian shipping addresses
const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number starting with 6-9'),
  email: z.string().trim().email('Enter a valid email address'),
  street: z.string().trim().min(5, 'Street address is required (at least 5 characters)'),
  landmark: z.string().optional(),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit Indian PIN code'),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    language,
    t,
    cart,
    clearCart,
    appliedCoupon,
    setActiveTab,
    openTracking,
    currentUser,
    showToast,
  } = useShop();

  // Form Fields
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Validation Errors
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CheckoutFormValues, string>>>({});

  // Server Quote State
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState<boolean>(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Payment Settings (for COD check)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  // Delivery & Payment
  const [deliveryType, setDeliveryType] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE_UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompleteOrder, setOrderCompleteOrder] = useState<any>(null);

  // Idempotency key generated once per checkout session
  const [idempotencyKey] = useState<string>(() => `idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  // Load payment settings to check COD status
  useEffect(() => {
    StorageService.getPaymentSettings().then((res) => {
      if (res) setPaymentSettings(res);
    });
  }, []);

  // Server-side quote calculation
  useEffect(() => {
    if (cart.length === 0) {
      setIsQuoting(false);
      return;
    }

    let isMounted = true;
    setIsQuoting(true);
    setQuoteError(null);

    const quoteItems = cart.map((i) => ({
      productId: i.productId,
      variantId: i.variantId || null,
      quantity: i.quantity,
    }));

    quoteCartViaRpc(quoteItems, appliedCoupon?.code, pincode.length === 6 ? pincode : undefined)
      .then((res) => {
        if (!isMounted) return;
        setIsQuoting(false);
        if (res.success && res.data) {
          setQuote(res.data);
          setQuoteError(null);
        } else {
          setQuoteError(res.error || 'Server pricing calculation failed. Please check your cart.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsQuoting(false);
        setQuoteError(err.message || 'Error communicating with server pricing engine.');
      });

    return () => {
      isMounted = false;
    };
  }, [cart, appliedCoupon?.code, pincode]);

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
          className="mt-6 px-5 py-2.5 bg-[#2D1619] text-amber-100 text-xs font-semibold rounded-lg cursor-pointer"
        >
          Browse Handloom Collections
        </button>
      </div>
    );
  }

  // Final server-driven amounts
  const outOfStockItems = quote?.items?.filter((it) => !it.inStock) || [];
  const hasOutOfStock = outOfStockItems.length > 0;

  const baseShippingFee = quote?.shippingFee ?? 0;
  const finalShippingFee = deliveryType === 'express' ? Math.max(199, baseShippingFee + 99) : baseShippingFee;
  const serverSubtotal = quote?.subtotal ?? 0;
  const serverDiscount = quote?.discount ?? 0;
  const finalPayable = Math.max(0, serverSubtotal - serverDiscount + finalShippingFee);

  const handleValidateField = (field: keyof CheckoutFormValues, value: string) => {
    const currentValues: CheckoutFormValues = {
      fullName,
      phone,
      email,
      street,
      landmark,
      city,
      state,
      pincode,
      [field]: value,
    };
    const result = checkoutSchema.safeParse(currentValues);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      setFormErrors((prev) => ({ ...prev, [field]: issue ? issue.message : undefined }));
    } else {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Zod schema validation
    const formValues: CheckoutFormValues = {
      fullName,
      phone,
      email,
      street,
      landmark,
      city,
      state,
      pincode,
    };

    const validationResult = checkoutSchema.safeParse(formValues);
    if (!validationResult.success) {
      const errors: Partial<Record<keyof CheckoutFormValues, string>> = {};
      let firstInvalidKey: string | null = null;
      validationResult.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof CheckoutFormValues;
        if (!errors[key]) {
          errors[key] = issue.message;
          if (!firstInvalidKey) firstInvalidKey = key;
        }
      });
      setFormErrors(errors);
      if (firstInvalidKey) {
        const el = document.getElementById(`checkout-${firstInvalidKey}`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      showToast('Please check required address fields.', 'error');
      return;
    }
    setFormErrors({});

    // 2. Out of stock edge case
    if (hasOutOfStock) {
      showToast('Some items in your cart are out of stock. Please update your cart.', 'error');
      return;
    }

    // 3. Double-click prevention & processing
    setIsProcessing(true);

    try {
      const shippingAddress: Address = {
        id: `addr-${Date.now()}`,
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
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

      // Create order via server RPC (atomic transaction with stock lock & verification)
      const newOrder = await StorageService.createOrder({
        customerId: currentUser?.id || '',
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        shippingAddress,
        items: orderItems,
        subtotal: serverSubtotal,
        discountAmount: serverDiscount,
        couponCode: appliedCoupon?.code,
        shippingFee: finalShippingFee,
        freeShippingApplied: finalShippingFee === 0,
        grandTotal: finalPayable,
        status: paymentMethod === 'COD' ? 'Confirmed' : 'Pending',
        paymentStatus: 'Awaiting Payment',
        paymentMethod,
        shippingDetails: {
          courierName: '',
          trackingId: '',
          trackingUrl: '',
          estimatedDelivery: deliveryType === 'express' ? 'Within 48 hours' : 'Within 3-5 days',
        },
        idempotencyKey,
      });

      setIsProcessing(false);
      clearCart();

      // Store phone for guest payment lookup
      sessionStorage.setItem(`nirai_phone_${newOrder.orderNumber}`, phone.trim());

      if (paymentMethod === 'COD') {
        setOrderCompleteOrder(newOrder);
        showToast(`Order #${newOrder.orderNumber} placed with Cash on Delivery!`, 'success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showToast(`Order #${newOrder.orderNumber} placed! Proceeding to payment...`, 'success');
        navigate(`/pay/${newOrder.orderNumber}`, { state: { phone: phone.trim() } });
      }
    } catch (err: any) {
      setIsProcessing(false);
      showToast(err.message || 'Failed to place order. Please try again.', 'error');
    }
  };

  // COD Order Success View
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
                Order Confirmed (Cash on Delivery)
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                Nandri for shopping at Nirai!
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Your handcrafted attire is now being prepared. You can pay cash upon delivery.
              </p>
            </div>

            <div className="bg-[#FAF8F3] p-4 rounded-xl border border-[#E5DFD3] text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Order Number</span>
                <span className="font-bold text-slate-900 font-mono">{orderCompleteOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Amount Due at Delivery</span>
                <span className="font-bold text-slate-900 font-serif tabular-nums">
                  ₹{orderCompleteOrder.grandTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Estimated Delivery</span>
                <span className="font-semibold text-emerald-800">
                  {orderCompleteOrder.shippingDetails?.estimatedDelivery || 'Within 3-5 days'}
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

        {/* Server Quote Warning / Edge Case Alerts */}
        {quoteError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <div>
              <p className="font-bold">Server Pricing Notice</p>
              <p>{quoteError}</p>
            </div>
          </div>
        )}

        {hasOutOfStock && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold">Inventory Notice</p>
              <p>
                One or more items in your bag exceed available stock:
                {outOfStockItems.map((o) => ` ${o.productName} (Available: ${o.availableStock})`).join(', ')}.
                Please update your bag to proceed.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Multi-Step Checkout Form */}
          <div className="lg:col-span-7 space-y-8">
            <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-8">
              {/* Step 1: Shipping Address with Zod Validation */}
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
                    <label htmlFor="checkout-fullName" className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.fullName} *
                    </label>
                    <input
                      id="checkout-fullName"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        handleValidateField('fullName', e.target.value);
                      }}
                      className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 ${
                        formErrors.fullName
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                          : 'border-stone-300 focus:ring-amber-800'
                      }`}
                    />
                    {formErrors.fullName && (
                      <p className="text-rose-600 text-[11px] mt-1">{formErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-phone" className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.phone} (10-digit Mobile) *
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhone(val);
                        handleValidateField('phone', val);
                      }}
                      placeholder="9876543210"
                      className={`w-full p-2.5 border rounded-lg font-mono focus:outline-none focus:ring-1 ${
                        formErrors.phone
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                          : 'border-stone-300 focus:ring-amber-800'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-rose-600 text-[11px] mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-email" className="block font-semibold text-stone-700 mb-1">
                      Email Address (for order receipts &amp; courier tracking) *
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        handleValidateField('email', e.target.value);
                      }}
                      placeholder="customer@example.com"
                      className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 ${
                        formErrors.email
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                          : 'border-stone-300 focus:ring-amber-800'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-rose-600 text-[11px] mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-street" className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.street} *
                    </label>
                    <input
                      id="checkout-street"
                      type="text"
                      autoComplete="street-address"
                      value={street}
                      onChange={(e) => {
                        setStreet(e.target.value);
                        handleValidateField('street', e.target.value);
                      }}
                      placeholder="Door No., Building, Street Name, Area"
                      className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 ${
                        formErrors.street
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                          : 'border-stone-300 focus:ring-amber-800'
                      }`}
                    />
                    {formErrors.street && (
                      <p className="text-rose-600 text-[11px] mt-1">{formErrors.street}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-landmark" className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.landmark} (Optional)
                    </label>
                    <input
                      id="checkout-landmark"
                      type="text"
                      autoComplete="off"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near Temple / Metro station"
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-city" className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.city} *
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      autoComplete="address-level2"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        handleValidateField('city', e.target.value);
                      }}
                      className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 ${
                        formErrors.city
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                          : 'border-stone-300 focus:ring-amber-800'
                      }`}
                    />
                    {formErrors.city && (
                      <p className="text-rose-600 text-[11px] mt-1">{formErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-state" className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.state} *
                    </label>
                    <input
                      id="checkout-state"
                      type="text"
                      autoComplete="address-level1"
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        handleValidateField('state', e.target.value);
                      }}
                      className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 ${
                        formErrors.state
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                          : 'border-stone-300 focus:ring-amber-800'
                      }`}
                    />
                    {formErrors.state && (
                      <p className="text-rose-600 text-[11px] mt-1">{formErrors.state}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-pincode" className="block font-semibold text-stone-700 mb-1">
                      {t.checkout.pincode} (6-digit PIN) *
                    </label>
                    <input
                      id="checkout-pincode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setPincode(val);
                        handleValidateField('pincode', val);
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
                      className={`w-full p-2.5 border rounded-lg font-mono focus:outline-none focus:ring-1 ${
                        formErrors.pincode
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                          : 'border-stone-300 focus:ring-amber-800'
                      }`}
                    />
                    {formErrors.pincode && (
                      <p className="text-rose-600 text-[11px] mt-1">{formErrors.pincode}</p>
                    )}
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
                      {isQuoting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
                      ) : baseShippingFee === 0 ? (
                        <span className="text-emerald-700 uppercase font-bold">FREE</span>
                      ) : (
                        `₹${baseShippingFee}`
                      )}
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
                    <span className="font-bold text-slate-900 tabular-nums">
                      ₹{Math.max(199, baseShippingFee + 99)}
                    </span>
                  </label>
                </div>
              </div>

              {/* Step 3: Payment Method Selection */}
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
                  {/* UPI Option */}
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
                            UPI / QR Code Payment (Recommended)
                          </span>
                          <span className="text-stone-500">Pay via GPay, PhonePe, Paytm or any UPI app after placing order</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Instant &amp; Zero Fee
                    </span>
                  </label>

                  {/* Bank Transfer Option */}
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
                            Direct Bank Transfer (NEFT / IMPS)
                          </span>
                          <span className="text-stone-500">Transfer directly to our current bank account</span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Cash on Delivery (only if enabled by store admin) */}
                  {paymentSettings?.codEnabled && (
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
                          <HandCoins className="w-4 h-4 text-amber-800" />
                          <div>
                            <span className="font-bold text-slate-900 block">
                              Cash on Delivery (COD)
                            </span>
                            <span className="text-stone-500">Pay cash upon parcel delivery</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  )}
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-600 text-xs">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                    <span>How payment works:</span>
                  </p>
                  <p className="text-[11px] mt-1 leading-relaxed">
                    Placing your order secures your handloom pieces. You will immediately be taken to our secure payment gateway page with dynamic QR code, bank details, and reference submission.
                  </p>
                </div>
              </div>

              {/* Submit Button for Mobile View */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={isProcessing || isQuoting || !!quoteError || hasOutOfStock}
                  className="w-full py-4 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Placing Order on Server...</span>
                    </>
                  ) : isQuoting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Calculating Total...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        {paymentMethod === 'COD' ? 'Confirm COD Order' : 'Place Order & Pay'} (₹{finalPayable.toLocaleString()})
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Server-Calculated Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6 sticky top-24">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-serif text-base font-bold text-slate-900">
                  {t.checkout.orderSummary} ({cart.length} items)
                </h3>
                {isQuoting && (
                  <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Verifying</span>
                  </span>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const quoteItem = quote?.items?.find((q) => q.productId === item.productId);
                  const isItemOutOfStock = quoteItem && !quoteItem.inStock;

                  return (
                    <div
                      key={`${item.productId}-${item.variantId}`}
                      className={`flex gap-3 text-xs p-2 rounded-lg ${
                        isItemOutOfStock ? 'bg-rose-50 border border-rose-200' : ''
                      }`}
                    >
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
                          {isItemOutOfStock && (
                            <span className="block text-[10px] text-rose-700 font-bold">
                              Out of Stock (Only {quoteItem?.availableStock} left)
                            </span>
                          )}
                        </div>
                        <span className="font-serif font-bold text-slate-900 tabular-nums">
                          ₹{((quoteItem?.unitPrice || item.product.finalPrice || item.product.basePrice) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Details - Rendered exclusively from server quote */}
              <div className="space-y-2 text-xs border-t border-stone-100 pt-4 text-stone-600">
                <div className="flex justify-between">
                  <span>Server-Calculated Subtotal</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {isQuoting ? '...' : `₹${serverSubtotal.toLocaleString()}`}
                  </span>
                </div>

                {serverDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon ({appliedCoupon?.code || quote?.coupon?.code})</span>
                    <span className="tabular-nums">-₹{serverDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {isQuoting ? (
                      '...'
                    ) : finalShippingFee === 0 ? (
                      <span className="text-emerald-700 uppercase font-bold">FREE</span>
                    ) : (
                      `₹${finalShippingFee}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between pt-3 border-t border-stone-200 text-base font-bold text-slate-950 font-serif">
                  <span>Grand Total</span>
                  <span className="tabular-nums">
                    {isQuoting ? '...' : `₹${finalPayable.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* Desktop Place Order Button */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing || isQuoting || !!quoteError || hasOutOfStock}
                className="hidden lg:flex w-full py-4 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Placing Order on Server...</span>
                  </>
                ) : isQuoting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Calculating Total...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>
                      {paymentMethod === 'COD' ? 'Confirm COD Order' : 'Place Order & Pay'} (₹{finalPayable.toLocaleString()})
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                <span>Direct Master Weaver Guaranteed Fulfillment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ShieldCheck, QrCode, Building, Lock, AlertCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { StorageService } from '../services/storage';
import { uploadToCloudinary } from '../services/cloudinaryService';
import type { Address } from '../types';

export const CheckoutPage: React.FC = () => {
  const {
    language,
    t,
    cart,
    clearCart,
    cartTotal,
    discountAmount,
    shippingFee,
    grandTotal,
    settings
  } = useShop();

  const navigate = useNavigate();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'UPI_QR' | 'BANK_TRANSFER'>('UPI_QR');
  const [utrNumber, setUtrNumber] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#4A0E17]">{t('cartEmpty')}</h2>
        <button
          onClick={() => navigate('/catalog')}
          className="px-6 py-2.5 bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold rounded-full"
        >
          {t('startShopping')}
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !phone || !street || !city || !pincode) {
      setErrorMessage('Please fill in all required shipping address fields.');
      return;
    }

    if (!utrNumber || utrNumber.trim().length < 6) {
      setErrorMessage('Please enter a valid 12-Digit UTR or payment reference number.');
      return;
    }

    setIsSubmitting(true);
    let proofUrl = '';

    if (proofFile) {
      setUploading(true);
      try {
        proofUrl = await uploadToCloudinary(proofFile);
      } catch (err) {
        console.warn('Proof upload notice:', err);
      } finally {
        setUploading(false);
      }
    }

    const shippingAddress: Address = {
      fullName,
      phone,
      street,
      city,
      state,
      pincode
    };

    const orderNumber = `NIRAI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderItems = cart.map(item => ({
      product_id: item.product.id,
      product_name: item.product.name_en,
      name_ta: item.product.name_ta,
      price: item.product.discount_price || item.product.price,
      quantity: item.quantity,
      selected_variant: item.selected_variant,
      image: item.product.images[0] || ''
    }));

    try {
      const createdOrder = await StorageService.createOrder({
        order_number: orderNumber,
        customer_name: fullName,
        phone,
        email,
        shipping_address: shippingAddress,
        items: orderItems,
        subtotal: cartTotal,
        discount: discountAmount,
        shipping_fee: shippingFee,
        total_amount: grandTotal,
        status: 'PENDING',
        payment_status: 'VERIFYING',
        payment_method: paymentMethod,
        utr_number: utrNumber.trim(),
        utr_proof_url: proofUrl,
        notes: 'Direct 0% UPI scan payment order'
      });

      // Confetti celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      clearCart();
      navigate(`/order-confirmation/${createdOrder.id}`);
    } catch (err) {
      setErrorMessage('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Checkout Title */}
      <div className="border-b border-[#E2D9C8] pb-4">
        <h1 className="font-serif-luxury text-2xl sm:text-4xl font-extrabold text-[#2D1619]">
          Direct Weaver Checkout
        </h1>
        <p className="text-xs text-[#6B5B5E] mt-1">
          0% Gateway Surcharge • Instant Direct UPI QR Payment
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Address & Payment Inputs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Step 1: Shipping Address Form */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
            <h2 className="font-serif-luxury text-lg font-bold text-[#2D1619] flex items-center gap-2 border-b border-[#F2ECDF] pb-3">
              <span className="w-6 h-6 rounded-full bg-[#2D1619] text-[#F4E8C1] text-xs flex items-center justify-center font-bold">1</span>
              <span>{t('shippingAddress')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#2D1619] block mb-1">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Senthil Kumar"
                  className="w-full text-xs p-3 border border-[#D4AF37]/50 rounded-xl focus:outline-none focus:border-[#4A0E17]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D1619] block mb-1">
                  {t('phone')} *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-Digit Mobile Number"
                  className="w-full text-xs p-3 border border-[#D4AF37]/50 rounded-xl focus:outline-none focus:border-[#4A0E17]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#2D1619] block mb-1">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="For order receipt dispatch"
                  className="w-full text-xs p-3 border border-[#D4AF37]/50 rounded-xl focus:outline-none focus:border-[#4A0E17]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#2D1619] block mb-1">
                  {t('streetAddress')} *
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Door No, Street Name, Landmark"
                  className="w-full text-xs p-3 border border-[#D4AF37]/50 rounded-xl focus:outline-none focus:border-[#4A0E17]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D1619] block mb-1">
                  {t('city')} *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Salem / Chennai"
                  className="w-full text-xs p-3 border border-[#D4AF37]/50 rounded-xl focus:outline-none focus:border-[#4A0E17]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D1619] block mb-1">
                  {t('pincode')} *
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="6-Digit PIN Code"
                  className="w-full text-xs p-3 border border-[#D4AF37]/50 rounded-xl focus:outline-none focus:border-[#4A0E17]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Step 2: Payment Option & Instant UPI QR Scanner */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-6">
            <h2 className="font-serif-luxury text-lg font-bold text-[#2D1619] flex items-center gap-2 border-b border-[#F2ECDF] pb-3">
              <span className="w-6 h-6 rounded-full bg-[#2D1619] text-[#F4E8C1] text-xs flex items-center justify-center font-bold">2</span>
              <span>{t('paymentMethod')} (0% Gateway Surcharge)</span>
            </h2>

            {/* Payment Method Radio Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI_QR')}
                className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition ${
                  paymentMethod === 'UPI_QR'
                    ? 'border-[#4A0E17] bg-[#F4E8C1]/30 font-bold'
                    : 'border-[#E2D9C8] bg-white'
                }`}
              >
                <QrCode className="w-6 h-6 text-[#D4AF37] shrink-0 mt-1" />
                <div>
                  <h4 className="text-xs font-bold text-[#2D1619]">{t('upiQrCode')}</h4>
                  <p className="text-[11px] text-[#6B5B5E] mt-0.5">GPay, PhonePe, Paytm, BHIM</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-[#4A0E17] bg-[#F4E8C1]/30 font-bold'
                    : 'border-[#E2D9C8] bg-white'
                }`}
              >
                <Building className="w-6 h-6 text-[#D4AF37] shrink-0 mt-1" />
                <div>
                  <h4 className="text-xs font-bold text-[#2D1619]">{t('bankTransfer')}</h4>
                  <p className="text-[11px] text-[#6B5B5E] mt-0.5">NEFT / RTGS / IMPS Direct</p>
                </div>
              </button>
            </div>

            {/* UPI QR Scanner Details Box */}
            {paymentMethod === 'UPI_QR' ? (
              <div className="p-6 bg-[#2D1619] text-[#F4E8C1] rounded-2xl space-y-6 text-center border border-[#D4AF37]/40 shadow-inner">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                    Scan QR & Pay Exact Amount
                  </span>
                  <h3 className="font-serif-luxury text-2xl font-extrabold text-[#F4E8C1]">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </h3>
                </div>

                {/* QR Code Container */}
                <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border-4 border-[#D4AF37]">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(settings.upi_id)}%26pn=${encodeURIComponent(settings.upi_name)}%26am=${grandTotal}%26cu=INR`}
                    alt="NIRAI UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1 text-xs text-[#ECE6D9]">
                  <p>UPI ID: <strong className="text-[#D4AF37] font-mono">{settings.upi_id}</strong></p>
                  <p>Account Name: <strong>{settings.upi_name}</strong></p>
                </div>
              </div>
            ) : (
              /* Bank Transfer Details Box */
              <div className="p-6 bg-[#2D1619] text-[#F4E8C1] rounded-2xl space-y-3 text-xs border border-[#D4AF37]/40">
                <h4 className="font-serif-luxury text-sm font-bold text-[#D4AF37] border-b border-[#D4AF37]/30 pb-2">
                  Direct Weaver Bank Account Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-[#A09295]">Bank Name:</span>
                  <span className="font-bold">{settings.bank_details?.bankName || 'State Bank of India'}</span>
                  <span className="text-[#A09295]">Account Name:</span>
                  <span className="font-bold">{settings.bank_details?.accountName || 'NIRAI HANDLOOM SILKS'}</span>
                  <span className="text-[#A09295]">Account No:</span>
                  <span className="font-mono font-bold text-[#D4AF37]">{settings.bank_details?.accountNumber || '40982310492'}</span>
                  <span className="text-[#A09295]">IFSC Code:</span>
                  <span className="font-mono font-bold">{settings.bank_details?.ifscCode || 'SBIN0001824'}</span>
                </div>
              </div>
            )}

            {/* UTR Input & Cloudinary Upload */}
            <div className="p-5 bg-[#FBF9F5] rounded-xl border border-[#E2D9C8] space-y-4">
              <div>
                <label className="text-xs font-bold text-[#2D1619] block mb-1">
                  {t('enterUtr')} *
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 429104810294"
                  className="w-full text-xs p-3 border border-[#D4AF37]/60 rounded-xl focus:outline-none focus:border-[#4A0E17] font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D1619] block mb-1">
                  {t('uploadProof')} (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="text-xs text-[#6B5B5E] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#2D1619] file:text-[#F4E8C1] hover:file:bg-[#4A0E17]"
                  />
                  {proofFile && (
                    <span className="text-xs font-bold text-[#0B6623]">
                      ✓ {proofFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4 sticky top-28">
            <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-3">
              Order Summary ({cart.length} Sarees)
            </h3>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item, idx) => {
                const name = language === 'ta' && item.product.name_ta ? item.product.name_ta : item.product.name_en;
                const price = item.product.discount_price || item.product.price;
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <img
                      src={item.product.images[0]}
                      alt={name}
                      className="w-12 h-14 object-cover rounded-md shrink-0 border border-[#ECE6D9]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#2D1619] truncate">{name}</p>
                      <p className="text-[#8A7B7E]">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-[#4A0E17]">
                      ₹{(price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price Calculations */}
            <div className="pt-4 border-t border-[#F2ECDF] space-y-2 text-xs text-[#4A0E17]">
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="w-full py-4 bg-gradient-to-r from-[#4A0E17] via-[#2D1619] to-[#4A0E17] text-[#F4E8C1] font-extrabold text-sm rounded-xl hover:shadow-2xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <span>Verifying & Submitting...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t('placeOrder')}</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-center text-[#8A7B7E] flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0B6623]" />
              <span>SSL Encrypted Direct Weaver Transaction</span>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
};

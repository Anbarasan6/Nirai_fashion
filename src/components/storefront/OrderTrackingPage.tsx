import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { trackOrderViaRpc } from '../../services/supabase';
import { OrderStatus, TrackingResult } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  Search,
  Package,
  Clock,
  Truck,
  AlertCircle,
  ExternalLink,
  Check,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface StepDef {
  key: OrderStatus;
  labelEn: string;
  labelTa: string;
}

const STEPS: StepDef[] = [
  { key: 'Pending', labelEn: 'Order Received', labelTa: 'ஆர்டர் பெறப்பட்டது' },
  { key: 'Confirmed', labelEn: 'Order Confirmed', labelTa: 'ஆர்டர் உறுதி செய்யப்பட்டது' },
  { key: 'Processing', labelEn: 'Tailoring & Packing', labelTa: 'தையல் & பேக்கிங்' },
  { key: 'Shipped', labelEn: 'Handed to Courier', labelTa: 'கூரியரிடம் ஒப்படைக்கப்பட்டது' },
  { key: 'Delivered', labelEn: 'Safely Delivered', labelTa: 'பாதுகாப்பாக டெலிவரி செய்யப்பட்டது' },
];

export const OrderTrackingPage: React.FC = () => {
  const { language, trackingOrderId, setTrackingOrderId, currentUser } = useShop();

  const [orderNumberInput, setOrderNumberInput] = useState(trackingOrderId || '');
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (trackingOrderId) {
      setOrderNumberInput(trackingOrderId);
    }
  }, [trackingOrderId]);

  // Execute server RPC tracking
  const performTrack = async (orderNum: string, phone: string) => {
    const cleanOrderNum = orderNum.trim().toUpperCase();
    const cleanPhone = phone.trim().replace(/\D/g, '');

    if (!cleanOrderNum) {
      setErrorMessage('Please enter your Nirai Order Number (e.g. NIRAI-2026-01002)');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter the 10-digit mobile number used when placing the order.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const res = await trackOrderViaRpc(cleanOrderNum, cleanPhone);
      setIsLoading(false);
      if (res.success && res.data) {
        setTrackingResult(res.data);
        setErrorMessage(null);
        if (cleanOrderNum !== trackingOrderId) {
          setTrackingOrderId(cleanOrderNum);
        }
      } else {
        setTrackingResult(null);
        setErrorMessage(res.error || 'No matching order found for this order number and phone.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setTrackingResult(null);
      setErrorMessage(err.message || 'Tracking service temporarily unavailable. Please try again.');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performTrack(orderNumberInput, phoneInput);
  };

  // Determine active step index (0 to 4)
  const getActiveStepIdx = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Confirmed':
        return 1;
      case 'Processing':
        return 2;
      case 'Shipped':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return 0;
    }
  };

  const currentStatusIdx = trackingResult ? getActiveStepIdx(trackingResult.status) : 0;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-900 mb-3 shadow-2xs">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 uppercase tracking-wide">
            Track Your Nirai Shipment
          </h1>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            Enter your Nirai Order ID and the phone number provided at checkout to track real-time fulfillment and courier dispatch.
          </p>
        </div>

        {/* Secure Tracking Input Form (Requires both Order Number AND Phone for privacy protection) */}
        <div className="max-w-xl mx-auto mb-10 bg-white p-5 rounded-2xl border border-[#D5CEBF] shadow-2xs">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Order Number *
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderNumberInput}
                    onChange={(e) => setOrderNumberInput(e.target.value)}
                    placeholder="NIRAI-2026-01002"
                    className="w-full text-xs py-2.5 pl-9 pr-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-900 font-mono font-medium uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Recipient Phone (10 Digits) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full text-xs py-2.5 px-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-900 font-mono font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Verifying Shipment Records...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Live Order Status</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error / Rate Limit Notice */}
        {errorMessage && (
          <div className="max-w-xl mx-auto mb-8 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Tracking Notice</p>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Tracking Details Display */}
        {trackingResult ? (
          <div className="bg-white rounded-2xl border border-[#E5DFD3] shadow-xs overflow-hidden animate-in fade-in duration-150">
            {/* Header: Verified Record & Status */}
            <div className="p-6 bg-[#FAF8F5] border-b border-[#E5DFD3] flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-800 font-bold block mb-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Order Record</span>
                </span>
                <h3 className="font-serif text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {trackingResult.order_number}
                </h3>
                <span className="text-xs text-stone-500 block mt-1">
                  Placed on: {formatDate(trackingResult.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-3.5 py-1 rounded-md text-xs font-bold tracking-wide ${
                    trackingResult.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : trackingResult.status === 'Cancelled'
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-amber-100/90 text-amber-900 border border-amber-300/80'
                  }`}
                >
                  {STEPS[currentStatusIdx]?.labelEn || trackingResult.status}
                </span>
                <span className="font-serif text-xl font-bold text-slate-900 tabular-nums">
                  ₹{trackingResult.grand_total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Status State Banner */}
            {trackingResult.payment_status === 'Awaiting Payment' && trackingResult.status !== 'Cancelled' && (
              <div className="p-4 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <Clock className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>
                    <strong>Payment Awaiting:</strong> Please complete your UPI or Bank Transfer to confirm this order.
                  </span>
                </div>
                <Link
                  to={`/pay/${trackingResult.order_number}`}
                  className="px-4 py-1.5 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold rounded-lg shrink-0 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Pay Now &amp; Submit Proof</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {trackingResult.payment_status === 'Verification Pending' && (
              <div className="p-4 bg-blue-50 border-b border-blue-200 flex items-center gap-2.5 text-xs text-blue-900">
                <Clock className="w-4 h-4 shrink-0 text-blue-700" />
                <span>
                  <strong>Payment Verification Pending:</strong> Your payment proof has been submitted. Our accounting team is manually verifying the transaction against bank statements (confirmed within 2–4 hours).
                </span>
              </div>
            )}

            {trackingResult.payment_status === 'Rejected' && trackingResult.status !== 'Cancelled' && (
              <div className="p-4 bg-rose-50 border-b border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-rose-900">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
                  <span>
                    <strong>Payment Rejected:</strong> Your last submission could not be verified against our bank statement.
                  </span>
                </div>
                <Link
                  to={`/pay/${trackingResult.order_number}`}
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg shrink-0 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Submit Proof Again</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {trackingResult.payment_status === 'Paid' && (
              <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-xs text-emerald-900">
                <Check className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>
                  <strong>Payment Confirmed:</strong> Handloom attire is now reserved and being prepared for fulfillment.
                </span>
              </div>
            )}

            {/* Stepper Timeline */}
            <div className="p-6 sm:p-8 border-b border-stone-100">
              {trackingResult.status === 'Cancelled' ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-800 font-medium">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>
                    This order has been cancelled. Any payment deducted will be refunded to your source UPI/bank account within 24–48 hours.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
                  {STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStatusIdx;
                    const isCurrent = idx === currentStatusIdx;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center space-y-2 relative">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted
                              ? 'bg-[#78350F] text-white ring-4 ring-amber-100 shadow-2xs'
                              : 'bg-stone-100 text-stone-400 border border-stone-200'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-xs ${
                            isCurrent
                              ? 'font-bold text-slate-900'
                              : isCompleted
                              ? 'font-medium text-stone-700'
                              : 'text-stone-400'
                          }`}
                        >
                          {language === 'ta' ? step.labelTa : step.labelEn}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stage Progress Alert / Info Box */}
            {trackingResult.status !== 'Shipped' &&
              trackingResult.status !== 'Delivered' &&
              trackingResult.status !== 'Cancelled' && (
                <div className="p-4 bg-amber-50/60 border-b border-amber-200/80 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-900 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-serif font-bold text-amber-950 uppercase tracking-wider block">
                      Fulfillment in Progress
                    </span>
                    <p className="text-stone-600 leading-relaxed text-[11px]">
                      Your apparel is undergoing handloom finishing and packaging. Courier partner details and AWB tracking link will appear below as soon as the package is dispatched.
                    </p>
                  </div>
                </div>
              )}

            {/* Courier & Dispatch Tracking Card (when Shipped or Delivered) */}
            {trackingResult.shipping_details &&
              (trackingResult.status === 'Shipped' || trackingResult.status === 'Delivered') && (
                <div className="p-6 bg-[#FAF8F5] border-b border-[#E5DFD3] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-stone-400 block mb-0.5 font-medium">Assigned Courier</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {trackingResult.shipping_details.courierName || 'Standard Express'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5 font-medium">AWB Tracking Number</span>
                    <span className="font-mono font-bold text-amber-900 text-sm">
                      {trackingResult.shipping_details.trackingId || 'Processing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5 font-medium">Live Tracking</span>
                    {trackingResult.shipping_details.trackingUrl ? (
                      <a
                        href={trackingResult.shipping_details.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-amber-900 hover:text-amber-950 font-bold underline underline-offset-2 pt-0.5"
                      >
                        <span>Track on Courier Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-stone-500">Updating shortly</span>
                    )}
                  </div>
                </div>
              )}

            {/* Ordered Items Summary */}
            <div className="p-6 sm:p-8 space-y-4">
              <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
                Order Items ({trackingResult.items?.length || trackingResult.item_count || 1})
              </h4>
              <div className="space-y-3">
                {(trackingResult.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5">
                      {item.productImage && (
                        <div className="w-14 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          <ImageWithFallback
                            src={item.productImage}
                            alt={item.productName}
                            fallbackText={item.productName}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      )}
                      <div>
                        <h5 className="font-serif text-xs font-bold text-slate-900 uppercase tracking-wide">
                          {item.productName}
                        </h5>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-serif text-sm font-bold text-slate-900 tabular-nums">
                      ₹{item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Summary */}
            <div className="p-6 bg-[#FAF8F5] border-t border-[#E5DFD3] text-xs text-stone-600 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Payment Method:</span>
                <span className="font-medium text-slate-800">{trackingResult.payment_method}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-xs">Payment Status:</span>
                <span
                  className={`font-semibold ${
                    trackingResult.payment_status === 'Paid'
                      ? 'text-emerald-700'
                      : 'text-amber-800'
                  }`}
                >
                  {trackingResult.payment_status}
                </span>
              </div>
            </div>
          </div>
        ) : hasSearched && !isLoading ? (
          <div className="bg-white p-12 rounded-2xl border border-[#E5DFD3] text-center space-y-3">
            <Package className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif text-base font-bold text-slate-800">
              No order found matching your inquiry
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Please double check the order number and 10-digit mobile number from your receipt.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

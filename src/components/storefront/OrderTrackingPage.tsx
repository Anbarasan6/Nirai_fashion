import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { OrderStatus } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
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
  const { language, t, trackingOrderId, setTrackingOrderId } = useShop();
  const [searchInput, setSearchInput] = useState(trackingOrderId || 'NIRAI-2026-2052');

  useEffect(() => {
    if (trackingOrderId) {
      setSearchInput(trackingOrderId);
    }
  }, [trackingOrderId]);

  const orders = StorageService.getOrders();
  const currentOrder = orders.find((o) => {
    const q = searchInput.trim().toUpperCase();
    return (
      o.orderNumber.toUpperCase() === q ||
      o.id.toUpperCase() === q ||
      (o.utrNumber && o.utrNumber.toUpperCase() === q)
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTrackingOrderId(searchInput.trim());
    }
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

  const currentStatusIdx = currentOrder ? getActiveStepIdx(currentOrder.status) : 0;

  // Format date cleanly e.g. 2/10/2026
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
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
            Enter your Nirai Order ID below to view live packaging, dispatch, and courier tracking details.
          </p>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. NIRAI-2026-2052"
              className="w-full text-xs py-3 pl-10 pr-4 bg-white border border-[#D5CEBF] rounded-xl focus:outline-none focus:border-amber-900 font-mono font-medium shadow-2xs uppercase tracking-wider"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
          >
            Track Order
          </button>
        </form>

        {/* Order Details Display Card */}
        {currentOrder ? (
          <div className="bg-white rounded-2xl border border-[#E5DFD3] shadow-xs overflow-hidden animate-in fade-in duration-150">
            {/* Header: Official Shipment Record & Status */}
            <div className="p-6 bg-[#FAF8F5] border-b border-[#E5DFD3] flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-900 font-bold block mb-0.5">
                  Official Shipment Record
                </span>
                <h3 className="font-serif text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {currentOrder.orderNumber}
                </h3>
                <span className="text-xs text-stone-500 block mt-1">
                  Placed on: {formatDate(currentOrder.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="bg-amber-100/90 text-amber-900 border border-amber-300/80 px-3.5 py-1 rounded-md text-xs font-bold tracking-wide">
                  {STEPS[currentStatusIdx]?.labelEn || currentOrder.status}
                </span>
                <span className="font-serif text-xl font-bold text-slate-900 tabular-nums">
                  ₹{currentOrder.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="p-6 sm:p-8 border-b border-stone-100">
              {currentOrder.status === 'Cancelled' ? (
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
            {currentOrder.status !== 'Shipped' && currentOrder.status !== 'Delivered' && currentOrder.status !== 'Cancelled' && (
              <div className="p-4 bg-amber-50/60 border-b border-amber-200/80 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-900 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-serif font-bold text-amber-950 uppercase tracking-wider block">
                    Tailoring &amp; Packaging Stage in Progress
                  </span>
                  <p className="text-stone-600 leading-relaxed text-[11px]">
                    Your order is currently being quality checked, custom handloom finished, and packaged.{' '}
                    <strong className="text-slate-800">
                      Courier Partner name, AWB Tracking Number, and Live Tracking Link
                    </strong>{' '}
                    will be displayed here as soon as our admin hands over the shipment to the courier.
                  </p>
                </div>
              </div>
            )}

            {/* Courier & Dispatch Tracking Card (when Shipped or Delivered) */}
            {currentOrder.shippingDetails && (currentOrder.status === 'Shipped' || currentOrder.status === 'Delivered') && (
              <div className="p-6 bg-[#FAF8F5] border-b border-[#E5DFD3] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 block mb-0.5 font-medium">Assigned Courier</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {currentOrder.shippingDetails.courierName}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5 font-medium">AWB Tracking Number</span>
                  <span className="font-mono font-bold text-amber-900 text-sm">
                    {currentOrder.shippingDetails.trackingId}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5 font-medium">Live Portal Tracking</span>
                  <a
                    href={currentOrder.shippingDetails.trackingUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-amber-900 hover:text-amber-950 font-bold underline underline-offset-2 pt-0.5"
                  >
                    <span>Track on Courier Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Ordered Creations (Items List) */}
            <div className="p-6 sm:p-8 space-y-4">
              <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
                Ordered Creations ({currentOrder.items.length})
              </h4>
              <div className="space-y-3">
                {currentOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs hover:border-amber-700/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        <ImageWithFallback
                          src={item.productImage}
                          alt={item.productName}
                          fallbackText={item.productName}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div>
                        <h5 className="font-serif text-xs font-bold text-slate-900 uppercase tracking-wide">
                          {item.productName}
                        </h5>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Qty: {item.quantity} · {item.size || item.variantName || 'Free Size (6.3m)'}
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

            {/* Footer: Delivering To & Payment Summary */}
            <div className="p-6 bg-[#FAF8F5] border-t border-[#E5DFD3] text-xs text-stone-600 flex flex-col sm:flex-row justify-between gap-6">
              <div className="space-y-1 max-w-md">
                <span className="font-bold text-slate-900 block text-xs">Delivering to:</span>
                <p className="font-medium text-slate-800">
                  {currentOrder.shippingAddress.fullName} ({currentOrder.shippingAddress.phone})
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed uppercase">
                  {currentOrder.shippingAddress.street}, {currentOrder.shippingAddress.city},{' '}
                  {currentOrder.shippingAddress.state}, India, {currentOrder.shippingAddress.state} -{' '}
                  <span className="font-mono font-bold text-slate-800">
                    {currentOrder.shippingAddress.pincode}
                  </span>
                </p>
              </div>

              <div className="sm:text-right space-y-1 shrink-0">
                <span className="font-bold text-slate-900 block text-xs">Payment:</span>
                <p className="font-medium text-slate-800">
                  {currentOrder.paymentMethod === 'ONLINE_UPI'
                    ? 'ONLINE_UPI'
                    : currentOrder.paymentMethod === 'BANK_TRANSFER'
                    ? 'BANK_TRANSFER'
                    : currentOrder.paymentMethod}
                  {' · '}
                  <span
                    className={`font-semibold ${
                      currentOrder.paymentStatus === 'Paid'
                        ? 'text-emerald-700'
                        : 'text-amber-800'
                    }`}
                  >
                    {currentOrder.paymentStatus}
                  </span>
                </p>
                {currentOrder.utrNumber && (
                  <p className="text-[10px] text-stone-500 font-mono">
                    UTR: {currentOrder.utrNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-[#E5DFD3] text-center space-y-3">
            <Package className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif text-base font-bold text-slate-800">
              No order found matching &ldquo;{searchInput}&rdquo;
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Please double check the order number on your confirmation receipt. Example order numbers: NIRAI-2026-2052, NIRAI-2026-9042.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

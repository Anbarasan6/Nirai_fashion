import React, { useState } from 'react';
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
  Home,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const ORDER_STEPS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
];

export const OrderTrackingPage: React.FC = () => {
  const { language, t, trackingOrderId, setTrackingOrderId } = useShop();
  const [searchInput, setSearchInput] = useState(trackingOrderId || 'NIRAI-2026-9042');

  const orders = StorageService.getOrders();
  const currentOrder = orders.find(
    (o) =>
      o.orderNumber.toUpperCase() === searchInput.trim().toUpperCase() ||
      o.id === searchInput.trim()
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTrackingOrderId(searchInput.trim());
    }
  };

  const currentStatusIdx = currentOrder
    ? ORDER_STEPS.indexOf(currentOrder.status)
    : -1;

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-900 mb-2">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            {t.orders.trackTitle}
          </h1>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Enter your Nirai Order ID below to view live packaging, dispatch, and courier tracking details.
          </p>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-10 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. NIRAI-2026-9042"
              className="w-full text-xs p-3 pl-9 bg-white border border-[#D5CEBF] rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-900 font-mono font-medium shadow-2xs"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            {t.orders.trackBtn}
          </button>
        </form>

        {/* Order Details Display */}
        {currentOrder ? (
          <div className="bg-white rounded-2xl border border-[#E5DFD3] shadow-xs overflow-hidden">
            {/* Order Header Summary */}
            <div className="p-6 bg-[#FAF7F0] border-b border-[#E5DFD3] flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-900 font-bold block">
                  Official Shipment Record
                </span>
                <h3 className="font-serif text-xl font-bold text-slate-900 font-mono">
                  {currentOrder.orderNumber}
                </h3>
                <span className="text-xs text-stone-500">
                  {t.orders.orderDate}: {new Date(currentOrder.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-md ${
                    currentOrder.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentOrder.status === 'Cancelled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {(t.orders.steps as Record<string, string>)[currentOrder.status] || currentOrder.status}
                </span>
                <span className="font-serif text-base font-bold text-slate-900 tabular-nums">
                  ₹{currentOrder.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Visual Step Timeline */}
            <div className="p-6 sm:p-8 border-b border-stone-100">
              {currentOrder.status === 'Cancelled' ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-800 font-medium">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>This order has been cancelled. Any payment deducted will be refunded to your original payment method.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
                  {ORDER_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStatusIdx;
                    const isCurrent = idx === currentStatusIdx;

                    return (
                      <div key={step} className="flex flex-col items-center text-center space-y-2">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted
                              ? 'bg-amber-900 text-white ring-4 ring-amber-100'
                              : 'bg-stone-100 text-stone-400 border border-stone-200'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <span
                          className={`text-xs ${
                            isCurrent
                              ? 'font-bold text-amber-950'
                              : isCompleted
                              ? 'font-semibold text-slate-800'
                              : 'text-stone-400'
                          }`}
                        >
                          {(t.orders.steps as Record<string, string>)[step] || step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Courier & Shipping Information */}
            {currentOrder.shippingDetails && (
              <div className="p-6 bg-[#FAF9F5] border-b border-[#E5DFD3] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 block mb-0.5">{t.orders.courier}</span>
                  <span className="font-bold text-slate-900">
                    {currentOrder.shippingDetails.courierName}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">{t.orders.trackingNumber}</span>
                  <span className="font-mono font-bold text-amber-900">
                    {currentOrder.shippingDetails.trackingId}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">Live Tracking Portal</span>
                  <a
                    href={currentOrder.shippingDetails.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-amber-900 hover:text-amber-950 font-semibold underline underline-offset-2"
                  >
                    <span>{t.orders.trackOnline}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Items in this Order */}
            <div className="p-6 space-y-4">
              <h4 className="font-serif text-sm font-bold text-slate-900">
                Ordered Creations ({currentOrder.items.length})
              </h4>
              <div className="space-y-3">
                {currentOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 rounded-md overflow-hidden bg-stone-100 shrink-0">
                        <ImageWithFallback
                          src={item.productImage}
                          alt={item.productName}
                          fallbackText={item.productName}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div>
                        <h5 className="font-serif text-xs font-bold text-slate-900">
                          {item.productName}
                        </h5>
                        <p className="text-[11px] text-stone-500">
                          Qty: {item.quantity} · {item.size || item.variantName || 'Standard'}
                        </p>
                      </div>
                    </div>
                    <span className="font-serif text-xs font-bold text-slate-900 tabular-nums">
                      ₹{item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address Footer */}
            <div className="p-6 bg-stone-50 border-t border-stone-200 text-xs text-stone-600 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Delivering to:</span>
                <p>{currentOrder.shippingAddress.fullName} ({currentOrder.shippingAddress.phone})</p>
                <p>{currentOrder.shippingAddress.street}, {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} - {currentOrder.shippingAddress.pincode}</p>
              </div>
              <div className="text-right sm:text-right">
                <span className="font-bold text-slate-900 block mb-1">Payment:</span>
                <p className="capitalize">{currentOrder.paymentMethod} · {currentOrder.paymentStatus}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-[#E5DFD3] text-center space-y-3">
            <Package className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif text-base font-bold text-slate-800">
              No order found matching "{searchInput}"
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Please double check the order number on your confirmation receipt. Example order numbers: NIRAI-2026-9042, NIRAI-2026-9043.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

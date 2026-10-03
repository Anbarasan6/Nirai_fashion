import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, Clock, CheckCircle2, Truck, AlertCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { StorageService } from '../services/storage';
import type { Order } from '../types';

export const OrderTrackingPage: React.FC = () => {
  const { t } = useShop();
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [searchQuery, setSearchQuery] = useState(initialId);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  const handleSearch = (queryStr: string) => {
    const q = queryStr.trim();
    if (!q) return;
    setSearched(true);
    const result = StorageService.getOrderById(q);
    setFoundOrder(result || null);
  };

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const getStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'PAID': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      default: return 1;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="font-serif-luxury text-2xl sm:text-4xl font-extrabold text-[#2D1619]">
          {t('trackOrder')}
        </h1>
        <p className="text-xs text-[#6B5B5E]">
          Enter your Order Number (e.g. NIRAI-2026-1001) or Registered Phone Number
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={onSubmitSearch} className="flex gap-2 max-w-lg mx-auto">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('enterTrackingId')}
          className="flex-1 text-xs sm:text-sm p-3 border border-[#D4AF37]/50 rounded-xl bg-white shadow-sm focus:outline-none focus:border-[#4A0E17]"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-[#2D1619] text-[#F4E8C1] text-xs font-bold rounded-xl hover:bg-[#4A0E17] transition flex items-center gap-1.5 shadow-md"
        >
          <Search className="w-4 h-4 text-[#D4AF37]" />
          <span>Lookup</span>
        </button>
      </form>

      {/* Results Box */}
      {searched && !foundOrder && (
        <div className="p-6 bg-white rounded-2xl border border-red-200 text-center space-y-2 max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h4 className="text-sm font-bold text-[#2D1619]">No Order Found</h4>
          <p className="text-xs text-[#6B5B5E]">
            Please verify your Order Reference ID or Phone number and try again.
          </p>
        </div>
      )}

      {foundOrder && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2D9C8] shadow-lg space-y-8 animate-fadeIn">
          
          {/* Order Reference Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F2ECDF] pb-4">
            <div>
              <span className="text-[10px] font-bold text-[#8A7B7E] uppercase tracking-wider">Order Reference</span>
              <h3 className="font-serif-luxury text-xl font-extrabold text-[#2D1619]">
                {foundOrder.order_number}
              </h3>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#F4E8C1] text-[#4A0E17] text-xs font-bold rounded-full">
                Status: {foundOrder.status}
              </span>
              <p className="text-[11px] text-[#8A7B7E] mt-1">
                Placed on {new Date(foundOrder.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Visual Progress Stepper */}
          <div className="relative py-4">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#ECE6D9] -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-[#4A0E17] -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${((getStepIndex(foundOrder.status) - 1) / 3) * 100}%` }}
            />

            <div className="relative z-10 flex justify-between">
              {[
                { step: 1, label: t('orderStatusPending'), icon: Clock },
                { step: 2, label: t('orderStatusPaid'), icon: CheckCircle2 },
                { step: 3, label: t('orderStatusShipped'), icon: Truck },
                { step: 4, label: t('orderStatusDelivered'), icon: Package }
              ].map((s) => {
                const isPassed = getStepIndex(foundOrder.status) >= s.step;
                const IconComp = s.icon;
                return (
                  <div key={s.step} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                        isPassed ? 'bg-[#4A0E17] text-[#F4E8C1] shadow-lg' : 'bg-[#ECE6D9] text-[#8A7B7E]'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-bold max-w-[80px] ${isPassed ? 'text-[#2D1619]' : 'text-[#8A7B7E]'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F2ECDF] text-xs text-[#4A0E17]">
            <div className="space-y-1">
              <h4 className="font-bold text-[#2D1619] mb-1">Customer & Delivery Details</h4>
              <p>Name: <strong>{foundOrder.customer_name}</strong></p>
              <p>Phone: <strong>{foundOrder.phone}</strong></p>
              <p>Address: {foundOrder.shipping_address.street}, {foundOrder.shipping_address.city}, {foundOrder.shipping_address.pincode}</p>
            </div>

            <div className="space-y-1 text-right">
              <h4 className="font-bold text-[#2D1619] mb-1">Payment Verification</h4>
              <p>Payment Method: <strong>{foundOrder.payment_method}</strong></p>
              <p>UTR Ref No: <strong className="font-mono">{foundOrder.utr_number || 'N/A'}</strong></p>
              <p className="text-base font-extrabold text-[#2D1619] pt-2">
                Total Amount: ₹{foundOrder.total_amount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

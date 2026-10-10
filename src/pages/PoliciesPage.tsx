import React from 'react';
import { Shield, Truck, RefreshCw, FileText } from 'lucide-react';

interface PoliciesPageProps {
  section?: 'privacy' | 'shipping' | 'refund' | 'terms';
}

export const PoliciesPage: React.FC<PoliciesPageProps> = ({ section = 'privacy' }) => {
  return (
    <div className="bg-[#FAF9F5] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            Store Policies & Legal Terms
          </h1>
          <p className="text-xs text-stone-500">
            Transparent guidelines governing shipping, quality guarantee, direct UPI transactions, and data protection.
          </p>
        </div>

        {/* Policy Section Cards */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-8 text-xs text-stone-700 leading-relaxed">
          {/* Shipping Policy */}
          <div className="space-y-3 border-b border-stone-200 pb-6">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-base font-serif">
              <Truck className="w-5 h-5" />
              <h2>Shipping & Dispatch Policy</h2>
            </div>
            <p>
              All Nirai orders are dispatched via premier courier partners (BlueDart, Delhivery, Speed Post). Orders over ₹1,500 qualify for FREE standard shipping across India.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>Standard Shipping: Delivered within 3 to 5 business days.</li>
              <li>Express Priority Delivery: Delivered within 24 to 48 hours (₹199 flat fee).</li>
              <li>Handloom weaving/custom border orders may take up to 7 business days before shipment.</li>
            </ul>
          </div>

          {/* Direct Payment & UPI Refund Policy */}
          <div className="space-y-3 border-b border-stone-200 pb-6">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-base font-serif">
              <RefreshCw className="w-5 h-5" />
              <h2>Refunds & Return Policy</h2>
            </div>
            <p>
              We stand by the master quality of our silk and cotton weaves. If you receive a damaged or defectively woven item, you may request a replacement or refund within 7 days of delivery.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>Direct UPI Refunds are processed directly back to your source GPay/PhonePe account within 24-48 hours of item receipt.</li>
              <li>Items must be returned unworn, with original silk weaving tags intact.</li>
            </ul>
          </div>

          {/* Data Privacy Policy */}
          <div className="space-y-3 border-b border-stone-200 pb-6">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-base font-serif">
              <Shield className="w-5 h-5" />
              <h2>Privacy & Data Security</h2>
            </div>
            <p>
              Your personal shipping information, phone number, and UPI transaction reference numbers are strictly protected and never shared with third-party advertisers.
            </p>
          </div>

          {/* Terms of Service */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-base font-serif">
              <FileText className="w-5 h-5" />
              <h2>Terms of Service</h2>
            </div>
            <p>
              By placing an order on Nirai, you agree to our direct payment verification model. Orders are confirmed upon verification of your submitted 12-digit UTR reference ID against our bank statement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

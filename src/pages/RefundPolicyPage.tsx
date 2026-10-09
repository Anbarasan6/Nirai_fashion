import React from 'react';
import { useShop } from '../context/ShopContext';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { RefreshCw, ShieldCheck, CreditCard, Clock } from 'lucide-react';

export const RefundPolicyPage: React.FC = () => {
  const { language } = useShop();

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E1012]">
      <Breadcrumbs items={[{ label: language === 'ta' ? 'பணம் திரும்பப்பெறும் கொள்கை' : 'Refund Policy & Guarantee' }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4A0E17]/10 text-[#4A0E17] text-xs font-semibold uppercase tracking-wider mb-3">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'பாதுகாப்பான பரிவர்த்தனைகள்' : '100% Refund Protection'}</span>
          </div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-extrabold text-[#2D1619]">
            {language === 'ta' ? 'பணம் திரும்பப்பெறும் கொள்கை' : 'Refund & Payment Reversal Policy'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#5C4A4D] font-sans">
            {language === 'ta'
              ? 'NIRAI கைத்தறி பட்டு அங்காடிக் கொள்கைகள் மற்றும் திரும்பப்பெறும் நேரங்கள்.'
              : 'Our commitment to transparent, hassle-free payment refunds for returned or cancelled orders.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-900/10 p-6 sm:p-8 shadow-sm space-y-8 text-sm font-sans text-[#3D2024]">
          <section className="flex gap-4">
            <Clock className="w-6 h-6 text-[#D4AF37] shrink-0 mt-1" />
            <div>
              <h2 className="font-serif-luxury text-base font-bold text-[#2D1619]">
                {language === 'ta' ? '1. பணம் திரும்பப்பெறும் காலக்கெடு' : '1. Refund Processing Timeline'}
              </h2>
              <p className="mt-1 text-xs text-[#5C4A4D] leading-relaxed">
                Once a returned item is received and inspected at our Salem weaving hub, eligible refunds are initiated within <strong>24 to 48 hours</strong>. The credited amount will reflect in your original payment source (UPI, Bank Account, Card) within 3-5 business days.
              </p>
            </div>
          </section>

          <section className="flex gap-4">
            <CreditCard className="w-6 h-6 text-[#D4AF37] shrink-0 mt-1" />
            <div>
              <h2 className="font-serif-luxury text-base font-bold text-[#2D1619]">
                {language === 'ta' ? '2. செலுத்திய முறைக்கு திரும்பப் பெறுதல்' : '2. Refund Modes'}
              </h2>
              <ul className="mt-2 space-y-1.5 text-xs text-[#5C4A4D] list-disc list-inside">
                <li><strong>UPI Payments (Google Pay, PhonePe, Paytm):</strong> Instant credit to the original VPA.</li>
                <li><strong>Net Banking / Credit / Debit Cards:</strong> Credited back to bank account within 3 to 5 banking days.</li>
                <li><strong>Cash on Delivery (COD):</strong> Direct NEFT/IMPS bank transfer or UPI ID transfer after customer verification.</li>
              </ul>
            </div>
          </section>

          <section className="flex gap-4">
            <ShieldCheck className="w-6 h-6 text-[#D4AF37] shrink-0 mt-1" />
            <div>
              <h2 className="font-serif-luxury text-base font-bold text-[#2D1619]">
                {language === 'ta' ? '3. ரத்து செய்யப்பட்ட ஆர்டர்கள்' : '3. Order Cancellations'}
              </h2>
              <p className="mt-1 text-xs text-[#5C4A4D] leading-relaxed">
                Orders cancelled prior to courier dispatch receive a 100% full refund with zero cancellation charges. If dispatched, shipping charges may be deducted upon return verification.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

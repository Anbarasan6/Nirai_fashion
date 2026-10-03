import React, { useState } from 'react';
import { ShieldCheck, Truck, RefreshCw, HelpCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const PoliciesPage: React.FC = () => {
  const { t } = useShop();

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [enquirySent, setEnquirySent] = useState(false);

  const faqs = [
    {
      q: 'How does the 0% Gateway Fee UPI QR Payment work?',
      a: 'During checkout, you will see an instant UPI QR Code and UPI ID (nirai@upi). Scan with GPay, PhonePe, Paytm, or BHIM, enter the exact amount, and input your 12-digit UTR reference number. Our team verifies the transaction instantly without any 2-3% payment gateway surcharges!'
    },
    {
      q: 'Are NIRAI silk sarees certified for authenticity?',
      a: 'Yes! Every saree from NIRAI is 100% handcrafted in Salem and Elampillai using high-density mulberry silk yarn and pure metallic zari.'
    },
    {
      q: 'What is the standard shipping delivery timeline?',
      a: 'Orders are dispatched within 24 hours of payment verification. Standard delivery across South India takes 2-3 business days, and rest of India takes 4-5 days via BlueDart or DTDC.'
    },
    {
      q: 'What is your Return and Exchange Policy?',
      a: 'We offer a hassle-free 7-day exchange guarantee if the product arrives damaged or defective. Simply contact our support team on WhatsApp or email.'
    }
  ];

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnquirySent(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="font-serif-luxury text-2xl sm:text-4xl font-extrabold text-[#2D1619]">
          {t('policies')}
        </h1>
        <p className="text-xs text-[#6B5B5E]">
          Transparency, Weaver Trust & Customer Satisfaction
        </p>
      </div>

      {/* Policy Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-3">
          <div className="p-3 bg-[#F4E8C1] text-[#4A0E17] rounded-full w-fit">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-serif-luxury text-base font-bold text-[#2D1619]">
            Shipping & Delivery
          </h3>
          <p className="text-xs text-[#6B5B5E] leading-relaxed">
            Free shipping on orders above ₹2,999. Express courier partners BlueDart, DTDC, and Professional Couriers.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-3">
          <div className="p-3 bg-[#F4E8C1] text-[#4A0E17] rounded-full w-fit">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="font-serif-luxury text-base font-bold text-[#2D1619]">
            7-Day Returns & Exchange
          </h3>
          <p className="text-xs text-[#6B5B5E] leading-relaxed">
            Guaranteed replacements for weaving defects or shipping damage with unboxing video verification.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-3">
          <div className="p-3 bg-[#F4E8C1] text-[#4A0E17] rounded-full w-fit">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-serif-luxury text-base font-bold text-[#2D1619]">
            0% Gateway Fee Guarantee
          </h3>
          <p className="text-xs text-[#6B5B5E] leading-relaxed">
            Instant 0% surcharge via direct UPI QR code scanner & bank transfer reference validation.
          </p>
        </div>
      </div>

      {/* Searchable FAQ Accordion */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2D9C8] shadow-md space-y-6">
        <div className="flex items-center gap-2 border-b border-[#F2ECDF] pb-4">
          <HelpCircle className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="font-serif-luxury text-xl font-bold text-[#2D1619]">
            Frequently Asked Questions (FAQ)
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-[#E2D9C8] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 bg-[#FBF9F5] text-left text-xs sm:text-sm font-bold text-[#2D1619] flex justify-between items-center hover:bg-[#ECE6D9] transition"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-[#4A0E17]" /> : <ChevronDown className="w-4 h-4 text-[#8A7B7E]" />}
              </button>
              {openFaq === idx && (
                <div className="p-4 bg-white text-xs text-[#4A0E17] leading-relaxed border-t border-[#E2D9C8]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2D9C8] shadow-md space-y-4">
        <h3 className="font-serif-luxury text-xl font-bold text-[#2D1619]">
          Contact Weaver Support
        </h3>

        {enquirySent ? (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-xl text-center">
            ✓ Your message has been sent successfully! Our Salem team will contact you shortly.
          </div>
        ) : (
          <form onSubmit={handleEnquirySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your Name"
                className="text-xs p-3 border border-[#D4AF37]/50 rounded-xl"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="text-xs p-3 border border-[#D4AF37]/50 rounded-xl"
                required
              />
            </div>
            <textarea
              placeholder="How can we assist your saree purchase?"
              rows={3}
              className="w-full text-xs p-3 border border-[#D4AF37]/50 rounded-xl"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#2D1619] text-[#F4E8C1] text-xs font-bold rounded-xl hover:bg-[#4A0E17] flex items-center gap-1.5"
            >
              <Send className="w-4 h-4 text-[#D4AF37]" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>

    </div>
  );
};

import React from 'react';
import { useShop } from '../../context/ShopContext';
import { Truck, ShieldCheck, RotateCcw, Award } from 'lucide-react';

export const WhyChooseUsSection: React.FC = () => {
  const { language, storeSettings } = useShop();

  const benefits = [
    {
      icon: Truck,
      titleEn: 'Fast Express Delivery',
      titleTa: 'விரைவான டெலிவரி',
      descEn: `Free shipping above ₹${storeSettings.freeShippingThreshold.toLocaleString()} across India.`,
      descTa: `₹${storeSettings.freeShippingThreshold}-க்கு மேல் இந்தியா முழுவதும் இலவச டெலிவரி.`,
    },
    {
      icon: Award,
      titleEn: 'Certified Master Weaves',
      titleTa: 'அசல் கைத்தறி சான்றிதழ்',
      descEn: 'Direct from artisan looms in Kanchi, Salem, and Karaikudi.',
      descTa: 'காஞ்சி, சேலம் மற்றும் காரைக்குடி பாரம்பரிய நெசவாளர்களிடமிருந்து.',
    },
    {
      icon: RotateCcw,
      titleEn: '7-Day Easy Returns',
      titleTa: 'எளிய 7 நாள் மாற்றுமுறை',
      descEn: 'Hassle-free doorstep exchanges with dedicated support.',
      descTa: 'மனநிறைவளிக்கும் எளிய மாற்று சேவை.',
    },
    {
      icon: ShieldCheck,
      titleEn: '100% Secure Checkout',
      titleTa: 'பாதுகாப்பான கட்டணம்',
      descEn: '256-bit encrypted UPI, Cards, NetBanking, and Cash on Delivery.',
      descTa: 'பாதுகாப்பான UPI, கார்டு மற்றும் கேஷ் ஆன் டெலிவரி.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#FAF9F5] border-b border-[#EAE5DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2.5 p-4 rounded-xl border border-transparent hover:border-[#E5DFD3] hover:bg-white/60 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[#2D1619]/5 border border-[#2D1619]/15 text-[#2D1619] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-slate-900">
                    {language === 'ta' ? item.titleTa : item.titleEn}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    {language === 'ta' ? item.descTa : item.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

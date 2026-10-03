import React from 'react';
import { Sparkles, ShieldCheck, Truck, Award, Heart } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const InfiniteMarquee: React.FC = () => {
  const { language } = useShop();

  const marqueeItems = [
    { text: language === 'ta' ? '100% நேரடி நெசவாளர் பட்டு' : '100% Direct Salem Handloom Silks', icon: Award },
    { text: language === 'ta' ? '0% கட்டண UPI QR பணம் செலுத்துதல்' : '0% Gateway Fee Instant UPI Checkout', icon: ShieldCheck },
    { text: language === 'ta' ? 'இலவச விரைவு விநியோகம்' : 'Free Express Shipping Across India', icon: Truck },
    { text: language === 'ta' ? 'தூய ஜரி & மல்பெரி பட்டு' : 'Pure Metallic Zari & High Density Silk', icon: Sparkles },
    { text: language === 'ta' ? '500+ நெசவாளர் குடும்பங்களின் வாழ்வாதாரம்' : 'Supporting 500+ Master Weaver Families', icon: Heart }
  ];

  const duplicatedItems = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <div className="bg-[#4A0E17] text-[#F4E8C1] py-2.5 overflow-hidden border-y border-[#D4AF37]/30 shadow-inner relative z-20">
      <div className="animate-marquee flex items-center gap-8 text-xs font-bold tracking-wider uppercase">
        {duplicatedItems.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div key={idx} className="flex items-center gap-2 shrink-0 hover:text-white transition cursor-default">
              <IconComp className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>{item.text}</span>
              <span className="text-[#D4AF37] font-serif ml-4">✦</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

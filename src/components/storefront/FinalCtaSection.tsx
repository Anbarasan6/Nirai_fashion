import React from 'react';
import { useShop } from '../../context/ShopContext';
import { ArrowRight } from 'lucide-react';

export const FinalCtaSection: React.FC = () => {
  const { language, setActiveTab, setSelectedCategory } = useShop();

  const handleShopNow = () => {
    setSelectedCategory(null);
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-20 sm:py-24 bg-[#F2EDE4] border-b border-[#EAE5DC] text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-900/80 block">
          {language === 'ta' ? 'அசலான தமிழக கைத்தறி' : 'Timeless South Indian Heritage'}
        </span>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight">
          {language === 'ta' ? 'எங்கள் ஆடைகளை ஆராயுங்கள்' : 'Explore Our Collection'}
        </h2>

        <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto font-sans leading-relaxed">
          {language === 'ta'
            ? 'முகூர்த்த பட்டுப் புடவைகள், பாரம்பரிய வேஷ்டிகள் மற்றும் இயற்கை பருத்தி ஆடைகள்.'
            : 'Immerse yourself in authentic ceremonial Kanchipuram silks, Salem double vestis, and Chettinad weaves crafted for celebrations that endure.'}
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleShopNow}
            className="px-8 py-4 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-md inline-flex items-center gap-2 cursor-pointer group hover:shadow-lg"
          >
            <span>{language === 'ta' ? 'இப்போதே வாங்கு' : 'Shop Now'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

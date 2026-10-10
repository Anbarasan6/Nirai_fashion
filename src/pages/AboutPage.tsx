import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Award, ShieldCheck, Heart, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-amber-900 font-bold bg-amber-100 px-3 py-1 rounded-full">
            Our Heritage & Craft
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-950">
            Nirai — Where Tradition Feels Complete
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed font-serif">
            Rooted in fourth-generation South Indian weaving traditions, Nirai brings authentic GI-tagged Kanchipuram Silks, Chettinad Cottons, and Salem Dhotis directly from master weavers to your doorstep.
          </p>
        </div>

        {/* Brand Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-900">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-slate-900 text-lg">GI-Certified Authenticity</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every saree is woven with pure mulberry silk and certified gold zari, bearing the hallmark of GI-tagged master craftsmanship.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-900">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-slate-900 text-lg">Direct Weaver Empowerment</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              We eliminate middlemen, ensuring 100% fair-wage compensation directly to artisan weaving families across Kanchipuram and Salem.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-900">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-slate-900 text-lg">Rigorous Handloom Audit</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Each warp and weft undergoes strict quality checks for thread density, color fastness, and border symmetry before dispatch.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#2D1619] text-amber-100 p-8 sm:p-12 rounded-3xl text-center space-y-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold">
            Experience the Regal Touch of Genuine Handlooms
          </h2>
          <p className="text-xs text-amber-200/80 max-w-xl mx-auto">
            Discover timeless bridal silks, ceremonial vestis, and breathable cotton drapery curated for every special occasion.
          </p>
          <button
            onClick={() => navigate('/catalog')}
            className="px-8 py-3.5 bg-amber-900 hover:bg-amber-800 text-white font-semibold text-xs rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Explore Handloom Collections</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

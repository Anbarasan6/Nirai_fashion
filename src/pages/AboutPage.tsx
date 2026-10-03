import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#4A0E17]">Heritage Craftsmanship</span>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl font-extrabold text-[#2D1619]">
          About NIRAI Handloom Silks
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5B5E] max-w-2xl mx-auto">
          Connecting Salem & Elampillai master handloom weavers directly with connoisseurs of pure silk sarees worldwide.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 text-xs sm:text-sm text-[#4A0E17] leading-relaxed">
          <h2 className="font-serif-luxury text-xl font-bold text-[#2D1619]">
            Our Weaver Direct Heritage
          </h2>
          <p>
            Founded in Salem, NIRAI was created with a single purpose: to eliminate middleman margins and bring pure handloom silk sarees straight from master weavers to your wardrobe.
          </p>
          <p>
            Every saree produced under the NIRAI brand undergoes high-density mulberry yarn inspection, pure zari weaving validation, and meticulous Korvai border checking.
          </p>
        </div>
        <div className="aspect-video rounded-3xl overflow-hidden border-2 border-[#D4AF37]">
          <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80" alt="Weaver Loom" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
};

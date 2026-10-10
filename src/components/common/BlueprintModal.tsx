import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { BookOpen, X, ChevronRight, CheckCircle2, Shield, Layers, Cpu, Database } from 'lucide-react';

export const BlueprintModal: React.FC = () => {
  const { setActiveTab } = useShop();
  const [selectedSection, setSelectedSection] = useState<number>(1);

  const sections = [
    {
      id: 1,
      title: '1. Brand Identity & Vision',
      content: `Brand: NIRAI
Tagline: “Where Tradition Feels Complete” (பாரம்பரியம் முழுமை பெறும் இடம்)
Vision: To combine the sacred emotional and cultural value of traditional South Indian ethnic clothing with the effortless convenience, trust, simplicity, and premium digital experience of a modern e-commerce platform.
Values: Authentic Handloom Heritage, Transparent Fair Pricing, Zero Pretense, Weaver Empowerment, Family-Centric Celebrations.`,
    },
    {
      id: 2,
      title: '2. Target Audience & Personas',
      content: `Primary Personas:
1. Women seeking bridal & festival Kanchipuram silk sarees and Chettinad daily handlooms.
2. Men seeking ceremonial Salem double vestis (8-muzham) and pure linen mandarin collar shirts.
3. Parents purchasing children's traditional wear (girls' pattu pavadai lehengas & boys' readymade velcro dhoti-kurta sets).
4. Diaspora & regional shoppers preparing for Pongal, Deepavali, Karthigai Deepam, and temple muhurthams.`,
    },
    {
      id: 3,
      title: '3. Business Model & Sourcing Isolation',
      content: `Supplier Isolation Architecture:
• Sourcing Model: NIRAI procures directly from weaving clusters in Kanchipuram, Salem, Karaikudi, and Madurai.
• Strict Sourcing Isolation: Customers NEVER see supplier identity, supplier contact numbers, internal wholesale purchase price, or internal margins.
• Fulfillment: 100% white-labeled fulfillment by Nirai Logistics with standardized branded tamper-evident packaging.`,
    },
    {
      id: 4,
      title: '4. Category Architecture & 3-Level Hierarchy',
      content: `Level 1: Women, Men, Kids, Accessories.
Level 2:
• Women: Sarees, Salwar / Chudidar, Tops, Leggings, Ethnic Wear.
• Men: Vesti / Dhoti, Shirts, Traditional Sets.
• Kids: Boys Wear, Girls Wear, Kids Ethnic Wear.
Level 3:
• Women → Sarees → Pure Mulberry Silk Sarees, Chettinad Cotton Sarees, Soft Silk Sarees.
• Men → Vesti → 8-Muzham Double Vesti with Kasavu Zari, Temple Border Dhotis.
• Kids → Girls Wear → Handloom Pattu Pavadai Sets with Cotton Inner Linings.`,
    },
    {
      id: 5,
      title: '5. Product Data Structure & Sizing',
      content: `Schema:
• SKU (e.g. NIR-SAR-001)
• English & Tamil Names + Short/Long Descriptions
• Category / Subcategory IDs
• Base Price (MRP) + Regular Discount (%) + Special Festive Discount (%)
• Final Price = BasePrice * (1 - RegDisc%) * (1 - SpecDisc%)
• Stock Quantity & Low-Stock Threshold
• Fabric & Weave, Material Composition, Care Instructions
• Color Swatches, Variant Sizes (S, M, L, XL, Free Size, Age Groups)
• Admin-only fields: Supplier ID, Wholesale Purchase Cost, Sourcing Notes.`,
    },
    {
      id: 6,
      title: '6. Pricing & Dual Discount Engine',
      content: `Dual Discount Concept:
• Base Price (MRP)
  ↓
• Regular Discount (e.g. 15% season markdown)
  ↓
• Special Festive Discount (e.g. 5% extra Deepavali/Pongal offer)
  ↓
• Final Calculated Price (Accurate decimal rounding)
• Cart coupons can apply further on checkout.`,
    },
    {
      id: 7,
      title: '7. Free Delivery Business Rule',
      content: `Rule: Orders above ₹1,500 receive FREE EXPRESS DELIVERY across India.
• Orders below ₹1,500 incur a standard ₹120 delivery fee.
• Dynamic Progress Bar in Cart: "Add ₹X more to unlock FREE DELIVERY".
• Backend is the sole source of truth; shipping fees cannot be modified client-side.`,
    },
    {
      id: 8,
      title: '8. Shipping & Courier Integration',
      content: `Lifecycle:
• Order Confirmation → Warehouse Pack → Waybill Generation.
• Supported Couriers: BlueDart Express, Delhivery, DTDC.
• Tracking Details exposed to customer: Courier Partner, Tracking Number, Direct Tracking URL, Estimated Delivery Date. Internal supplier information remains invisible.`,
    },
    {
      id: 9,
      title: '9. Dual Language Architecture (English + Tamil)',
      content: `• Dual-language UI dictionary for navigation, checkout, trust messages, and error states.
• Product metadata supports both English & Tamil fields.
• Integrated AI Translation workflow in Admin: Admin enters English description, clicks "Translate / Generate Tamil", reviews terminology (e.g. Kanchipuram Silk → காஞ்சிபுரம் தூய பட்டு), edits manually, and publishes.`,
    },
    {
      id: 10,
      title: '10. Clean Architecture & Security',
      content: `Layered Architecture:
1. Presentation: React 19 + Tailwind v4 + Lucide Icons + Cinzel/Plus Jakarta Sans.
2. Services / Repository: StorageService, Reactive Event Bus, Translator Engine.
3. Security & Isolation:
   • Sanitized public product projections (stripping wholesale costs).
   • Role-based Access Control (Super Admin, Catalog Admin, Fulfillment Staff, Customer).
   • Idempotent order placement and stock deduction.`,
    },
  ];

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E2D5] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
              <BookOpen className="w-4 h-4 text-amber-800" />
              <span>NIRAI Technical & Architectural Constitution</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Complete E-Commerce Master Blueprint
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Comprehensive specifications covering brand identity, UX, data flow, supplier sourcing isolation, and clean architecture.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('home')}
            className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-slate-800 hover:bg-stone-100 transition-colors"
          >
            Return to Store
          </button>
        </div>

        {/* Blueprint Viewer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          {/* Section Index */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs font-serif font-bold text-slate-900 uppercase tracking-wider block mb-3">
              Blueprint Chapters
            </span>
            <div className="bg-white rounded-xl border border-[#E5DFD3] p-2 space-y-1 text-xs max-h-[500px] overflow-y-auto">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSection(sec.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-center justify-between font-semibold ${
                    selectedSection === sec.id
                      ? 'bg-amber-900 text-white'
                      : 'text-stone-700 hover:bg-amber-50'
                  }`}
                >
                  <span className="line-clamp-1">{sec.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              ))}
            </div>

            {/* Architectural Highlights */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2 text-xs">
              <span className="font-serif font-bold text-amber-950 block">
                Nirai Master Architecture Flow:
              </span>
              <div className="text-[11px] text-stone-700 space-y-1 font-mono">
                <div>Customer → React 19 Frontend</div>
                <div>↳ StorageService & PubSub Events</div>
                <div>↳ Dual Discount & Pricing Engine</div>
                <div>↳ Idempotent Stock Ledger</div>
                <div>↳ Live Tracking & Fulfillment</div>
              </div>
            </div>
          </div>

          {/* Section Content */}
          <div className="lg:col-span-8">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 border-b border-stone-100 pb-3">
                <Shield className="w-4 h-4 text-amber-800" />
                <span>Chapter {selectedSection} Specification</span>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                {sections.find((s) => s.id === selectedSection)?.title}
              </h2>

              <pre className="text-xs sm:text-sm font-sans text-stone-700 whitespace-pre-wrap leading-relaxed bg-[#FAF9F5] p-5 rounded-xl border border-[#EAE4D5]">
                {sections.find((s) => s.id === selectedSection)?.content}
              </pre>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Production-Ready Implementation</span>
                <span className="font-semibold text-emerald-800">Verified & Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Save, Building, QrCode, CheckCircle2, Sliders, Type, Plus, Trash2, 
  Sparkles, Megaphone, ShieldCheck, HeartHandshake, Globe, Layers
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import type { StoreSettings, HeroSlide } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const { settings, refreshData } = useShop();

  const [activeTab, setActiveTab] = useState<'words' | 'hero' | 'features' | 'announcement' | 'payment'>('words');

  // General & Payment Config
  const [storeName] = useState(settings.store_name);
  const [upiId, setUpiId] = useState(settings.upi_id);
  const [upiName, setUpiName] = useState(settings.upi_name);
  const [qrCodeUrl] = useState(settings.qr_code_url);
  const [bankName, setBankName] = useState(settings.bank_details?.bankName || 'State Bank of India');
  const [accountName, setAccountName] = useState(settings.bank_details?.accountName || 'NIRAI HANDLOOM SILKS');
  const [accountNumber, setAccountNumber] = useState(settings.bank_details?.accountNumber || '40982310492');
  const [ifscCode, setIfscCode] = useState(settings.bank_details?.ifscCode || 'SBIN0001824');
  const [branch, setBranch] = useState(settings.bank_details?.branch || 'Elampillai Main Branch');
  const [contactPhone, setContactPhone] = useState(settings.contact_phone || '+91 98765 43210');
  const [contactEmail] = useState(settings.contact_email || 'support@niraisilks.com');
  const [announcementEn, setAnnouncementEn] = useState(settings.announcement_en || 'Free Shipping Across India on Orders Above ₹2,999!');
  const [announcementTa, setAnnouncementTa] = useState(settings.announcement_ta || '₹2,999க்கு மேல் ஆர்டர்களுக்கு இந்தியா முழுவதும் இலவச டெலிவரி!');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(settings.free_shipping_threshold || 2999);

  // Hero Carousel Slides State
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(settings.hero_slides || [
    {
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=85',
      titleEn: 'Royal Elampillai Soft Silks',
      titleTa: 'ராயல் இளம்பிள்ளை சாஃப்ட் சில்க்ஸ்',
      subtitleEn: 'Handwoven in Salem with high-density pure zari peacock motifs.',
      subtitleTa: 'அடர்ந்த ஜரி மயில் உருவங்களுடன் சேலத்தில் கையால் நெய்யப்பட்டது.',
      ctaUrl: '/catalog'
    },
    {
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1920&q=85',
      titleEn: 'Kanchipuram Heritage Bridal Silks',
      titleTa: 'காஞ்சிபுரம் ஹெரிடேஜ் பிரைடல் பட்டு',
      subtitleEn: 'Authentic 3-ply heavy mulberry silk sarees with golden Korvai borders.',
      subtitleTa: 'தங்கக் கோர்வை பார்டர்களுடன் கூடிய தூய 3-பிளை காஞ்சிபுரம் திருமண புடவைகள்.',
      ctaUrl: '/catalog'
    }
  ]);

  // Dictionary Words Dynamic CMS State (English & Tamil)
  const [wordsEn, setWordsEn] = useState<Record<string, string>>({
    brandName: settings.custom_texts_en?.brandName || 'NIRAI',
    subBrand: settings.custom_texts_en?.subBrand || 'Pure Handloom Silks & Sarees',
    searchPlaceholder: settings.custom_texts_en?.searchPlaceholder || 'Search Elampillai, Kanchipuram, Soft Silks...',
    heroTitle: settings.custom_texts_en?.heroTitle || 'Heritage Weaves, Modern Elegance',
    heroSubtitle: settings.custom_texts_en?.heroSubtitle || 'Authentic Elampillai & Kanchipuram Handloom Silks Crafted directly by Master Weavers of Salem.',
    exploreCatalog: settings.custom_texts_en?.exploreCatalog || 'Explore Silk Collection',
    whyNiraiTitle: settings.custom_texts_en?.whyNiraiTitle || 'Why Choose NIRAI Silks?',
    directWeaver: settings.custom_texts_en?.directWeaver || '100% Direct Weaver Pricing',
    directWeaverDesc: settings.custom_texts_en?.directWeaverDesc || 'Zero middlemen margins. We source and produce directly from weaver clusters.',
    silkMark: settings.custom_texts_en?.silkMark || 'Authentic Silk Guarantee',
    silkMarkDesc: settings.custom_texts_en?.silkMarkDesc || 'Every saree is handcrafted using high-density mulberry silk & pure zari.',
    zeroGatewayFee: settings.custom_texts_en?.zeroGatewayFee || '0% Gateway Fee UPI Checkout',
    zeroGatewayFeeDesc: settings.custom_texts_en?.zeroGatewayFeeDesc || 'Direct instant QR scan payment with zero surcharge and instant WhatsApp confirmation.',
    addToCart: settings.custom_texts_en?.addToCart || 'Add to Cart',
    buyNow: settings.custom_texts_en?.buyNow || 'Buy Now via Instant UPI',
    featuredProducts: settings.custom_texts_en?.featuredProducts || 'Curated Handloom Sarees',
    newArrivals: settings.custom_texts_en?.newArrivals || 'New Weaver Arrivals',
    freeShippingNotice: settings.custom_texts_en?.freeShippingNotice || 'Free Shipping Across India on Orders Above ₹2,999!'
  });

  const [wordsTa, setWordsTa] = useState<Record<string, string>>({
    brandName: settings.custom_texts_ta?.brandName || 'நிறை',
    subBrand: settings.custom_texts_ta?.subBrand || 'தூய கைத்தறி பட்டு & சேலைகள்',
    searchPlaceholder: settings.custom_texts_ta?.searchPlaceholder || 'இளம்பிள்ளை, காஞ்சிபுரம், சாஃப்ட் சில்க்ஸ் தேடுக...',
    heroTitle: settings.custom_texts_ta?.heroTitle || 'பாரம்பரிய நெசவு, நவீன நேர்த்தி',
    heroSubtitle: settings.custom_texts_ta?.heroSubtitle || 'சேலத்தின் சிறந்த நெசவாளர்களால் நேரடியாக நெய்யப்பட்ட உண்மையான இளம்பிள்ளை மற்றும் காஞ்சிபுரம் பட்டுச் சேலைகள்.',
    exploreCatalog: settings.custom_texts_ta?.exploreCatalog || 'பட்டு சேலைகளைப் பாருங்கள்',
    whyNiraiTitle: settings.custom_texts_ta?.whyNiraiTitle || 'ஏன் நிறை பட்டைத் தேர்வு செய்ய வேண்டும்?',
    directWeaver: settings.custom_texts_ta?.directWeaver || '100% நேரடி நெசவாளர் விலை',
    directWeaverDesc: settings.custom_texts_ta?.directWeaverDesc || 'இடைத்தரகர் கமிஷன் இல்லை. நெசவாளர்களிடமிருந்து நேரடியாகப் பெறுங்கள்.',
    silkMark: settings.custom_texts_ta?.silkMark || 'உண்மையான பட்டு உத்தரவாதம்',
    silkMarkDesc: settings.custom_texts_ta?.silkMarkDesc || 'ஒவ்வொரு சேலையும் உயர் அடர்த்தி மல்பெரி பட்டு மற்றும் சுத்தமான ஜரியால் நெய்யப்பட்டது.',
    zeroGatewayFee: settings.custom_texts_ta?.zeroGatewayFee || '0% கட்டண UPI கட்டணம்',
    zeroGatewayFeeDesc: settings.custom_texts_ta?.zeroGatewayFeeDesc || 'பூஜ்ய கூடுதல் கட்டணத்துடன் நேரடி QR ஸ்கேன் பணம் செலுத்துதல்.',
    addToCart: settings.custom_texts_ta?.addToCart || 'கூடையில் சேர்',
    buyNow: settings.custom_texts_ta?.buyNow || 'உடனடி UPI மூலம் வாங்கவும்',
    featuredProducts: settings.custom_texts_ta?.featuredProducts || 'சிறப்பு கைத்தறி சேலைகள்',
    newArrivals: settings.custom_texts_ta?.newArrivals || 'புதிய வரவுகள்',
    freeShippingNotice: settings.custom_texts_ta?.freeShippingNotice || '₹2,999க்கு மேல் ஆர்டர்களுக்கு இந்தியா முழுவதும் இலவச டெலிவரி!'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadToCloudinary(file);
      const updated = [...heroSlides];
      updated[index].image = url;
      setHeroSlides(updated);
    } catch {
      // Ignore
    }
  };

  const addHeroSlide = () => {
    setHeroSlides([
      ...heroSlides,
      {
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1920&q=85',
        titleEn: 'New Festive Collection',
        titleTa: 'புதிய பண்டிகை கால பட்டுத் தொகுப்பு',
        subtitleEn: 'Pure Mulberry Silk Weaves Direct From Salem Looms.',
        subtitleTa: 'சேலம் நெசவுக்கூடங்களிலிருந்து நேரடியாக பெறப்பட்ட தூய பட்டு.',
        ctaUrl: '/catalog'
      }
    ]);
  };

  const removeHeroSlide = (index: number) => {
    setHeroSlides(heroSlides.filter((_, i) => i !== index));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSettings: StoreSettings = {
      id: 'store_settings',
      store_name: storeName,
      upi_id: upiId,
      upi_name: upiName,
      qr_code_url: qrCodeUrl,
      bank_details: {
        bankName,
        accountName,
        accountNumber,
        ifscCode,
        branch
      },
      contact_phone: contactPhone,
      contact_email: contactEmail,
      announcement_en: announcementEn,
      announcement_ta: announcementTa,
      free_shipping_threshold: Number(freeShippingThreshold),
      hero_slides: heroSlides,
      custom_texts_en: wordsEn,
      custom_texts_ta: wordsTa
    };

    await StorageService.updateSettings(updatedSettings);
    await refreshData();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6 text-xs pb-12">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm">
        <div>
          <h2 className="font-serif-luxury text-xl font-bold text-[#2D1619] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            <span>Homepage & Brand Experience Manager</span>
          </h2>
          <p className="text-xs text-[#8A7B7E] mt-1">
            Dynamic control suite for all storefront words, hero sliders, feature cards, and payment configurations.
          </p>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-[#2D1619] text-[#F4E8C1] text-xs font-bold rounded-xl hover:bg-[#4A0E17] flex items-center gap-2 shadow-md shrink-0 border border-[#D4AF37]/40 transition"
        >
          <Save className="w-4 h-4 text-[#D4AF37]" />
          <span>Save All Dynamic Changes</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold rounded-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>All dynamic words, hero banners, feature cards & payment credentials saved successfully!</span>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2D9C8] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('words')}
          className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 transition ${
            activeTab === 'words' 
              ? 'bg-[#2D1619] text-[#F4E8C1] shadow-md border border-[#D4AF37]/50' 
              : 'bg-white text-[#6B5B5E] hover:bg-[#F4E8C1]/40 border border-[#E2D9C8]'
          }`}
        >
          <Type className={`w-4 h-4 ${activeTab === 'words' ? 'text-[#D4AF37]' : ''}`} />
          <span>Dynamic Page Words CMS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 transition ${
            activeTab === 'hero' 
              ? 'bg-[#2D1619] text-[#F4E8C1] shadow-md border border-[#D4AF37]/50' 
              : 'bg-white text-[#6B5B5E] hover:bg-[#F4E8C1]/40 border border-[#E2D9C8]'
          }`}
        >
          <Sliders className={`w-4 h-4 ${activeTab === 'hero' ? 'text-[#D4AF37]' : ''}`} />
          <span>Hero Banners Carousel</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 transition ${
            activeTab === 'features' 
              ? 'bg-[#2D1619] text-[#F4E8C1] shadow-md border border-[#D4AF37]/50' 
              : 'bg-white text-[#6B5B5E] hover:bg-[#F4E8C1]/40 border border-[#E2D9C8]'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${activeTab === 'features' ? 'text-[#D4AF37]' : ''}`} />
          <span>Feature Showcase & Badges</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcement')}
          className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 transition ${
            activeTab === 'announcement' 
              ? 'bg-[#2D1619] text-[#F4E8C1] shadow-md border border-[#D4AF37]/50' 
              : 'bg-white text-[#6B5B5E] hover:bg-[#F4E8C1]/40 border border-[#E2D9C8]'
          }`}
        >
          <Megaphone className={`w-4 h-4 ${activeTab === 'announcement' ? 'text-[#D4AF37]' : ''}`} />
          <span>Announcement Marquee Ticker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 transition ${
            activeTab === 'payment' 
              ? 'bg-[#2D1619] text-[#F4E8C1] shadow-md border border-[#D4AF37]/50' 
              : 'bg-white text-[#6B5B5E] hover:bg-[#F4E8C1]/40 border border-[#E2D9C8]'
          }`}
        >
          <QrCode className={`w-4 h-4 ${activeTab === 'payment' ? 'text-[#D4AF37]' : ''}`} />
          <span>UPI QR & Bank Credentials</span>
        </button>
      </div>

      {/* 1. DYNAMIC PAGE WORDS CMS TAB */}
      {activeTab === 'words' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#F2ECDF] pb-3">
              <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] flex items-center gap-2">
                <Type className="w-5 h-5 text-[#D4AF37]" />
                <span>Storefront Words & Dictionaries CMS (Bilingual English & தமிழ்)</span>
              </h3>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#F4E8C1] text-[#2D1619] font-bold">
                100% Dynamic Overrides
              </span>
            </div>

            <p className="text-xs text-[#6B5B5E]">
              Edit any key label or word displayed across customer pages. Changes saved here reflect instantly on header, homepage, product pages, cart, and checkout.
            </p>

            {/* Brand & Header Section */}
            <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E2D9C8] space-y-4">
              <h4 className="font-bold text-xs text-[#4A0E17] uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#D4AF37]" />
                <span>Brand Identity & Header Labels</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Brand Name (English)</label>
                  <input
                    type="text"
                    value={wordsEn.brandName}
                    onChange={(e) => setWordsEn({ ...wordsEn, brandName: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Brand Name (Tamil - தமிழ்)</label>
                  <input
                    type="text"
                    value={wordsTa.brandName}
                    onChange={(e) => setWordsTa({ ...wordsTa, brandName: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Sub-Brand Tagline (English)</label>
                  <input
                    type="text"
                    value={wordsEn.subBrand}
                    onChange={(e) => setWordsEn({ ...wordsEn, subBrand: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Sub-Brand Tagline (Tamil - தமிழ்)</label>
                  <input
                    type="text"
                    value={wordsTa.subBrand}
                    onChange={(e) => setWordsTa({ ...wordsTa, subBrand: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Search Bar Placeholder (English)</label>
                  <input
                    type="text"
                    value={wordsEn.searchPlaceholder}
                    onChange={(e) => setWordsEn({ ...wordsEn, searchPlaceholder: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Search Bar Placeholder (Tamil - தமிழ்)</label>
                  <input
                    type="text"
                    value={wordsTa.searchPlaceholder}
                    onChange={(e) => setWordsTa({ ...wordsTa, searchPlaceholder: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Main Homepage Titles Section */}
            <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E2D9C8] space-y-4">
              <h4 className="font-bold text-xs text-[#4A0E17] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>Homepage Hero Titles & Buttons</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Hero Title (English)</label>
                  <input
                    type="text"
                    value={wordsEn.heroTitle}
                    onChange={(e) => setWordsEn({ ...wordsEn, heroTitle: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Hero Title (Tamil - தமிழ்)</label>
                  <input
                    type="text"
                    value={wordsTa.heroTitle}
                    onChange={(e) => setWordsTa({ ...wordsTa, heroTitle: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#2D1619] block mb-1">Hero Subtitle (English)</label>
                    <textarea
                      rows={2}
                      value={wordsEn.heroSubtitle}
                      onChange={(e) => setWordsEn({ ...wordsEn, heroSubtitle: e.target.value })}
                      className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#2D1619] block mb-1">Hero Subtitle (Tamil - தமிழ்)</label>
                    <textarea
                      rows={2}
                      value={wordsTa.heroSubtitle}
                      onChange={(e) => setWordsTa({ ...wordsTa, heroSubtitle: e.target.value })}
                      className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Explore Catalog CTA Button (English)</label>
                  <input
                    type="text"
                    value={wordsEn.exploreCatalog}
                    onChange={(e) => setWordsEn({ ...wordsEn, exploreCatalog: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Explore Catalog CTA Button (Tamil - தமிழ்)</label>
                  <input
                    type="text"
                    value={wordsTa.exploreCatalog}
                    onChange={(e) => setWordsTa({ ...wordsTa, exploreCatalog: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Product Page & Cart Action Buttons */}
            <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E2D9C8] space-y-4">
              <h4 className="font-bold text-xs text-[#4A0E17] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>Product & Checkout Action Buttons</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">"Add to Cart" Button (English)</label>
                  <input
                    type="text"
                    value={wordsEn.addToCart}
                    onChange={(e) => setWordsEn({ ...wordsEn, addToCart: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">"Add to Cart" Button (Tamil - தமிழ்)</label>
                  <input
                    type="text"
                    value={wordsTa.addToCart}
                    onChange={(e) => setWordsTa({ ...wordsTa, addToCart: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">"Buy Now Instant UPI" Button (English)</label>
                  <input
                    type="text"
                    value={wordsEn.buyNow}
                    onChange={(e) => setWordsEn({ ...wordsEn, buyNow: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">"Buy Now Instant UPI" Button (Tamil - தமிழ்)</label>
                  <input
                    type="text"
                    value={wordsTa.buyNow}
                    onChange={(e) => setWordsTa({ ...wordsTa, buyNow: e.target.value })}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. HERO CAROUSEL BANNERS TAB */}
      {activeTab === 'hero' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-[#F2ECDF] pb-3">
            <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#D4AF37]" />
              <span>Hero Banner Carousel Slider Manager</span>
            </h3>

            <button
              type="button"
              onClick={addHeroSlide}
              className="px-3 py-1.5 bg-[#4A0E17] text-[#F4E8C1] font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-[#2D1619]"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>Add New Hero Slide</span>
            </button>
          </div>

          <div className="space-y-6">
            {heroSlides.map((slide, index) => (
              <div key={index} className="p-4 bg-[#FAF7F0] border border-[#E2D9C8] rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-[#E2D9C8] pb-2">
                  <span className="font-bold text-[#2D1619] text-xs">Hero Slide #{index + 1}</span>
                  {heroSlides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHeroSlide(index)}
                      className="text-red-700 hover:text-red-900 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="font-bold text-[#2D1619] block mb-1">Slide Image</label>
                    <div className="aspect-video rounded-xl overflow-hidden bg-black/5 relative border border-[#D4AF37]/50">
                      <img src={slide.image} alt="Hero preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleHeroImageUpload(e, index)}
                        className="text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-[#2D1619] file:text-[#F4E8C1] file:font-bold"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#2D1619] block mb-1">Title (English)</label>
                      <input
                        type="text"
                        value={slide.titleEn}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[index].titleEn = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full p-2 border border-[#D4AF37]/50 rounded-xl bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[#2D1619] block mb-1">Title (Tamil - தமிழ்)</label>
                      <input
                        type="text"
                        value={slide.titleTa}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[index].titleTa = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full p-2 border border-[#D4AF37]/50 rounded-xl bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#2D1619] block mb-1">Subtitle (English)</label>
                      <input
                        type="text"
                        value={slide.subtitleEn}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[index].subtitleEn = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full p-2 border border-[#D4AF37]/50 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[#2D1619] block mb-1">Subtitle (Tamil - தமிழ்)</label>
                      <input
                        type="text"
                        value={slide.subtitleTa}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[index].subtitleTa = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full p-2 border border-[#D4AF37]/50 rounded-xl bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-[#2D1619] block mb-1">Button Destination URL</label>
                      <input
                        type="text"
                        value={slide.ctaUrl}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[index].ctaUrl = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full p-2 border border-[#D4AF37]/50 rounded-xl bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. FEATURE SHOWCASE CARDS TAB */}
      {activeTab === 'features' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-6">
          <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] flex items-center gap-2 border-b border-[#F2ECDF] pb-3">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <span>"Why Choose NIRAI" Feature Showcase & Weaver Guarantee Cards</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E2D9C8] space-y-3">
              <h4 className="font-bold text-[#4A0E17] flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#D4AF37]" />
                <span>Feature Card #1: Direct Weaver Price</span>
              </h4>
              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Title (English)</label>
                <input
                  type="text"
                  value={wordsEn.directWeaver}
                  onChange={(e) => setWordsEn({ ...wordsEn, directWeaver: e.target.value })}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={wordsEn.directWeaverDesc}
                  onChange={(e) => setWordsEn({ ...wordsEn, directWeaverDesc: e.target.value })}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E2D9C8] space-y-3">
              <h4 className="font-bold text-[#4A0E17] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Feature Card #2: Authentic Silk Guarantee</span>
              </h4>
              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Title (English)</label>
                <input
                  type="text"
                  value={wordsEn.silkMark}
                  onChange={(e) => setWordsEn({ ...wordsEn, silkMark: e.target.value })}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={wordsEn.silkMarkDesc}
                  onChange={(e) => setWordsEn({ ...wordsEn, silkMarkDesc: e.target.value })}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ANNOUNCEMENT MARQUEE TAB */}
      {activeTab === 'announcement' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-6">
          <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] flex items-center gap-2 border-b border-[#F2ECDF] pb-3">
            <Megaphone className="w-5 h-5 text-[#D4AF37]" />
            <span>Top Infinite Auto-Scrolling Announcement Bar</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Announcement Text (English)</label>
              <input
                type="text"
                value={announcementEn}
                onChange={(e) => setAnnouncementEn(e.target.value)}
                className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Announcement Text (Tamil - தமிழ்)</label>
              <input
                type="text"
                value={announcementTa}
                onChange={(e) => setAnnouncementTa(e.target.value)}
                className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Free Shipping Order Minimum (₹)</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. UPI QR & BANK CREDENTIALS TAB */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
            <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] flex items-center gap-2 border-b border-[#F2ECDF] pb-3">
              <QrCode className="w-5 h-5 text-[#D4AF37]" />
              <span>Direct UPI Gateway Settings (0% Gateway Fee)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Merchant UPI ID (e.g. niraisilks@upi)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#2D1619] block mb-1">UPI Payee Account Name</label>
                <input
                  type="text"
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
            <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] flex items-center gap-2 border-b border-[#F2ECDF] pb-3">
              <Building className="w-5 h-5 text-[#D4AF37]" />
              <span>Direct Bank Account Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[#2D1619] block mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Branch Location</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Weaver WhatsApp Support Contact</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </form>
  );
};

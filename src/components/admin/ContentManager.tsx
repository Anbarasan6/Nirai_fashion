import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { StoreSettings, Banner } from '../../types';
import { Megaphone, Save, Truck, Image as ImageIcon, Sparkles } from 'lucide-react';

export const ContentManager: React.FC = () => {
  const { showToast, refreshData } = useShop();

  const [settings, setSettings] = useState<StoreSettings>(() => StorageService.getSettings());
  const [banners, setBanners] = useState<Banner[]>(() => StorageService.getBanners());

  // Form State
  const [announcementEn, setAnnouncementEn] = useState(settings.announcementEn);
  const [announcementTa, setAnnouncementTa] = useState(settings.announcementTa);
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(settings.isAnnouncementActive);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(settings.freeShippingThreshold);
  const [standardShippingFee, setStandardShippingFee] = useState(settings.standardShippingFee);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);

  // Hero Banner 1 State
  const heroBanner = banners[0] || {
    id: 'ban-1',
    titleEn: 'Where Tradition Feels Complete',
    titleTa: 'பாரம்பரியம் முழுமை பெறும் இடம்',
    subtitleEn: 'Authentic South Indian Handloom Silks & Fine Ceremonial Vestis',
    subtitleTa: 'கைத்தறி பட்டுப் புடவைகள் மற்றும் திருமண வேஷ்டிகள்',
    badgeEn: 'Special Festive Collection',
    badgeTa: 'சிறப்பு பண்டிகை தொகுப்பு',
    ctaTextEn: 'Explore Handlooms',
    ctaTextTa: 'ஆடைகளைத் தேடுங்கள்',
    ctaLink: '#catalog',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=80',
    isActive: true,
    position: 'hero' as const,
  };

  const [heroTitleEn, setHeroTitleEn] = useState(heroBanner.titleEn);
  const [heroTitleTa, setHeroTitleTa] = useState(heroBanner.titleTa);
  const [heroSubEn, setHeroSubEn] = useState(heroBanner.subtitleEn);
  const [heroSubTa, setHeroSubTa] = useState(heroBanner.subtitleTa);
  const [heroImage, setHeroImage] = useState(heroBanner.imageUrl);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSettings: StoreSettings = {
      ...settings,
      announcementEn,
      announcementTa,
      isAnnouncementActive,
      freeShippingThreshold: Number(freeShippingThreshold),
      standardShippingFee: Number(standardShippingFee),
      supportPhone,
      supportEmail,
    };

    StorageService.saveSettings(updatedSettings);

    const updatedBanner: Banner = {
      ...heroBanner,
      titleEn: heroTitleEn,
      titleTa: heroTitleTa,
      subtitleEn: heroSubEn,
      subtitleTa: heroSubTa,
      imageUrl: heroImage,
    };

    StorageService.saveBanner(updatedBanner);
    refreshData();
    showToast('Store settings and homepage banners updated!', 'success');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="font-serif text-lg font-bold text-slate-900">
          Store Content, Rules & Homepage Banners
        </h2>
        <p className="text-xs text-stone-500">
          Update the global ₹1,500 free delivery rule, bilingual announcement strip, and hero banners.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Free Delivery Business Rule */}
        <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <Truck className="w-5 h-5 text-amber-900" />
            <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
              Free Delivery & Shipping Threshold Engine
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Free Delivery Threshold (₹) *
              </label>
              <input
                type="number"
                required
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full p-2.5 border border-stone-300 rounded-md font-bold tabular-nums"
              />
              <span className="text-[11px] text-stone-500 mt-1 block">
                Orders equal to or above this amount automatically unlock Free Standard Delivery.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Standard Shipping Fee (₹ if under threshold)
              </label>
              <input
                type="number"
                required
                value={standardShippingFee}
                onChange={(e) => setStandardShippingFee(Number(e.target.value))}
                className="w-full p-2.5 border border-stone-300 rounded-md font-bold tabular-nums"
              />
              <span className="text-[11px] text-stone-500 mt-1 block">
                Charged when total order value is below the free delivery threshold.
              </span>
            </div>
          </div>
        </div>

        {/* Bilingual Announcement Strip */}
        <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-900" />
              <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
                Top Announcement Bar
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncementActive}
                onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                className="w-4 h-4 text-amber-900"
              />
              <span>Display on Storefront</span>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">English Announcement</label>
              <input
                type="text"
                value={announcementEn}
                onChange={(e) => setAnnouncementEn(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-md"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Tamil Announcement (தமிழ் அறிவிப்பு)
              </label>
              <input
                type="text"
                value={announcementTa}
                onChange={(e) => setAnnouncementTa(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-md font-serif"
              />
            </div>
          </div>
        </div>

        {/* Homepage Hero Banner Configuration */}
        <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <ImageIcon className="w-5 h-5 text-amber-900" />
            <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
              Homepage Hero Showcase Banner
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">English Headline</label>
              <input
                type="text"
                value={heroTitleEn}
                onChange={(e) => setHeroTitleEn(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-md font-serif font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Tamil Headline (தமிழ் தலைப்பு)</label>
              <input
                type="text"
                value={heroTitleTa}
                onChange={(e) => setHeroTitleTa(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-md font-serif font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">English Subheadline</label>
              <textarea
                rows={2}
                value={heroSubEn}
                onChange={(e) => setHeroSubEn(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-md"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Tamil Subheadline</label>
              <textarea
                rows={2}
                value={heroSubTa}
                onChange={(e) => setHeroSubTa(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-md font-serif"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">Hero Showcase Image URL</label>
              <input
                type="text"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Customer Care Contacts */}
        <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
          <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-stone-100 pb-3">
            Customer Care Support Channels
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Support Phone</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-md font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Publish Storefront Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};

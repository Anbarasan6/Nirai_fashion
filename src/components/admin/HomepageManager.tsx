import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import {
  StoreSettings,
  HeroSlide,
  PromoBannerConfig,
  HomepageSectionItem,
  LogoSettings,
  Category,
  Product,
} from '../../types';
import { MediaUploadModal } from '../common/MediaUploadModal';
import {
  Layers,
  Image as ImageIcon,
  Save,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Sliders,
  CheckCircle,
  Truck,
  Tag,
  Clock,
  ExternalLink,
  ChevronRight,
  MoveVertical,
  X,
} from 'lucide-react';

export const HomepageManager: React.FC = () => {
  const { showToast, refreshData } = useShop();

  // Settings & Sections
  const [settings, setSettings] = useState<StoreSettings>(() => StorageService.getSettings());
  const [sections, setSections] = useState<HomepageSectionItem[]>(() =>
    StorageService.getHomepageSections()
  );
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() =>
    StorageService.getHeroSlides()
  );
  const [promoBanner, setPromoBanner] = useState<PromoBannerConfig>(() =>
    StorageService.getPromoBanner()
  );
  const [logoSettings, setLogoSettings] = useState<LogoSettings>(() =>
    StorageService.getLogoSettings()
  );

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<
    'logo' | 'hero' | 'sections' | 'promo' | 'featured'
  >('logo');

  // Media Modal state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<{
    field: string;
    category: any;
    title: string;
    aspectRatioNote?: string;
  } | null>(null);

  // Hero Slide Modal
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideFormData, setSlideFormData] = useState<Partial<HeroSlide>>({
    titleEn: '',
    titleTa: '',
    subtitleEn: '',
    subtitleTa: '',
    badgeEn: 'Special Collection',
    badgeTa: 'சிறப்புத் தொகுப்பு',
    ctaTextEn: 'Shop Now',
    ctaTextTa: 'இப்போதே வாங்கு',
    ctaLink: 'cat-sarees',
    desktopImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&h=700&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1080&h=1350&q=85',
    isActive: true,
  });

  // Featured Products Selection
  const [allProducts, setAllProducts] = useState<Product[]>(() => StorageService.getProducts());

  const syncAll = () => {
    const fresh = StorageService.getSettings();
    setSettings(fresh);
    setSections(StorageService.getHomepageSections());
    setHeroSlides(StorageService.getHeroSlides());
    setPromoBanner(StorageService.getPromoBanner());
    setLogoSettings(StorageService.getLogoSettings());
    setAllProducts(StorageService.getProducts());
    refreshData();
  };

  // Open Media Picker for specific field
  const openMediaPicker = (
    field: string,
    category: any,
    title: string,
    aspectRatioNote?: string
  ) => {
    setMediaTarget({ field, category, title, aspectRatioNote });
    setMediaModalOpen(true);
  };

  const handleMediaSelected = (url: string) => {
    if (!mediaTarget) return;

    if (mediaTarget.field === 'desktopLogo') {
      setLogoSettings((prev) => ({ ...prev, desktopLogoUrl: url }));
    } else if (mediaTarget.field === 'mobileLogo') {
      setLogoSettings((prev) => ({ ...prev, mobileLogoUrl: url }));
    } else if (mediaTarget.field === 'slideDesktop') {
      setSlideFormData((prev) => ({ ...prev, desktopImage: url }));
    } else if (mediaTarget.field === 'slideMobile') {
      setSlideFormData((prev) => ({ ...prev, mobileImage: url }));
    } else if (mediaTarget.field === 'promoDesktop') {
      setPromoBanner((prev) => ({ ...prev, desktopImage: url }));
    } else if (mediaTarget.field === 'promoMobile') {
      setPromoBanner((prev) => ({ ...prev, mobileImage: url }));
    }
  };

  // Save Logo Settings
  const handleSaveLogo = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveLogoSettings(logoSettings);
    syncAll();
    showToast('Website logo and branding settings updated!', 'success');
  };

  // Move Section Up/Down
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    // re-index order
    const ordered = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(ordered);
    StorageService.saveHomepageSections(ordered);
    syncAll();
    showToast('Homepage section order saved!', 'success');
  };

  const handleToggleSectionVisibility = (id: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s));
    setSections(updated);
    StorageService.saveHomepageSections(updated);
    syncAll();
    showToast('Section visibility updated!', 'info');
  };

  // Hero Slide Management
  const handleOpenAddSlide = () => {
    setEditingSlide(null);
    setSlideFormData({
      titleEn: '',
      titleTa: '',
      subtitleEn: '',
      subtitleTa: '',
      badgeEn: 'Special Festive Collection',
      badgeTa: 'சிறப்பு திருவிழா கைத்தறி',
      ctaTextEn: 'Shop Now',
      ctaTextTa: 'இப்போதே வாங்கு',
      ctaLink: 'cat-sarees',
      desktopImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&h=700&q=85',
      mobileImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1080&h=1350&q=85',
      isActive: true,
      order: heroSlides.length + 1,
    });
    setIsSlideModalOpen(true);
  };

  const handleOpenEditSlide = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setSlideFormData({ ...slide });
    setIsSlideModalOpen(true);
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideFormData.titleEn || !slideFormData.desktopImage) {
      showToast('Please provide a headline and desktop image.', 'error');
      return;
    }

    const payload: HeroSlide = {
      id: editingSlide?.id || `slide-${Date.now()}`,
      titleEn: slideFormData.titleEn.trim(),
      titleTa: slideFormData.titleTa?.trim() || slideFormData.titleEn.trim(),
      subtitleEn: slideFormData.subtitleEn?.trim() || '',
      subtitleTa: slideFormData.subtitleTa?.trim() || '',
      badgeEn: slideFormData.badgeEn?.trim() || 'Festive Collection',
      badgeTa: slideFormData.badgeTa?.trim() || 'சிறப்புத் தொகுப்பு',
      ctaTextEn: slideFormData.ctaTextEn?.trim() || 'Shop Now',
      ctaTextTa: slideFormData.ctaTextTa?.trim() || 'இப்போதே வாங்கு',
      ctaLink: slideFormData.ctaLink?.trim() || 'cat-sarees',
      desktopImage: slideFormData.desktopImage.trim(),
      mobileImage: slideFormData.mobileImage?.trim() || slideFormData.desktopImage.trim(),
      isActive: slideFormData.isActive ?? true,
      order: editingSlide?.order || heroSlides.length + 1,
    };

    StorageService.saveHeroSlide(payload);
    syncAll();
    setIsSlideModalOpen(false);
    showToast(editingSlide ? 'Hero banner updated!' : 'New hero banner added!', 'success');
  };

  const handleDeleteSlide = (id: string) => {
    if (heroSlides.length <= 1) {
      showToast('You must keep at least one hero slide.', 'error');
      return;
    }
    if (confirm('Delete this hero banner slide?')) {
      StorageService.deleteHeroSlide(id);
      syncAll();
      showToast('Slide deleted', 'info');
    }
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const list = [...heroSlides];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reordered = list.map((s, idx) => ({ ...s, order: idx + 1 }));
    setHeroSlides(reordered);
    StorageService.reorderHeroSlides(reordered);
    syncAll();
    showToast('Slide carousel order saved!', 'success');
  };

  // Promo Banner Save
  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.savePromoBanner(promoBanner);
    syncAll();
    showToast('Promotional banner saved and published!', 'success');
  };

  // Toggle Featured & New Arrival
  const handleToggleFeatured = (prodId: string) => {
    const state = StorageService.toggleProductFeatured(prodId);
    syncAll();
    showToast(`Product ${state ? 'added to' : 'removed from'} Featured Collection`, 'info');
  };

  const handleToggleNewArrival = (prodId: string) => {
    const state = StorageService.toggleProductNewArrival(prodId);
    syncAll();
    showToast(`Product ${state ? 'tagged as' : 'removed from'} New Arrival`, 'info');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
          Homepage & Brand Experience Manager
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Dynamically control logo branding, auto-sliding hero banners, promotional offers, featured curation, and section ordering.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2DBD0] bg-white rounded-t-xl p-1 gap-1 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('logo')}
          className={`px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'logo'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Website Logo & Branding
        </button>

        <button
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'hero'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Hero Carousel ({heroSlides.length})
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Section Layout & Ordering
        </button>

        <button
          onClick={() => setActiveTab('promo')}
          className={`px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'promo'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Promotional Wide Banner
        </button>

        <button
          onClick={() => setActiveTab('featured')}
          className={`px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'featured'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Featured & New Arrivals Curation
        </button>
      </div>

      {/* TAB 1: WEBSITE LOGO & BRANDING */}
      {activeTab === 'logo' && (
        <form onSubmit={handleSaveLogo} className="bg-white p-6 rounded-b-xl rounded-tr-xl border border-[#E2DBD0] shadow-2xs space-y-6 text-xs">
          <div>
            <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
              Navbar Logo Upload & Aspect-Ratio Configuration
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Upload custom brand logos. Automatically optimized with no distortion. If left empty, the site displays the clean luxury serif NIRAI wordmark.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Desktop Logo */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-stone-800">Desktop Website Logo</label>
                <span className="text-[10px] text-stone-400 font-mono">400 × 120 px (approx 3:1)</span>
              </div>

              {/* Preview Box */}
              <div className="h-28 rounded-lg border border-dashed border-stone-300 bg-white flex items-center justify-center p-3 relative group overflow-hidden">
                {logoSettings.desktopLogoUrl ? (
                  <img
                    src={logoSettings.desktopLogoUrl}
                    alt="Desktop Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-stone-400">
                    <span className="font-serif text-2xl font-bold tracking-widest text-[#2D1619] block">
                      NIRAI
                    </span>
                    <span className="text-[10px]">Using Default Wordmark</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openMediaPicker(
                      'desktopLogo',
                      'logos',
                      'Select or Upload Desktop Logo',
                      'Recommended: 400 × 120 px (approx 3:1 aspect ratio), transparent PNG or SVG'
                    )
                  }
                  className="flex-1 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold text-center cursor-pointer transition-colors shadow-2xs"
                >
                  {logoSettings.desktopLogoUrl ? 'Change Desktop Logo' : 'Upload Desktop Logo'}
                </button>

                {logoSettings.desktopLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoSettings((p) => ({ ...p, desktopLogoUrl: '' }))}
                    className="p-2 border border-stone-300 text-stone-600 hover:text-rose-700 rounded-lg hover:bg-white"
                    title="Remove and revert to Wordmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Logo */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-stone-800">Mobile Icon / Logo</label>
                <span className="text-[10px] text-stone-400 font-mono">160 × 160 px (approx 1:1)</span>
              </div>

              {/* Preview Box */}
              <div className="h-28 rounded-lg border border-dashed border-stone-300 bg-white flex items-center justify-center p-3 relative group overflow-hidden">
                {logoSettings.mobileLogoUrl ? (
                  <img
                    src={logoSettings.mobileLogoUrl}
                    alt="Mobile Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-stone-400">
                    <span className="font-serif text-xl font-bold tracking-widest text-[#2D1619] block">
                      N
                    </span>
                    <span className="text-[10px]">Using Compact Wordmark</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openMediaPicker(
                      'mobileLogo',
                      'logos',
                      'Select or Upload Mobile Logo',
                      'Recommended: 160 × 160 px icon-style logo, transparent PNG or SVG'
                    )
                  }
                  className="flex-1 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold text-center cursor-pointer transition-colors shadow-2xs"
                >
                  {logoSettings.mobileLogoUrl ? 'Change Mobile Logo' : 'Upload Mobile Logo'}
                </button>

                {logoSettings.mobileLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoSettings((p) => ({ ...p, mobileLogoUrl: '' }))}
                    className="p-2 border border-stone-300 text-stone-600 hover:text-rose-700 rounded-lg hover:bg-white"
                    title="Remove Mobile Logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Logo Accessibility Alt Text</label>
            <input
              type="text"
              value={logoSettings.altText}
              onChange={(e) => setLogoSettings({ ...logoSettings, altText: e.target.value })}
              className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              placeholder="e.g. Nirai Handloom Silks and Vestis"
            />
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Logo Branding</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: HERO CAROUSEL */}
      {activeTab === 'hero' && (
        <div className="bg-white p-6 rounded-b-xl rounded-tr-xl border border-[#E2DBD0] shadow-2xs space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
                Auto-Sliding Hero Banners ({heroSlides.length})
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Full-width visual banners with responsive Desktop (1920×700) and Mobile (1080×1350) images. Auto-slides every few seconds.
              </p>
            </div>

            <button
              onClick={handleOpenAddSlide}
              className="px-3.5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Hero Slide</span>
            </button>
          </div>

          {/* Slides List */}
          <div className="space-y-4 pt-2">
            {heroSlides.length === 0 ? (
              <div className="py-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-500 text-xs">
                No hero slides configured. Click "Add New Hero Slide" to create your first banner.
              </div>
            ) : (
              heroSlides.map((slide, idx) => (
              <div
                key={slide.id}
                className="bg-stone-50/70 rounded-xl border border-stone-200 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
              >
                {/* Thumbnails (Desktop + Mobile) */}
                <div className="flex items-center gap-3">
                  <div className="relative w-36 h-18 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                    <img
                      src={slide.desktopImage}
                      alt="Desktop Banner"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                      1920×700
                    </span>
                  </div>

                  {slide.mobileImage && (
                    <div className="relative w-12 h-18 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shrink-0 hidden sm:block">
                      <img
                        src={slide.mobileImage}
                        alt="Mobile Banner"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] px-0.5 rounded font-mono">
                        Mob
                      </span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-stone-400 text-xs font-bold">#{slide.order}</span>
                      <h4 className="font-serif font-bold text-slate-900 text-sm truncate">
                        {slide.titleEn}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase ${
                          slide.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {slide.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {slide.subtitleEn}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-stone-400 mt-1">
                      <span>CTA: "{slide.ctaTextEn}"</span>
                      <span>Target: #{slide.ctaLink}</span>
                    </div>
                  </div>
                </div>

                {/* Actions & Reordering */}
                <div className="flex items-center justify-end gap-1.5 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                  <button
                    onClick={() => handleMoveSlide(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-200"
                    title="Move Slide Earlier"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleMoveSlide(idx, 'down')}
                    disabled={idx === heroSlides.length - 1}
                    className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-200"
                    title="Move Slide Later"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenEditSlide(slide)}
                    className="p-1.5 text-stone-600 hover:text-amber-900 rounded hover:bg-amber-100/50"
                    title="Edit Slide Content & Images"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-700 rounded hover:bg-rose-50"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* TAB 3: SECTION LAYOUT & ORDERING */}
      {activeTab === 'sections' && (
        <div className="bg-white p-6 rounded-b-xl rounded-tr-xl border border-[#E2DBD0] shadow-2xs space-y-6 text-xs">
          <div>
            <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
              Homepage Section Visibility & Sequence
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Reorder or hide sections on the live storefront. The customer homepage renders in this exact top-to-bottom sequence.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                  section.isVisible
                    ? 'bg-stone-50/70 border-stone-200'
                    : 'bg-stone-100/40 border-stone-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-900/10 text-amber-900 font-mono text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">{section.label}</span>
                    <span className="text-[10px] text-stone-400 font-mono">id: {section.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSectionVisibility(section.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      section.isVisible
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {section.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{section.isVisible ? 'Visible' : 'Hidden'}</span>
                  </button>

                  <div className="flex items-center gap-0.5 border-l border-stone-200 pl-2">
                    <button
                      onClick={() => handleMoveSection(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-200 cursor-pointer"
                      title="Move Section Higher"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-200 cursor-pointer"
                      title="Move Section Lower"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROMOTIONAL WIDE BANNER */}
      {activeTab === 'promo' && (
        <form onSubmit={handleSavePromo} className="bg-white p-6 rounded-b-xl rounded-tr-xl border border-[#E2DBD0] shadow-2xs space-y-6 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
                Full-Width Promotional Banner
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Highlight special festive discounts, wedding trousseau offers, and optional countdown timer.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={promoBanner.isActive}
                onChange={(e) => setPromoBanner({ ...promoBanner, isActive: e.target.checked })}
                className="w-4 h-4 text-amber-900 rounded"
              />
              <span>Banner Active</span>
            </label>
          </div>

          {/* Image Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Desktop Banner Image */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800">Desktop Banner (1600 × 600 px)</span>
              </div>
              <div className="h-28 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center">
                <img
                  src={promoBanner.desktopImage}
                  alt="Desktop Promo"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  openMediaPicker(
                    'promoDesktop',
                    'promotions',
                    'Select Desktop Promotional Banner',
                    'Recommended: 1600 × 600 px, high quality WebP/JPG'
                  )
                }
                className="w-full py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold text-center"
              >
                Change Desktop Image
              </button>
            </div>

            {/* Mobile Banner Image */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800">Mobile Banner (1080 × 900 px)</span>
              </div>
              <div className="h-28 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center">
                <img
                  src={promoBanner.mobileImage || promoBanner.desktopImage}
                  alt="Mobile Promo"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  openMediaPicker(
                    'promoMobile',
                    'promotions',
                    'Select Mobile Promotional Banner',
                    'Recommended: 1080 × 900 px, 6:5 aspect ratio'
                  )
                }
                className="w-full py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold text-center"
              >
                Change Mobile Image
              </button>
            </div>
          </div>

          {/* Copy Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Headline (English)</label>
              <input
                type="text"
                value={promoBanner.titleEn}
                onChange={(e) => setPromoBanner({ ...promoBanner, titleEn: e.target.value })}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Headline (தமிழ்)</label>
              <input
                type="text"
                value={promoBanner.titleTa}
                onChange={(e) => setPromoBanner({ ...promoBanner, titleTa: e.target.value })}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Subtitle / Offer Description (EN)</label>
              <textarea
                rows={2}
                value={promoBanner.subtitleEn}
                onChange={(e) => setPromoBanner({ ...promoBanner, subtitleEn: e.target.value })}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Subtitle / Offer Description (தமிழ்)</label>
              <textarea
                rows={2}
                value={promoBanner.subtitleTa}
                onChange={(e) => setPromoBanner({ ...promoBanner, subtitleTa: e.target.value })}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Button CTA Text</label>
              <input
                type="text"
                value={promoBanner.ctaTextEn}
                onChange={(e) => setPromoBanner({ ...promoBanner, ctaTextEn: e.target.value })}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Button CTA Link / Category</label>
              <input
                type="text"
                value={promoBanner.ctaLink}
                onChange={(e) => setPromoBanner({ ...promoBanner, ctaLink: e.target.value })}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Countdown End Date (Optional)</label>
              <input
                type="datetime-local"
                value={promoBanner.countdownDate ? promoBanner.countdownDate.substring(0, 16) : ''}
                onChange={(e) =>
                  setPromoBanner({
                    ...promoBanner,
                    countdownDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Promotional Banner</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: FEATURED & NEW ARRIVALS CURATION */}
      {activeTab === 'featured' && (
        <div className="bg-white p-6 rounded-b-xl rounded-tr-xl border border-[#E2DBD0] shadow-2xs space-y-6 text-xs">
          <div>
            <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
              Featured Collection & New Arrivals Carousel Curation
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Toggle products to dynamically feature them in the homepage horizontal carousels.
            </p>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Fabric</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-center">Featured Carousel</th>
                  <th className="py-2.5 px-3 text-center">New Arrival Carousel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {allProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/20">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0]}
                          alt={p.nameEn}
                          className="w-10 h-12 object-cover rounded bg-stone-100"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block truncate max-w-xs">
                            {p.nameEn}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">{p.sku}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-stone-600">{p.fabric}</td>

                    <td className="py-2.5 px-3 text-right font-serif font-bold text-slate-900 tabular-nums">
                      ₹{p.finalPrice.toLocaleString()}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleFeatured(p.id)}
                        className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          p.isFeatured
                            ? 'bg-amber-900 text-white shadow-xs'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {p.isFeatured ? '★ Featured' : 'Not Featured'}
                      </button>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleNewArrival(p.id)}
                        className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          p.isNewArrival
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {p.isNewArrival ? '✓ New Arrival' : 'Standard'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Hero Slide Modal */}
      {isSlideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-serif text-base font-bold text-slate-900">
                {editingSlide ? 'Edit Hero Banner Slide' : 'Add New Hero Banner Slide'}
              </h3>
              <button
                onClick={() => setIsSlideModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-4">
              {/* Desktop & Mobile Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <span className="font-semibold text-stone-800 block">Desktop Banner (1920 × 700 px) *</span>
                  <div className="h-24 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 flex items-center justify-center">
                    {slideFormData.desktopImage ? (
                      <img
                        src={slideFormData.desktopImage}
                        alt="Desktop"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-stone-400">No image selected</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openMediaPicker(
                        'slideDesktop',
                        'hero',
                        'Select Desktop Hero Banner',
                        'Recommended: 1920 × 700 px, high quality WebP/JPG'
                      )
                    }
                    className="w-full py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold"
                  >
                    Select Desktop Image
                  </button>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <span className="font-semibold text-stone-800 block">Mobile Banner (1080 × 1350 px)</span>
                  <div className="h-24 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 flex items-center justify-center">
                    {slideFormData.mobileImage ? (
                      <img
                        src={slideFormData.mobileImage}
                        alt="Mobile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-stone-400">Falls back to desktop</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openMediaPicker(
                        'slideMobile',
                        'hero',
                        'Select Mobile Hero Banner',
                        'Recommended: 1080 × 1350 px, vertical mobile aspect ratio'
                      )
                    }
                    className="w-full py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold"
                  >
                    Select Mobile Image
                  </button>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Headline (English) *</label>
                  <input
                    type="text"
                    required
                    value={slideFormData.titleEn || ''}
                    onChange={(e) => setSlideFormData({ ...slideFormData, titleEn: e.target.value })}
                    placeholder="e.g. Pure Kanchipuram Silks"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Headline (தமிழ்)</label>
                  <input
                    type="text"
                    value={slideFormData.titleTa || ''}
                    onChange={(e) => setSlideFormData({ ...slideFormData, titleTa: e.target.value })}
                    placeholder="e.g. தூய காஞ்சிபுரம் பட்டு"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Subtitle (English)</label>
                  <textarea
                    rows={2}
                    value={slideFormData.subtitleEn || ''}
                    onChange={(e) => setSlideFormData({ ...slideFormData, subtitleEn: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Subtitle (தமிழ்)</label>
                  <textarea
                    rows={2}
                    value={slideFormData.subtitleTa || ''}
                    onChange={(e) => setSlideFormData({ ...slideFormData, subtitleTa: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Button CTA Text</label>
                  <input
                    type="text"
                    value={slideFormData.ctaTextEn || ''}
                    onChange={(e) => setSlideFormData({ ...slideFormData, ctaTextEn: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Target Category / Link</label>
                  <input
                    type="text"
                    value={slideFormData.ctaLink || ''}
                    onChange={(e) => setSlideFormData({ ...slideFormData, ctaLink: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Active Status</label>
                  <select
                    value={slideFormData.isActive ? 'true' : 'false'}
                    onChange={(e) =>
                      setSlideFormData({ ...slideFormData, isActive: e.target.value === 'true' })
                    }
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-white"
                  >
                    <option value="true">Active in Carousel</option>
                    <option value="false">Disabled / Draft</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSlideModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg font-semibold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Media Selector Modal */}
      {mediaTarget && (
        <MediaUploadModal
          isOpen={mediaModalOpen}
          onClose={() => setMediaModalOpen(false)}
          onSelectImage={handleMediaSelected}
          category={mediaTarget.category}
          title={mediaTarget.title}
          aspectRatioNote={mediaTarget.aspectRatioNote}
        />
      )}
    </div>
  );
};

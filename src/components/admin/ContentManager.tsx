import React, { useState, useRef, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import {
  StoreSettings,
  Banner,
  FooterConfig,
  FooterColumn,
  FooterLinkItem,
  BankDetails,
  UpiDetails,
  ShippingRules,
} from '../../types';
import {
  Megaphone,
  Save,
  Truck,
  Image as ImageIcon,
  Sparkles,
  QrCode,
  Building2,
  Columns,
  Plus,
  Trash2,
  Check,
  Upload,
  Globe,
  Share2,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Clock,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  Eye,
  Loader2,
} from 'lucide-react';

export const ContentManager: React.FC = () => {
  const { showToast, refreshData } = useShop();

  const [settings, setSettings] = useState<StoreSettings>(() => StorageService.getSettings());
  const [banners, setBanners] = useState<Banner[]>(() => StorageService.getBanners());

  // Hidden file input for QR code image upload
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  // 1. Payment Gateway & Bank Account State
  const [upiId, setUpiId] = useState(settings.upiDetails?.upiId || 'nirai@upi');
  const [merchantName, setMerchantName] = useState(
    settings.upiDetails?.merchantName || 'Nirai Traditional Ethnic Apparel'
  );
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState(
    settings.upiDetails?.qrCodeImageUrl || ''
  );
  const [qrCodeNote, setQrCodeNote] = useState(
    settings.upiDetails?.qrCodeNote || 'Scan & Pay with GPay, PhonePe or Paytm'
  );

  const [bankAccountName, setBankAccountName] = useState(
    settings.bankDetails?.accountName || 'NIRAI TRADITIONAL WEAR'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    settings.bankDetails?.accountNumber || '50200088992211'
  );
  const [bankName, setBankName] = useState(
    settings.bankDetails?.bankName || 'HDFC Bank Ltd'
  );
  const [bankIfscCode, setBankIfscCode] = useState(
    settings.bankDetails?.ifscCode || 'HDFC0001244'
  );
  const [bankBranch, setBankBranch] = useState(
    settings.bankDetails?.branch || 'Cathedral Road, Chennai'
  );
  const [paymentDeadlineHours, setPaymentDeadlineHours] = useState(24);
  const [codEnabled, setCodEnabled] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Emergency Maintenance Mode / Killswitch State
  const [checkoutEnabled, setCheckoutEnabled] = useState<boolean>(settings.checkoutEnabled !== false);
  const [maintenanceMessageEn, setMaintenanceMessageEn] = useState<string>(
    settings.maintenanceMessageEn || 'Checkout is temporarily paused for scheduled inventory maintenance. Please check back shortly.'
  );
  const [maintenanceMessageTa, setMaintenanceMessageTa] = useState<string>(
    settings.maintenanceMessageTa || 'பராமரிப்பு பணி காரணமாக செக்அவுட் தற்காலிகமாக நிறுத்தப்பட்டுள்ளது. விரைவில் மீண்டும் முயற்சிக்கவும்.'
  );

  // Fetch payment settings from Supabase payment_settings table
  useEffect(() => {
    StorageService.getPaymentSettings().then((ps) => {
      if (ps) {
        if (ps.upiId) setUpiId(ps.upiId);
        if (ps.payeeName) setMerchantName(ps.payeeName);
        if (ps.accountName) setBankAccountName(ps.accountName);
        if (ps.accountNumber) setBankAccountNumber(ps.accountNumber);
        if (ps.ifscCode) setBankIfscCode(ps.ifscCode);
        if (ps.bankName) setBankName(ps.bankName);
        if (ps.branch) setBankBranch(ps.branch);
        if (ps.qrImagePath) setQrCodeImageUrl(ps.qrImagePath);
        if (ps.paymentDeadlineHours) setPaymentDeadlineHours(ps.paymentDeadlineHours);
        if (typeof ps.codEnabled === 'boolean') setCodEnabled(ps.codEnabled);
      }
    });
  }, []);

  // 2. Footer Manager State
  const initialFooter: FooterConfig = settings.footerConfig || {
    brandAboutEn:
      'Nirai is a direct handloom production house manufacturing authentic South Indian clothing for all generations — specialising in signature Kanchipuram silk & Chettinad cotton sarees alongside traditional vestis and family apparel.',
    brandAboutTa:
      'நிறை அரசு தென்னிந்திய கைத்தறி தயாரிப்பகம் — அனைத்து வகை பாரம்பரிய ஆடைகளுடன், குறிப்பாக காஞ்சி பட்டு மற்றும் செட்டிநாடு பருத்தி சேலைகள் தயாரிப்பில் சிறப்பு பெற்றது.',
    addressEn: '10 Cathedral Road, Chennai, Tamil Nadu - 600086',
    addressTa: '10 கத்தீட்ரல் சாலை, சென்னை, தமிழ்நாடு - 600086',
    columns: [
      {
        id: 'col-1',
        titleEn: 'Shop Collections',
        titleTa: 'ஆடைத் தொகுப்புகள்',
        links: [
          { id: 'lnk-1', labelEn: 'All Handloom Apparel', labelTa: 'அனைத்து ஆடைகள்', url: 'catalog' },
          { id: 'lnk-2', labelEn: 'Kanchipuram Silk Sarees', labelTa: 'காஞ்சிபுரம் பட்டு சேலைகள்', url: 'cat-sarees' },
          { id: 'lnk-3', labelEn: 'Chettinad Cotton Sarees', labelTa: 'செட்டிநாடு பருத்தி சேலைகள்', url: 'cat-cotton' },
          { id: 'lnk-4', labelEn: 'Salem Royal Double Vestis', labelTa: 'சேலம் இரட்டை வேஷ்டிகள்', url: 'cat-vesti' },
        ],
      },
      {
        id: 'col-2',
        titleEn: 'Customer Care',
        titleTa: 'வாடிக்கையாளர் சேவை',
        links: [
          { id: 'lnk-5', labelEn: 'Contact Support', labelTa: 'தொடர்பு கொள்ள', url: 'contact' },
          { id: 'lnk-6', labelEn: 'FAQ & Help Desk', labelTa: 'கேள்வி பதில்கள்', url: 'faq' },
          { id: 'lnk-7', labelEn: 'Shipping & Delivery', labelTa: 'டெலிவரி கொள்கை', url: 'shipping-policy' },
          { id: 'lnk-8', labelEn: '7-Day Return & Exchange', labelTa: '7-நாள் திரும்பப்பெறும் வாய்ப்பு', url: 'return-policy' },
          { id: 'lnk-9', labelEn: 'Refund Policy', labelTa: 'பணம் திரும்பப் பெறும் கொள்கை', url: 'refund-policy' },
          { id: 'lnk-10', labelEn: 'Cancellation Policy', labelTa: 'ரத்து செய்யும் கொள்கை', url: 'cancellation-policy' },
        ],
      },
      {
        id: 'col-3',
        titleEn: 'About Nirai',
        titleTa: 'நிறை பற்றி',
        links: [
          { id: 'lnk-11', labelEn: 'About Our Brand', labelTa: 'எங்களைப் பற்றி', url: 'about' },
          { id: 'lnk-12', labelEn: 'Contact Flagship Store', labelTa: 'கடை முகவரி', url: 'contact' },
          { id: 'lnk-13', labelEn: 'Privacy Policy & Security', labelTa: 'தனியுரிமைக் கொள்கை', url: 'privacy-policy' },
          { id: 'lnk-14', labelEn: 'Terms & Conditions', labelTa: 'விற்பனை மற்றும் நிபந்தனைகள்', url: 'terms-conditions' },
        ],
      },
    ],
    social: {
      showSocialIcons: true,
      instagramUrl: 'https://instagram.com',
      facebookUrl: 'https://facebook.com',
      twitterUrl: 'https://twitter.com',
      whatsappUrl: 'https://whatsapp.com',
    },
    copyrightEn: '© 2026 NIRAI Handlooms & Apparel. All rights reserved',
    copyrightTa: '© 2026 நிறை ஹேண்ட்லூம்ஸ் & அப்பேரல். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை',
  };

  const [footerAboutEn, setFooterAboutEn] = useState(initialFooter.brandAboutEn);
  const [footerAboutTa, setFooterAboutTa] = useState(initialFooter.brandAboutTa);
  const [footerAddressEn, setFooterAddressEn] = useState(initialFooter.addressEn);
  const [footerAddressTa, setFooterAddressTa] = useState(initialFooter.addressTa);
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>(initialFooter.columns);

  const [showSocialIcons, setShowSocialIcons] = useState(initialFooter.social.showSocialIcons);
  const [instagramUrl, setInstagramUrl] = useState(initialFooter.social.instagramUrl);
  const [facebookUrl, setFacebookUrl] = useState(initialFooter.social.facebookUrl);
  const [twitterUrl, setTwitterUrl] = useState(initialFooter.social.twitterUrl);
  const [whatsappUrl, setWhatsappUrl] = useState(initialFooter.social.whatsappUrl);

  const [copyrightEn, setCopyrightEn] = useState(initialFooter.copyrightEn);
  const [copyrightTa, setCopyrightTa] = useState(initialFooter.copyrightTa);

  // 3. Regional Shipping Rates State
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    settings.freeShippingThreshold || 1500
  );
  const [tnStandard, setTnStandard] = useState(
    settings.shippingRules?.tamilNaduStandard ?? 60
  );
  const [indiaStandard, setIndiaStandard] = useState(
    settings.shippingRules?.indiaStandard ?? 120
  );
  const [tnExpress, setTnExpress] = useState(
    settings.shippingRules?.tamilNaduExpress ?? 149
  );
  const [indiaExpress, setIndiaExpress] = useState(
    settings.shippingRules?.indiaExpress ?? 249
  );

  // 4. Announcement Bar State
  const [announcementEn, setAnnouncementEn] = useState(
    settings.announcementEn ||
      '✨ Festive Heritage Collection: Free Express Delivery on orders above ₹1,500 | Signature Saree & Ethnic Collections'
  );
  const [announcementTa, setAnnouncementTa] = useState(
    settings.announcementTa ||
      '✨ சிறப்பு பாரம்பரியத் தொகுப்பு: ₹1,500-க்கு மேல் இலவச டெலிவரி | அசல் பட்டு மற்றும் பருத்தி உடைகள்'
  );
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(
    settings.isAnnouncementActive ?? true
  );

  // 5. Hero Banner State
  const heroBanner = banners[0] || {
    id: 'ban-1',
    titleEn: 'WHERE TRADITION FEELS COMPLETE',
    titleTa: 'பாரம்பரியம் முழுமை பெறும் இடம்',
    subtitleEn: 'Authentic South Indian Handloom Silks & Fine Ceremonial Vestis',
    subtitleTa: 'கைத்தறி பட்டுப் புடவைகள் மற்றும் திருமண வேஷ்டிகள்',
    badgeEn: 'Special Festive Collection',
    badgeTa: 'சிறப்பு பண்டிகை தொகுப்பு',
    ctaTextEn: 'Explore Handlooms',
    ctaTextTa: 'ஆடைகளைத் தேடுங்கள்',
    ctaLink: '#catalog',
    imageUrl:
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=80',
    isActive: true,
    position: 'hero' as const,
  };

  const [heroTitleEn, setHeroTitleEn] = useState(heroBanner.titleEn);
  const [heroTitleTa, setHeroTitleTa] = useState(heroBanner.titleTa);
  const [heroSubEn, setHeroSubEn] = useState(heroBanner.subtitleEn);
  const [heroSubTa, setHeroSubTa] = useState(heroBanner.subtitleTa);
  const [heroImage, setHeroImage] = useState(heroBanner.imageUrl);

  // 6. Customer Care Support State
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone || '+91 94432 11098');
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || 'care@nirai.in');

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Handlers for Footer Columns & Links ---
  const handleAddFooterColumn = () => {
    const newCol: FooterColumn = {
      id: `col-${Date.now()}`,
      titleEn: `New Column`,
      titleTa: `புதிய பகுதி`,
      links: [
        {
          id: `lnk-${Date.now()}`,
          labelEn: 'Page Link',
          labelTa: 'பக்க இணைப்பு',
          url: 'catalog',
        },
      ],
    };
    setFooterColumns([...footerColumns, newCol]);
  };

  const handleRemoveFooterColumn = (colId: string) => {
    setFooterColumns(footerColumns.filter((c) => c.id !== colId));
  };

  const handleUpdateColumnTitle = (
    colId: string,
    field: 'titleEn' | 'titleTa',
    value: string
  ) => {
    setFooterColumns(
      footerColumns.map((c) => (c.id === colId ? { ...c, [field]: value } : c))
    );
  };

  const handleAddLinkToColumn = (colId: string) => {
    const newLink: FooterLinkItem = {
      id: `lnk-${Date.now()}`,
      labelEn: '',
      labelTa: '',
      url: '',
    };
    setFooterColumns(
      footerColumns.map((col) =>
        col.id === colId ? { ...col, links: [...col.links, newLink] } : col
      )
    );
  };

  const handleUpdateLink = (
    colId: string,
    linkId: string,
    field: 'labelEn' | 'labelTa' | 'url',
    value: string
  ) => {
    setFooterColumns(
      footerColumns.map((col) => {
        if (col.id !== colId) return col;
        return {
          ...col,
          links: col.links.map((lnk) =>
            lnk.id === linkId ? { ...lnk, [field]: value } : lnk
          ),
        };
      })
    );
  };

  const handleRemoveLink = (colId: string, linkId: string) => {
    setFooterColumns(
      footerColumns.map((col) => {
        if (col.id !== colId) return col;
        return {
          ...col,
          links: col.links.filter((lnk) => lnk.id !== linkId),
        };
      })
    );
  };

  // QR Code Image Upload Handler (uploads to payment-qr bucket)
  const handleQrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    setIsUploadingQr(true);
    try {
      const res = await StorageService.uploadPaymentQrImage(file);
      if (res.success && res.publicUrl) {
        setQrCodeImageUrl(res.publicUrl);
        showToast('Static QR Code uploaded to payment-qr bucket successfully!', 'success');
      } else {
        showToast(res.error || 'Failed to upload QR image to bucket', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error uploading QR Code', 'error');
    } finally {
      setIsUploadingQr(false);
    }
  };

  // Main Form Submit Handler
  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate UPI ID
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId.trim())) {
      showToast('Invalid UPI ID format. Expected format: name@bank (e.g. nirai@upi)', 'error');
      return;
    }

    // 2. Validate Bank IFSC
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(bankIfscCode.trim().toUpperCase())) {
      showToast('Invalid IFSC format. Expected 11 uppercase alphanumeric characters (e.g. HDFC0001244)', 'error');
      return;
    }

    // 3. Validate Bank Account Number
    const accountNumRegex = /^\d{8,18}$/;
    if (!accountNumRegex.test(bankAccountNumber.trim())) {
      showToast('Invalid Account Number. Must be 8 to 18 digits numeric.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save directly to the single-row payment_settings Supabase table (admin RLS protected)
      const payRes = await StorageService.savePaymentSettings({
        upiId: upiId.trim(),
        payeeName: merchantName.trim(),
        accountName: bankAccountName.trim(),
        accountNumber: bankAccountNumber.trim(),
        ifscCode: bankIfscCode.trim().toUpperCase(),
        bankName: bankName.trim(),
        branch: bankBranch.trim(),
        qrImagePath: qrCodeImageUrl.trim(),
        paymentDeadlineHours: Math.max(1, Number(paymentDeadlineHours) || 24),
        codEnabled: Boolean(codEnabled),
      });

      if (!payRes.success) {
        showToast(payRes.error || 'Failed to save payment settings to database', 'error');
        setIsSubmitting(false);
        return;
      }

      const updatedFooterConfig: FooterConfig = {
        brandAboutEn: footerAboutEn,
        brandAboutTa: footerAboutTa,
        addressEn: footerAddressEn,
        addressTa: footerAddressTa,
        columns: footerColumns,
        social: {
          showSocialIcons,
          instagramUrl,
          facebookUrl,
          twitterUrl,
          whatsappUrl,
        },
        copyrightEn,
        copyrightTa,
      };

      const updatedBankDetails: BankDetails = {
        bankName,
        accountName: bankAccountName,
        accountNumber: bankAccountNumber,
        ifscCode: bankIfscCode,
        branch: bankBranch,
      };

      const updatedUpiDetails: UpiDetails = {
        upiId: upiId.trim(),
        merchantName: merchantName.trim(),
        qrCodeNote: qrCodeNote.trim(),
        qrCodeImageUrl: qrCodeImageUrl.trim(),
      };

      const updatedShippingRules: ShippingRules = {
        tamilNaduStandard: Number(tnStandard),
        tamilNaduExpress: Number(tnExpress),
        indiaStandard: Number(indiaStandard),
        indiaExpress: Number(indiaExpress),
      };

      const updatedSettings: StoreSettings = {
        ...settings,
        freeShippingThreshold: Number(freeShippingThreshold),
        standardShippingFee: Number(indiaStandard),
        shippingRules: updatedShippingRules,
        bankDetails: updatedBankDetails,
        upiDetails: updatedUpiDetails,
        footerConfig: updatedFooterConfig,
        announcementEn,
        announcementTa,
        isAnnouncementActive,
        supportPhone,
        supportEmail,
        checkoutEnabled,
        maintenanceMessageEn,
        maintenanceMessageTa,
      };

      // Save Store Settings
      StorageService.saveSettings(updatedSettings);
      setSettings(updatedSettings);

      // Save Hero Showcase Banner
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
      showToast('Payment settings, bank details, and storefront configuration published successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to publish settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      <form onSubmit={handleSaveAllSettings} className="space-y-8 text-xs">
        {/* 0. EMERGENCY STORE MAINTENANCE & CHECKOUT KILLSWITCH */}
        <div className={`p-6 rounded-xl border transition-all ${checkoutEnabled ? 'bg-white border-[#E2DBD0]' : 'bg-rose-50/50 border-rose-300'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${checkoutEnabled ? 'bg-amber-900/10 border-amber-900/20 text-amber-900' : 'bg-rose-100 border-rose-300 text-rose-700'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Emergency Maintenance Mode &amp; Checkout Killswitch
                </h3>
                <p className="text-[11px] text-stone-500">
                  Instantly pause storefront orders while keeping catalog browsing active.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={checkoutEnabled}
                onChange={(e) => setCheckoutEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-rose-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-3 text-xs font-bold text-slate-900">
                {checkoutEnabled ? 'Checkout Active' : 'Checkout Disabled'}
              </span>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Maintenance Banner Message (English)
              </label>
              <textarea
                rows={2}
                value={maintenanceMessageEn}
                onChange={(e) => setMaintenanceMessageEn(e.target.value)}
                disabled={checkoutEnabled}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-600 disabled:bg-stone-50 disabled:text-stone-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                பராமரிப்பு அறிவிப்பு (Tamil)
              </label>
              <textarea
                rows={2}
                value={maintenanceMessageTa}
                onChange={(e) => setMaintenanceMessageTa(e.target.value)}
                disabled={checkoutEnabled}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-600 disabled:bg-stone-50 disabled:text-stone-400"
              />
            </div>
          </div>
        </div>

        {/* 1. MERCHANT PAYMENT GATEWAY, UPI QR CODE & BANK ACCOUNT SETUP */}
        <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-900/10 border border-amber-900/20 text-amber-900 flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm font-bold text-amber-950 uppercase tracking-wider">
                Merchant Payment Gateway, UPI QR Code & Bank Account Setup
              </h3>
            </div>

            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Checkout Integration</span>
            </span>
          </div>

          <p className="text-[11px] text-stone-500 leading-relaxed -mt-2">
            Configure your store&apos;s UPI VPA, Merchant Name, Cloudinary QR Code Image, and Direct Bank Transfer account numbers shown to customers on Checkout.
          </p>

          {/* UPI ID & Merchant Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Merchant UPI VPA ID
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-xs">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="nirai@upi"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-stone-300 rounded-lg font-mono text-xs focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Merchant Business / Account Name
              </label>
              <input
                type="text"
                required
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Nirai Traditional Ethnic Apparel"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* UPI QR Code Image Setup */}
          <div className="space-y-2">
            <label className="block font-semibold text-stone-700">
              UPI Payments QR Code Image
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl">
              {/* QR Preview Box */}
              <div className="w-24 h-24 rounded-lg border border-stone-300 bg-white flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-2xs">
                {qrCodeImageUrl ? (
                  <img
                    src={qrCodeImageUrl}
                    alt="Store UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-1 text-[10px] text-stone-400 leading-tight">
                    <QrCode className="w-6 h-6 mx-auto mb-1 text-stone-300" />
                    <span>No Custom QR Image Uploaded</span>
                  </div>
                )}
              </div>

              {/* Upload & Direct URL Controls */}
              <div className="flex-1 space-y-2.5 w-full">
                <input
                  type="text"
                  value={qrCodeImageUrl}
                  onChange={(e) => setQrCodeImageUrl(e.target.value)}
                  placeholder="Paste direct image URL or upload below..."
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-600"
                />

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={qrFileInputRef}
                    accept="image/*"
                    onChange={handleQrImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => qrFileInputRef.current?.click()}
                    className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Code Image</span>
                  </button>

                  {qrCodeImageUrl && (
                    <button
                      type="button"
                      onClick={() => setQrCodeImageUrl('')}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove Custom QR
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Direct Bank Transfer Details */}
          <div className="pt-3 border-t border-stone-100 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-900" />
              <h4 className="font-serif text-xs font-bold text-amber-950 uppercase tracking-wider">
                Direct Bank Transfer Details
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="NIRAI TRADITIONAL WEAR"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-semibold text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  required
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="50200088992211"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-mono text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="HDFC Bank Ltd"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    required
                    value={bankIfscCode}
                    onChange={(e) => setBankIfscCode(e.target.value)}
                    placeholder="HDFC0001244"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-mono text-xs focus:outline-none focus:border-amber-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Branch
                  </label>
                  <input
                    type="text"
                    required
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="Cathedral Road, Chennai"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Payment Expiry Deadline & Cash On Delivery Configuration */}
            <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-800" />
                  <span>Payment Window Deadline (Hours)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={paymentDeadlineHours}
                  onChange={(e) => setPaymentDeadlineHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-amber-600"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Default 24 hours. Orders in 'Awaiting Payment' past deadline are auto-expired and reserved stock is restored.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-800" />
                  <span>Cash on Delivery (COD)</span>
                </label>
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-stone-200 bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={codEnabled}
                    onChange={(e) => setCodEnabled(e.target.checked)}
                    className="mt-0.5 rounded text-amber-800 focus:ring-amber-800"
                  />
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-800 block">Allow COD Option at Checkout</span>
                    <span className="text-stone-500">
                      When disabled, customers must pay via UPI/Bank transfer and submit proof before orders are fulfilled.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* LIVE PREVIEW CARD */}
            <div className="pt-4 border-t border-stone-100 space-y-2">
              <div className="flex items-center gap-1.5 text-stone-700">
                <Eye className="w-4 h-4 text-amber-800" />
                <span className="font-serif font-bold text-xs uppercase tracking-wider text-slate-900">
                  Live Customer Checkout Preview (How it appears on /pay/:orderNumber)
                </span>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50/60 to-stone-100 rounded-xl border border-amber-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                      Payee / Merchant
                    </span>
                    <span className="font-serif font-bold text-slate-900 text-sm">
                      {merchantName || 'Nirai Traditional Ethnic Apparel'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-200/60 text-amber-950 font-mono font-bold rounded text-[11px]">
                      UPI: {upiId || 'nirai@upi'}
                    </span>
                    <span className="px-2 py-0.5 bg-stone-200/80 text-stone-700 font-mono text-[10px] rounded">
                      Deadline: {paymentDeadlineHours}h
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-white rounded-lg border border-amber-100 space-y-1">
                    <span className="font-bold text-stone-500 block text-[10px] uppercase">
                      Bank Account Number (Full)
                    </span>
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      {bankAccountNumber || '50200088992211'}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Holder: {bankAccountName || 'NIRAI TRADITIONAL WEAR'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-amber-100 space-y-1">
                    <span className="font-bold text-stone-500 block text-[10px] uppercase">
                      IFSC &amp; Branch
                    </span>
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      {bankIfscCode || 'HDFC0001244'}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {bankName || 'HDFC Bank Ltd'}, {bankBranch || 'Cathedral Road, Chennai'}
                    </p>
                  </div>
                </div>

                {qrCodeImageUrl && (
                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src={qrCodeImageUrl}
                      alt="Merchant QR"
                      className="w-12 h-12 object-contain bg-white rounded border border-stone-200 p-0.5 shrink-0"
                    />
                    <span className="text-[11px] text-stone-600">
                      ✓ Fallback static QR image configured and active.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. FOOTER CONTENT & EDITION MANAGER */}
        <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-900/10 border border-amber-900/20 text-amber-900 flex items-center justify-center shrink-0">
                <Columns className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm font-bold text-amber-950 uppercase tracking-wider">
                Footer Content & Edition Manager
              </h3>
            </div>

            <button
              type="button"
              onClick={handleAddFooterColumn}
              className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Footer Column</span>
            </button>
          </div>

          {/* Brand About Textareas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Footer Brand About (English)
              </label>
              <textarea
                rows={3}
                required
                value={footerAboutEn}
                onChange={(e) => setFooterAboutEn(e.target.value)}
                placeholder="About Nirai handlooms in English..."
                className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Footer Brand About (Tamil - தமிழ்)
              </label>
              <textarea
                rows={3}
                required
                value={footerAboutTa}
                onChange={(e) => setFooterAboutTa(e.target.value)}
                placeholder="நிறை கைத்தறி பற்றிய தமிழ் விளக்கம்..."
                className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 resize-none font-serif leading-relaxed"
              />
            </div>
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Address (English)
              </label>
              <input
                type="text"
                required
                value={footerAddressEn}
                onChange={(e) => setFooterAddressEn(e.target.value)}
                placeholder="10 Cathedral Road, Chennai, Tamil Nadu - 600086"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Address (Tamil)
              </label>
              <input
                type="text"
                required
                value={footerAddressTa}
                onChange={(e) => setFooterAddressTa(e.target.value)}
                placeholder="10 கத்தீட்ரல் சாலை, சென்னை, தமிழ்நாடு - 600086"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-serif focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Footer Navigation Columns */}
          <div className="space-y-4 pt-2">
            <h4 className="font-serif text-xs font-bold text-amber-950 uppercase tracking-wider">
              Footer Navigation Columns ({footerColumns.length})
            </h4>

            <div className="space-y-4">
              {footerColumns.map((col, cIdx) => (
                <div
                  key={col.id}
                  className="bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl p-4.5 space-y-4 shadow-2xs"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-900 text-white font-bold text-[10px] flex items-center justify-center">
                        {cIdx + 1}
                      </span>
                      <span className="font-serif font-bold text-slate-800 text-xs">
                        Column {cIdx + 1}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFooterColumn(col.id)}
                      className="text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Column</span>
                    </button>
                  </div>

                  {/* Column Titles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Column Title (English)
                      </label>
                      <input
                        type="text"
                        required
                        value={col.titleEn}
                        onChange={(e) =>
                          handleUpdateColumnTitle(col.id, 'titleEn', e.target.value)
                        }
                        placeholder="e.g. Shop Collections"
                        className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-md focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Column Title (Tamil)
                      </label>
                      <input
                        type="text"
                        required
                        value={col.titleTa}
                        onChange={(e) =>
                          handleUpdateColumnTitle(col.id, 'titleTa', e.target.value)
                        }
                        placeholder="e.g. ஆடைத் தொகுப்புகள்"
                        className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-md font-serif focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>

                  {/* Links in this Column */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-stone-600">
                        Links in this Column ({col.links.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddLinkToColumn(col.id)}
                        className="text-amber-900 hover:text-amber-950 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Link</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {col.links.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-2 bg-white p-2 rounded-lg border border-stone-200"
                        >
                          <input
                            type="text"
                            required
                            value={link.labelEn}
                            onChange={(e) =>
                              handleUpdateLink(col.id, link.id, 'labelEn', e.target.value)
                            }
                            placeholder="Link Title (English)"
                            className="flex-1 px-2.5 py-1 text-xs border border-stone-200 rounded focus:outline-none focus:border-amber-600"
                          />
                          <input
                            type="text"
                            required
                            value={link.labelTa}
                            onChange={(e) =>
                              handleUpdateLink(col.id, link.id, 'labelTa', e.target.value)
                            }
                            placeholder="இணைப்புப் பெயர் (தமிழ்)"
                            className="flex-1 px-2.5 py-1 text-xs border border-stone-200 rounded font-serif focus:outline-none focus:border-amber-600"
                          />
                          <input
                            type="text"
                            required
                            value={link.url}
                            onChange={(e) =>
                              handleUpdateLink(col.id, link.id, 'url', e.target.value)
                            }
                            placeholder="catalog or cat-sarees"
                            className="w-36 px-2.5 py-1 text-xs border border-stone-200 rounded font-mono focus:outline-none focus:border-amber-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(col.id, link.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                            title="Remove link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media Handles */}
          <div className="pt-3 border-t border-stone-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-900" />
                <h4 className="font-serif text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Social Media Handles
                </h4>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSocialIcons}
                  onChange={(e) => setShowSocialIcons(e.target.checked)}
                  className="w-4 h-4 accent-amber-900 rounded"
                />
                <span className="text-stone-700">Show Social Icons in Footer</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-md focus:outline-none focus:border-amber-600 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-md focus:outline-none focus:border-amber-600 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Twitter URL
                </label>
                <input
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-md focus:outline-none focus:border-amber-600 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  WhatsApp URL
                </label>
                <input
                  type="url"
                  value={whatsappUrl}
                  onChange={(e) => setWhatsappUrl(e.target.value)}
                  placeholder="https://whatsapp.com"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-md focus:outline-none focus:border-amber-600 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="pt-3 border-t border-stone-100 space-y-3">
            <h4 className="font-serif text-xs font-bold text-amber-950 uppercase tracking-wider">
              Copyright Notice Strip
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Copyright Bar (English)
                </label>
                <input
                  type="text"
                  required
                  value={copyrightEn}
                  onChange={(e) => setCopyrightEn(e.target.value)}
                  placeholder="© 2026 NIRAI Handlooms & Apparel. All rights reserved"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Copyright Bar (Tamil)
                </label>
                <input
                  type="text"
                  required
                  value={copyrightTa}
                  onChange={(e) => setCopyrightTa(e.target.value)}
                  placeholder="© 2026 நிறை ஹேண்ட்லூம்ஸ் & அப்பேரல். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg font-serif focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. REGIONAL SHIPPING COST & FREE DELIVERY CONTROL ENGINE */}
        <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-900" />
              <h3 className="font-serif text-sm font-bold text-amber-950 uppercase tracking-wider">
                Regional Shipping Cost & Free Delivery Control Engine
              </h3>
            </div>

            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Admin Shipping Rules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Free Delivery Threshold (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-600"
              />
              <span className="text-[10px] text-stone-500 block mt-1 leading-tight">
                Standard orders above this get FREE shipping
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Standard : Within TN (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={tnStandard}
                onChange={(e) => setTnStandard(Number(e.target.value))}
                className="w-full px-3 py-2 bg-emerald-50/30 border border-emerald-400 rounded-lg text-xs font-semibold text-emerald-900 focus:outline-none focus:border-emerald-600"
              />
              <span className="text-[10px] text-stone-500 block mt-1 leading-tight">
                Standard rate inside Tamil Nadu
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Standard : Outside TN (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={indiaStandard}
                onChange={(e) => setIndiaStandard(Number(e.target.value))}
                className="w-full px-3 py-2 bg-amber-50/30 border border-amber-400 rounded-lg text-xs font-semibold text-amber-900 focus:outline-none focus:border-amber-600"
              />
              <span className="text-[10px] text-stone-500 block mt-1 leading-tight">
                Standard rate in rest of India
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Express : Within TN (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={tnExpress}
                onChange={(e) => setTnExpress(Number(e.target.value))}
                className="w-full px-3 py-2 bg-purple-50/30 border border-purple-300 rounded-lg text-xs font-semibold text-purple-900 focus:outline-none focus:border-purple-600"
              />
              <span className="text-[10px] text-stone-500 block mt-1 leading-tight">
                Express 24-48h rate inside Tamil Nadu
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Express : Outside TN (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={indiaExpress}
                onChange={(e) => setIndiaExpress(Number(e.target.value))}
                className="w-full px-3 py-2 bg-blue-50/30 border border-blue-300 rounded-lg text-xs font-semibold text-blue-900 focus:outline-none focus:border-blue-600"
              />
              <span className="text-[10px] text-stone-500 block mt-1 leading-tight">
                Express 24-48h rate outside / rest of India
              </span>
            </div>
          </div>
        </div>

        {/* 4. TOP ANNOUNCEMENT BAR */}
        <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-900" />
              <h3 className="font-serif text-sm font-bold text-amber-950 uppercase tracking-wider">
                Top Announcement Bar
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncementActive}
                onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                className="w-4 h-4 accent-amber-900 rounded"
              />
              <span className="text-stone-700">Display on Storefront</span>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                English Announcement
              </label>
              <input
                type="text"
                required
                value={announcementEn}
                onChange={(e) => setAnnouncementEn(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Tamil Announcement (தமிழ் அறிவிப்பு)
              </label>
              <input
                type="text"
                required
                value={announcementTa}
                onChange={(e) => setAnnouncementTa(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-serif focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>
        </div>

        {/* 5. HOMEPAGE HERO SHOWCASE BANNER */}
        <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <ImageIcon className="w-4 h-4 text-amber-900" />
            <h3 className="font-serif text-sm font-bold text-amber-950 uppercase tracking-wider">
              Homepage Hero Showcase Banner
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                English Headline
              </label>
              <input
                type="text"
                required
                value={heroTitleEn}
                onChange={(e) => setHeroTitleEn(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-serif font-bold uppercase focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Tamil Headline (தமிழ் தலைப்பு)
              </label>
              <input
                type="text"
                required
                value={heroTitleTa}
                onChange={(e) => setHeroTitleTa(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-serif font-bold focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                English Subheadline
              </label>
              <textarea
                rows={2}
                required
                value={heroSubEn}
                onChange={(e) => setHeroSubEn(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Tamil Subheadline
              </label>
              <textarea
                rows={2}
                required
                value={heroSubTa}
                onChange={(e) => setHeroSubTa(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-lg font-serif focus:outline-none focus:border-amber-600 resize-none leading-relaxed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">
                Hero Showcase Image URL
              </label>
              <input
                type="url"
                required
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* 6. CUSTOMER CARE SUPPORT CHANNELS */}
        <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <Phone className="w-4 h-4 text-amber-900" />
            <h3 className="font-serif text-sm font-bold text-amber-950 uppercase tracking-wider">
              Customer Care Support Channels
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Support Phone
              </label>
              <input
                type="text"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+91 94432 11098"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-xs focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="care@nirai.in"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>
        </div>

        {/* 7. Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#78350F] hover:bg-[#682D0D] text-white font-semibold text-xs rounded-lg flex items-center gap-2 cursor-pointer shadow-md transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Publishing Changes...' : 'Publish Storefront Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

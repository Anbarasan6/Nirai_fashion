import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import {
  Heart,
  Mail,
  Truck,
  RotateCcw,
  RefreshCw,
  XCircle,
  ShieldCheck,
  FileText,
  HelpCircle,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Search,
  Sparkles,
  Award,
  Shield,
  ArrowRight,
  Package,
} from 'lucide-react';

export type PolicyTabId =
  | 'about'
  | 'contact'
  | 'shipping'
  | 'return'
  | 'refund'
  | 'cancellation'
  | 'privacy'
  | 'terms'
  | 'faq';

interface PoliciesPageProps {
  section?: string;
  defaultTab?: PolicyTabId;
}

export const PoliciesPage: React.FC<PoliciesPageProps> = ({
  section,
  defaultTab = 'about',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { storeSettings, showToast, language } = useShop();

  // Resolve current active tab from props or pathname
  const resolveTabFromPath = (): PolicyTabId => {
    const path = location.pathname.toLowerCase();
    if (section === 'shipping' || path.includes('shipping')) return 'shipping';
    if (section === 'refund' || path.includes('refund')) return 'refund';
    if (section === 'return' || path.includes('return')) return 'return';
    if (section === 'cancellation' || path.includes('cancellation')) return 'cancellation';
    if (section === 'privacy' || path.includes('privacy')) return 'privacy';
    if (section === 'terms' || path.includes('terms')) return 'terms';
    if (section === 'contact' || path.includes('contact')) return 'contact';
    if (section === 'faq' || path.includes('faq')) return 'faq';
    if (section === 'about' || path.includes('about')) return 'about';

    // Check query params (?tab=...)
    const params = new URLSearchParams(location.search);
    const qTab = params.get('tab') as PolicyTabId;
    if (
      qTab &&
      [
        'about',
        'contact',
        'shipping',
        'return',
        'refund',
        'cancellation',
        'privacy',
        'terms',
        'faq',
      ].includes(qTab)
    ) {
      return qTab;
    }

    return defaultTab;
  };

  const [activeTab, setActiveTab] = useState<PolicyTabId>(resolveTabFromPath);

  useEffect(() => {
    setActiveTab(resolveTabFromPath());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.search, section]);

  const handleTabChange = (tabId: PolicyTabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Map tabId to standard URL route
    const routeMap: Record<PolicyTabId, string> = {
      about: '/about',
      contact: '/contact',
      shipping: '/shipping-policy',
      return: '/return-policy',
      refund: '/refund-policy',
      cancellation: '/cancellation-policy',
      privacy: '/privacy-policy',
      terms: '/terms',
      faq: '/faq',
    };

    navigate(routeMap[tabId]);
  };

  // Nav menu items matching the screenshot
  const navItems: { id: PolicyTabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'about', label: 'About Nirai', icon: Heart },
    { id: 'contact', label: 'Contact Support', icon: Mail },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'return', label: '7-Day Return & Exchange', icon: RotateCcw },
    { id: 'refund', label: 'Refund Policy', icon: RefreshCw },
    { id: 'cancellation', label: 'Cancellation Policy', icon: XCircle },
    { id: 'privacy', label: 'Privacy Policy & Security', icon: ShieldCheck },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'faq', label: 'FAQ & Knowledge Base', icon: HelpCircle },
  ];

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactTopic, setContactTopic] = useState('Order & Shipping Status');
  const [contactOrderId, setContactOrderId] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isContactSubmitted, setIsContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      showToast('Please fill in your name, email, and message', 'error');
      return;
    }
    setIsContactSubmitted(true);
    showToast('Your message has been sent to our customer care team!', 'success');
  };

  // FAQ Accordion State
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqData = [
    {
      category: 'Orders & Direct UPI Payments',
      items: [
        {
          q: 'How does Direct UPI payment work on Nirai?',
          a: 'At checkout, select "UPI / QR Code Payment". You will see our official UPI ID (nirai@upi) and an instant QR code. After transferring via GPay, PhonePe, Paytm, or your banking app, simply enter your 12-digit UPI Reference / UTR Number in the provided box and submit. Your order is immediately registered and verified against our bank statement.',
        },
        {
          q: 'Where do I find my 12-digit UPI UTR number?',
          a: 'In GPay, PhonePe, or Paytm, open your transaction receipt. Look for "UPI Transaction ID", "UTR", or "Bank Reference Number" (a 12-digit numeric code starting with numbers like 4, 5, or 6). Copy and paste this into the checkout UTR field.',
        },
        {
          q: 'Why is Cash on Delivery (COD) not available?',
          a: 'To safeguard our handcrafted GI-tagged pure silks and maintain fair artisan wages without courier COD surcharges, we operate on direct UPI and bank transfers. We back every order with a 100% money-back guarantee and a 7-day return policy.',
        },
      ],
    },
    {
      category: 'Shipping & Delivery',
      items: [
        {
          q: 'What are the delivery charges and timelines?',
          a: `Standard Delivery is completely FREE for orders above ₹${storeSettings?.freeShippingThreshold || 1500}. Standard delivery takes 3 to 5 business days. Express Priority Delivery (24 to 48 hours) is available for ₹149 inside Tamil Nadu and ₹249 across rest of India.`,
        },
        {
          q: 'Which courier partners handle Nirai deliveries?',
          a: 'We dispatch exclusively through top-tier courier partners including BlueDart Express, Delhivery Logistics, DTDC Express, India Post Speed Post, and Professional Couriers with real-time tracking links sent directly via SMS and email.',
        },
        {
          q: 'How can I track my shipment?',
          a: 'Visit the "Track Your Order" page (/tracking) and enter your Nirai Order ID (e.g. NIR-88231). You will see live packaging status, assigned courier partner, AWB tracking ID, and direct portal tracking links.',
        },
      ],
    },
    {
      category: 'Authenticity & Handloom Craft',
      items: [
        {
          q: 'Are Nirai silk sarees certified authentic?',
          a: 'Yes. All Nirai Kanchipuram sarees are woven with 100% certified pure mulberry silk and authentic zari, crafted by master handloom guilds in Kanchipuram adhering to certified Geographical Indication (GI) heritage standards.',
        },
        {
          q: 'Why do pure handlooms have minor weave nuances?',
          a: 'Authentic pit loom weaving is done entirely by human hands without computer automation. Subtle nuances in thread tension, selvedge borders, or small slubs are natural hallmarks of authentic artisanal weaving, confirming it is not a printed mill machine replica.',
        },
      ],
    },
    {
      category: 'Returns, Exchanges & Care',
      items: [
        {
          q: 'What is the 7-day return policy?',
          a: 'If you receive a defective or damaged product, you can request an exchange or full refund within 7 days of delivery. We will arrange a free reverse pickup from your address.',
        },
        {
          q: 'How do I care for my Kanchipuram silk saree?',
          a: 'Pure silk sarees should only be dry cleaned. Store them wrapped in a clean, breathable cotton or muslin cloth in a cool, dry place. Avoid using plastic covers or direct naphthalene balls touching the gold zari.',
        },
      ],
    },
  ];

  const filteredFaqData = faqData
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
          item.a.toLowerCase().includes(faqSearch.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Main Grid: Sidebar Menu + Content Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar (Matching User Screenshot) */}
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-[#E5DFD3] p-3 shadow-2xs space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#78350F] text-white shadow-xs'
                        : 'text-stone-700 hover:text-amber-950 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-amber-200' : 'text-stone-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Contact Badge under Menu */}
            <div className="mt-4 p-4 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl text-xs text-stone-600 space-y-2 hidden lg:block">
              <span className="font-serif font-bold text-slate-900 block">
                Direct Helpdesk Support
              </span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Need urgent assistance with an ongoing order or bridal consultation?
              </p>
              <a
                href={`tel:${storeSettings?.supportPhone || '+919443211098'}`}
                className="font-mono font-bold text-amber-950 hover:underline block pt-1 text-xs"
              >
                {storeSettings?.supportPhone || '+91 94432 11098'}
              </a>
            </div>
          </aside>

          {/* Right Content Area */}
          <section className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* 1. ABOUT NIRAI */}
            {activeTab === 'about' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6">
                  <div className="space-y-2 border-b border-stone-100 pb-4">
                    <span className="text-[11px] uppercase tracking-widest text-amber-900 font-bold bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full inline-block">
                      Our Heritage & Craftsmanship
                    </span>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950">
                      Nirai — Where Tradition Feels Complete
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-serif pt-1">
                      Rooted in fourth-generation South Indian weaving traditions, Nirai brings authentic GI-tagged Kanchipuram Silks, Chettinad Cottons, and Salem Dhotis directly from artisan looms to discerning connoisseurs worldwide.
                    </p>
                  </div>

                  {/* Brand Value Pillars */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#EDE7DD] space-y-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-900/10 text-amber-900 flex items-center justify-center">
                        <Award className="w-5 h-5" />
                      </div>
                      <h3 className="font-serif font-bold text-slate-900 text-sm">
                        GI-Certified Authenticity
                      </h3>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Every pure silk weave carries the hallmark of certified Mulberry silk and pure gold zari, honoring certified GI master standards.
                      </p>
                    </div>

                    <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#EDE7DD] space-y-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-900/10 text-amber-900 flex items-center justify-center">
                        <Heart className="w-5 h-5" />
                      </div>
                      <h3 className="font-serif font-bold text-slate-900 text-sm">
                        Direct Weaver Empowerment
                      </h3>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        We eliminate intermediary middlemen, ensuring 100% fair artisan compensation directly to weaving families in Kanchipuram &amp; Salem.
                      </p>
                    </div>

                    <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#EDE7DD] space-y-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-900/10 text-amber-900 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h3 className="font-serif font-bold text-slate-900 text-sm">
                        Rigorous Handloom Audit
                      </h3>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Each warp and weft undergoes manual inspection for yarn count, fastness, and symmetrical border balance before dispatch.
                      </p>
                    </div>
                  </div>

                  {/* Artisan Story */}
                  <div className="bg-[#2D1619] text-amber-100 p-6 sm:p-8 rounded-2xl space-y-4">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                      The Handloom Legacy
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                      From Traditional Pit Looms to Modern Wardrobes
                    </h3>
                    <p className="text-xs text-amber-100/80 leading-relaxed">
                      A single authentic Kanchipuram silk saree requires 10 to 18 days of relentless dedication by two master artisans working synchronously on the warp and shuttle. By shopping at Nirai, you sustain centuries-old indigenous weaving techniques and ensure these priceless crafts thrive for future generations.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => navigate('/catalog')}
                        className="px-5 py-2.5 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                      >
                        <span>Explore Our Handloom Catalog</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CONTACT SUPPORT */}
            {activeTab === 'contact' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6">
                  <div className="border-b border-stone-100 pb-4 space-y-1">
                    <h1 className="font-serif text-2xl font-bold text-slate-900">
                      Contact Customer Support
                    </h1>
                    <p className="text-xs text-stone-500">
                      Have a query regarding product sizing, custom saree borders, or your ongoing order shipment? We are here to assist you.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Direct Support Details */}
                    <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#EDE7DD] space-y-3.5 text-xs">
                      <h3 className="font-serif font-bold text-slate-900 text-sm pb-1 border-b border-stone-200">
                        Direct Assistance Channels
                      </h3>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-900/10 text-amber-900 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">Phone Support</span>
                          <a
                            href={`tel:${storeSettings?.supportPhone || '+919443211098'}`}
                            className="text-stone-600 hover:text-amber-900 font-mono font-semibold"
                          >
                            {storeSettings?.supportPhone || '+91 94432 11098'}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-900/10 text-amber-900 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">Email Support Desk</span>
                          <a
                            href={`mailto:${storeSettings?.supportEmail || 'care@nirai.in'}`}
                            className="text-stone-600 hover:text-amber-900 font-semibold"
                          >
                            {storeSettings?.supportEmail || 'care@nirai.in'}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-900/10 text-amber-900 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">Flagship Address</span>
                          <p className="text-stone-600 text-[11px] leading-relaxed">
                            {storeSettings?.footerConfig?.addressEn ||
                              '10 Cathedral Road, Chennai, Tamil Nadu - 600086'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-900/10 text-amber-900 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">Operational Hours</span>
                          <p className="text-stone-600 text-[11px]">
                            Monday – Saturday: 9:30 AM to 7:30 PM IST
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Contact Form */}
                    <div className="bg-white p-5 rounded-xl border border-stone-200">
                      {isContactSubmitted ? (
                        <div className="text-center py-8 space-y-3">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <h4 className="font-serif font-bold text-slate-900 text-sm">
                            Inquiry Received!
                          </h4>
                          <p className="text-xs text-stone-600">
                            Our team will get back to you within 24 business hours.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsContactSubmitted(false);
                              setContactMessage('');
                            }}
                            className="text-xs text-amber-900 font-semibold hover:underline"
                          >
                            Send another inquiry
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
                          <div>
                            <label className="block font-semibold text-stone-700 mb-1">
                              Your Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              placeholder="e.g. Meenakshi Sundaram"
                              className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Email Address *
                              </label>
                              <input
                                type="email"
                                required
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="name@email.com"
                                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Phone Number
                              </label>
                              <input
                                type="text"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                placeholder="+91 "
                                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-stone-700 mb-1">
                              Inquiry Topic
                            </label>
                            <select
                              value={contactTopic}
                              onChange={(e) => setContactTopic(e.target.value)}
                              className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 bg-white"
                            >
                              <option>Order &amp; Shipping Status</option>
                              <option>UPI Payment &amp; UTR Verification</option>
                              <option>Custom Handloom Saree Query</option>
                              <option>7-Day Return / Exchange Request</option>
                              <option>Bulk / Wedding Order Consultation</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-stone-700 mb-1">
                              Message / Question *
                            </label>
                            <textarea
                              rows={3}
                              required
                              value={contactMessage}
                              onChange={(e) => setContactMessage(e.target.value)}
                              placeholder="How can we assist you today?"
                              className="w-full p-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 resize-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 bg-amber-900 hover:bg-amber-950 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Message</span>
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SHIPPING & DELIVERY */}
            {activeTab === 'shipping' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6 text-xs text-stone-700 leading-relaxed">
                  <div className="border-b border-stone-100 pb-4 space-y-1">
                    <h1 className="font-serif text-2xl font-bold text-slate-900">
                      Shipping &amp; Regional Delivery Policy
                    </h1>
                    <p className="text-xs text-stone-500">
                      Transparent shipping rates, premier courier partners, and live tracking updates.
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                      <span className="font-serif font-bold text-emerald-950 text-xs block">
                        Free Delivery Threshold
                      </span>
                      <p className="text-emerald-800 text-[11px]">
                        Orders above ₹{storeSettings?.freeShippingThreshold || 1500} qualify for 100% FREE Standard Shipping across India.
                      </p>
                    </div>

                    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
                      <span className="font-serif font-bold text-amber-950 text-xs block">
                        Standard Delivery
                      </span>
                      <p className="text-amber-800 text-[11px]">
                        Dispatched within 24 hours. Delivered to your doorstep in 3 to 5 business days.
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-1">
                      <span className="font-serif font-bold text-purple-950 text-xs block">
                        Priority Express (24-48h)
                      </span>
                      <p className="text-purple-800 text-[11px]">
                        Fast air shipping available for ₹149 (Inside TN) and ₹249 (Rest of India).
                      </p>
                    </div>
                  </div>

                  {/* Regional Rate Table */}
                  <div className="space-y-2 pt-2">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      Regional Shipping Rates Schedule
                    </h3>
                    <div className="overflow-x-auto border border-stone-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF8F5] text-stone-700 font-semibold border-b border-stone-200">
                          <tr>
                            <th className="py-2.5 px-4">Region</th>
                            <th className="py-2.5 px-4">Standard Delivery</th>
                            <th className="py-2.5 px-4">Express Priority (24-48h)</th>
                            <th className="py-2.5 px-4">Free Shipping Condition</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          <tr>
                            <td className="py-2.5 px-4 font-semibold text-slate-800">
                              Inside Tamil Nadu
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-emerald-800">
                              ₹{storeSettings?.shippingRules?.tamilNaduStandard ?? 60}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-purple-800">
                              ₹{storeSettings?.shippingRules?.tamilNaduExpress ?? 149}
                            </td>
                            <td className="py-2.5 px-4 text-stone-500">
                              Orders &ge; ₹{storeSettings?.freeShippingThreshold || 1500}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-semibold text-slate-800">
                              Outside Tamil Nadu (Rest of India)
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-amber-800">
                              ₹{storeSettings?.shippingRules?.indiaStandard ?? 120}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-blue-800">
                              ₹{storeSettings?.shippingRules?.indiaExpress ?? 249}
                            </td>
                            <td className="py-2.5 px-4 text-stone-500">
                              Orders &ge; ₹{storeSettings?.freeShippingThreshold || 1500}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Premier Courier Partners */}
                  <div className="space-y-2 pt-2">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      Our Premier Courier Partners
                    </h3>
                    <p className="text-stone-600 text-xs">
                      All Nirai orders are dispatched in tamper-evident, moisture-resistant packaging with direct tracking links provided upon dispatch:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-stone-600">
                      <li><strong>Blue Dart Express:</strong> Priority air partner for metro cities &amp; tier-1 state capitals.</li>
                      <li><strong>Delhivery Logistics:</strong> Comprehensive surface &amp; air network reaching 18,500+ postal pincodes.</li>
                      <li><strong>DTDC Express:</strong> Fast regional delivery across South India &amp; tier-2/3 towns.</li>
                      <li><strong>India Post Speed Post:</strong> Official government postal logistics reaching remote rural villages.</li>
                      <li><strong>Professional Couriers:</strong> Rapid Tamil Nadu &amp; South India hub distribution network.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 4. 7-DAY RETURN & EXCHANGE */}
            {activeTab === 'return' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6 text-xs text-stone-700 leading-relaxed">
                  <div className="border-b border-stone-100 pb-4 space-y-1">
                    <h1 className="font-serif text-2xl font-bold text-slate-900">
                      7-Day Return &amp; Exchange Guarantee
                    </h1>
                    <p className="text-xs text-stone-500">
                      Our customer satisfaction commitment to authentic handloom master craft.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      Hassle-Free Return Policy
                    </h3>
                    <p>
                      We inspect every handloom silk saree, dhotis, and cotton apparel with stringent artisan quality checks. However, if you receive a damaged, defectively woven, or incorrect item, you may request a replacement or return within <strong>7 calendar days</strong> of receiving your delivery.
                    </p>
                  </div>

                  {/* Step by step process */}
                  <div className="space-y-3 pt-2">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      How to Request a Return or Exchange
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl space-y-1.5">
                        <span className="w-6 h-6 rounded-full bg-amber-900 text-white font-bold text-[11px] flex items-center justify-center">
                          1
                        </span>
                        <h4 className="font-bold text-slate-900">Notify Us</h4>
                        <p className="text-[11px] text-stone-600">
                          Reach out to our customer care via WhatsApp or email with your Order ID and photos of the defective item.
                        </p>
                      </div>

                      <div className="p-4 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl space-y-1.5">
                        <span className="w-6 h-6 rounded-full bg-amber-900 text-white font-bold text-[11px] flex items-center justify-center">
                          2
                        </span>
                        <h4 className="font-bold text-slate-900">Free Reverse Pickup</h4>
                        <p className="text-[11px] text-stone-600">
                          We schedule our courier partner to collect the package from your doorstep without any reverse courier charge.
                        </p>
                      </div>

                      <div className="p-4 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl space-y-1.5">
                        <span className="w-6 h-6 rounded-full bg-amber-900 text-white font-bold text-[11px] flex items-center justify-center">
                          3
                        </span>
                        <h4 className="font-bold text-slate-900">Direct Refund / Swap</h4>
                        <p className="text-[11px] text-stone-600">
                          Once inspected, your replacement is dispatched immediately or full refund is credited back via UPI within 24–48 hours.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl space-y-2">
                    <span className="font-serif font-bold text-amber-950 text-xs block">
                      Conditions for Return Eligibility
                    </span>
                    <ul className="list-disc pl-5 space-y-1 text-stone-600 text-[11px]">
                      <li>Items must be unworn, unwashed, and unpleated in original folding condition.</li>
                      <li>Original Silk Mark tags, brand labels, and unstitched blouse fabric must remain intact.</li>
                      <li>Custom-stitched blouses or customized saree falls/pico services are non-returnable unless defective.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 5. REFUND POLICY */}
            {activeTab === 'refund' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6 text-xs text-stone-700 leading-relaxed">
                  <div className="border-b border-stone-100 pb-4 space-y-1">
                    <h1 className="font-serif text-2xl font-bold text-slate-900">
                      Direct UPI &amp; Bank Transfer Refund Policy
                    </h1>
                    <p className="text-xs text-stone-500">
                      Instant, transparent, and direct reimbursements without store wallet locks.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      100% Direct Money-Back Model
                    </h3>
                    <p>
                      Unlike platforms that force refunds into restrictive store credit wallets, Nirai processes all approved refunds directly to your source UPI VPA or Bank Account.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl space-y-2">
                      <h4 className="font-bold text-slate-900">UPI Payments (GPay / PhonePe / Paytm)</h4>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Refunds are credited directly to your original UPI VPA within <strong>24 to 48 hours</strong> of return inspection. You will receive the 12-digit UTR reference code via SMS and WhatsApp.
                      </p>
                    </div>

                    <div className="p-4 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl space-y-2">
                      <h4 className="font-bold text-slate-900">Direct Bank Transfers (NEFT / IMPS)</h4>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        For orders paid via direct bank transfer, our accounts team initiates an IMPS transfer back to your verified account within <strong>2 business days</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      Zero Cancellation Fees
                    </h3>
                    <p className="text-stone-600">
                      Nirai does not charge any processing fees or restocking charges for approved returns. You receive 100% of your paid amount.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. CANCELLATION POLICY */}
            {activeTab === 'cancellation' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6 text-xs text-stone-700 leading-relaxed">
                  <div className="border-b border-stone-100 pb-4 space-y-1">
                    <h1 className="font-serif text-2xl font-bold text-slate-900">
                      Order Cancellation Policy
                    </h1>
                    <p className="text-xs text-stone-500">
                      Clear cancellation windows before courier dispatch and custom tailoring.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      Pre-Dispatch Order Cancellation
                    </h3>
                    <p>
                      You can cancel your placed order anytime before it is handed over to our courier partner. To cancel:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-stone-600">
                      <li>Message our support team on WhatsApp or email <a href="mailto:care@nirai.in" className="text-amber-900 font-semibold underline">care@nirai.in</a> with your Order ID.</li>
                      <li>Upon cancellation, an immediate 100% refund is initiated back to your UPI/bank account.</li>
                    </ul>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      Post-Dispatch Cancellation
                    </h3>
                    <p>
                      If your order has already been handed to the courier partner and has an active AWB tracking code, the parcel cannot be recalled midway. In this case:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-stone-600">
                      <li>You may politely refuse acceptance at the time of courier doorstep delivery.</li>
                      <li>Once the package returns to our warehouse, your full refund will be processed within 24–48 hours.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl space-y-1 text-[11px]">
                    <span className="font-serif font-bold text-amber-950 block">
                      Custom Tailoring Cancellation Window
                    </span>
                    <p className="text-stone-600">
                      For orders including customized falls/pico or bespoke blouse stitching, cancellations are accepted within <strong>12 hours of order placement</strong>, before fabric cutting begins.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. PRIVACY POLICY & SECURITY */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6 text-xs text-stone-700 leading-relaxed">
                  <div className="border-b border-stone-100 pb-4 space-y-1">
                    <h1 className="font-serif text-2xl font-bold text-slate-900">
                      Privacy Policy &amp; Data Security
                    </h1>
                    <p className="text-xs text-stone-500">
                      Strict data protection protocols safeguarding customer contact &amp; transaction privacy.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      Our Privacy Pledge
                    </h3>
                    <p>
                      At Nirai, your personal data is treated with utmost reverence and confidentiality. We collect only essential details required to process, fulfill, and deliver your orders securely.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Shield className="w-4 h-4 text-amber-900" />
                        <h4>Zero Third-Party Advertising</h4>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        We never sell, rent, or lease customer phone numbers, delivery addresses, or purchase histories to marketing brokers or third-party ad networks.
                      </p>
                    </div>

                    <div className="p-4 bg-[#FAF8F5] border border-[#EBE5DC] rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <ShieldCheck className="w-4 h-4 text-amber-900" />
                        <h4>Direct Payment Isolation</h4>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        We do not collect or store debit/credit card CVVs, netbanking PINs, or UPI passwords. Payments occur directly within your trusted GPay/PhonePe/banking app.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      Data Retention &amp; Customer Rights
                    </h3>
                    <p className="text-stone-600">
                      You have full rights to request deletion of your saved customer profile, addresses, or order records from our systems at any time by contacting <a href="mailto:care@nirai.in" className="text-amber-900 font-semibold underline">care@nirai.in</a>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 8. TERMS & CONDITIONS */}
            {activeTab === 'terms' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6 text-xs text-stone-700 leading-relaxed">
                  <div className="border-b border-stone-100 pb-4 space-y-1">
                    <h1 className="font-serif text-2xl font-bold text-slate-900">
                      Terms of Service &amp; Conditions
                    </h1>
                    <p className="text-xs text-stone-500">
                      Legal guidelines governing orders, handloom characteristics, and platform usage.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      1. Genuine Handloom Character
                    </h3>
                    <p>
                      All silks, vestis, and cotton sarees offered on Nirai are handcrafted using traditional human-operated pit looms. Slight natural nuances in weaving density, selvedge knots, or hand-dyed shade variations are inherent hallmarks of master artisanal production and are not considered manufacturing defects.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      2. Direct Payment &amp; UTR Verification Model
                    </h3>
                    <p>
                      Orders placed with the "UPI / QR Code" option are confirmed upon reconciliation of the customer-provided 12-digit UTR reference number against our receiving bank records. Submitting invalid or counterfeit UTR reference numbers will result in automatic order cancellation.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      3. Pricing &amp; Handloom Inventory Availability
                    </h3>
                    <p>
                      Handloom silks are produced in limited batches by master weavers. In rare situations where two orders are placed simultaneously for a single unique piece, the earliest confirmed order is honored, and the secondary order is immediately refunded in full.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      4. Governing Jurisdiction
                    </h3>
                    <p>
                      Any disputes arising out of transactions on the Nirai platform shall be subject to the exclusive jurisdiction of the competent courts in Chennai, Tamil Nadu, India.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 9. FAQ & KNOWLEDGE BASE */}
            {activeTab === 'faq' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                    <div>
                      <h1 className="font-serif text-2xl font-bold text-slate-900">
                        Frequently Asked Questions
                      </h1>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Find instant answers to common questions regarding orders, handloom care, and payments.
                      </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={faqSearch}
                        onChange={(e) => setFaqSearch(e.target.value)}
                        placeholder="Search questions..."
                        className="w-full pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>

                  {/* FAQ Accordion List */}
                  <div className="space-y-6">
                    {filteredFaqData.length === 0 ? (
                      <div className="text-center py-8 text-stone-500 text-xs">
                        No questions match &ldquo;{faqSearch}&rdquo;. Try another search keyword.
                      </div>
                    ) : (
                      filteredFaqData.map((category, catIdx) => (
                        <div key={category.category} className="space-y-2.5">
                          <h3 className="font-serif font-bold text-amber-950 text-xs uppercase tracking-wider">
                            {category.category}
                          </h3>

                          <div className="space-y-2">
                            {category.items.map((item, itemIdx) => {
                              const uniqueKey = catIdx * 100 + itemIdx;
                              const isExpanded = expandedFaq === uniqueKey;

                              return (
                                <div
                                  key={item.q}
                                  className="border border-stone-200 rounded-xl overflow-hidden bg-[#FAF8F5] transition-all"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedFaq(isExpanded ? null : uniqueKey)
                                    }
                                    className="w-full p-3.5 text-left text-xs font-semibold text-slate-900 flex items-center justify-between gap-3 cursor-pointer hover:bg-stone-100/60 transition-colors"
                                  >
                                    <span>{item.q}</span>
                                    <ChevronDown
                                      className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${
                                        isExpanded ? 'rotate-180 text-amber-900' : ''
                                      }`}
                                    />
                                  </button>

                                  {isExpanded && (
                                    <div className="px-3.5 pb-3.5 pt-1 text-xs text-stone-600 leading-relaxed border-t border-stone-200/60 bg-white">
                                      {item.a}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

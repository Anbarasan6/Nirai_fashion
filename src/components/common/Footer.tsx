import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import {
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedCategory, storeSettings, setViewMode, language } = useShop();

  const footer = storeSettings.footerConfig;

  // Link navigation helper for dynamic links
  const handleLinkClick = (url: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (url.startsWith('cat-')) {
      setSelectedCategory(url);
      navigate(`/catalog?category=${url.replace('cat-', '')}`);
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (url === 'catalog') {
      navigate('/catalog');
    } else if (url === 'contact') {
      navigate('/contact');
    } else if (url === 'about') {
      navigate('/about');
    } else if (url === 'shipping-policy' || url === 'return-policy' || url === 'refund-policy' || url === 'cancellation-policy' || url === 'privacy-policy' || url === 'terms-conditions' || url === 'faq') {
      navigate('/policies');
    } else if (url === 'tracking') {
      navigate('/tracking');
    } else {
      navigate(url.startsWith('/') ? url : `/${url}`);
    }
  };

  const aboutText =
    language === 'ta'
      ? footer?.brandAboutTa ||
        'நிறை அரசு தென்னிந்திய கைத்தறி தயாரிப்பகம் — அனைத்து வகை பாரம்பரிய ஆடைகளுடன், குறிப்பாக காஞ்சி பட்டு மற்றும் செட்டிநாடு பருத்தி சேலைகள் தயாரிப்பில் சிறப்பு பெற்றது.'
      : footer?.brandAboutEn ||
        'Nirai honors authentic South Indian handloom traditions. Certified pure silk weaves, Salem wedding dhotis, and time-tested earthen cottons curated directly from artisan looms.';

  const addressText =
    language === 'ta'
      ? footer?.addressTa || '10 கத்தீட்ரல் சாலை, சென்னை, தமிழ்நாடு - 600086'
      : footer?.addressEn || '10 Cathedral Road, Chennai, Tamil Nadu - 600086';

  const copyrightText =
    language === 'ta'
      ? footer?.copyrightTa || '© 2026 நிறை ஹேண்ட்லூம்ஸ் & அப்பேரல். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை'
      : footer?.copyrightEn || '© 2026 NIRAI Handlooms & Apparel. All rights reserved';

  return (
    <footer className="bg-[#1C0D0F] text-[#E8DED1] border-t border-[#381B1F] mt-16 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#381B1F]">
          {/* Brand Info & Logo */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              {storeSettings.logo?.desktopLogoUrl ? (
                <img
                  src={storeSettings.logo.desktopLogoUrl}
                  alt={storeSettings.logo.altText || 'Nirai Handlooms'}
                  className="h-10 w-auto max-w-[200px] object-contain filter brightness-110"
                />
              ) : (
                <span className="text-2xl font-serif font-bold tracking-widest text-amber-200 block">
                  NIRAI
                </span>
              )}
            </Link>

            <p className="text-xs text-stone-300 leading-relaxed max-w-sm">
              {aboutText}
            </p>

            <div className="pt-1 text-xs text-stone-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{addressText}</span>
              </div>
            </div>

            {/* Social Media Icons */}
            {(footer?.social?.showSocialIcons ?? true) && (
              <div className="pt-2 flex items-center gap-3 text-stone-400">
                <a
                  href={footer?.social?.instagramUrl || '#instagram'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-amber-300 flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={footer?.social?.facebookUrl || '#facebook'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-amber-300 flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={footer?.social?.twitterUrl || '#twitter'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-amber-300 flex items-center justify-center transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={footer?.social?.whatsappUrl || '#whatsapp'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-amber-300 flex items-center justify-center transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Dynamic Footer Columns */}
          {footer?.columns && footer.columns.length > 0 ? (
            footer.columns.map((col) => (
              <div key={col.id}>
                <h5 className="font-serif text-xs font-semibold uppercase tracking-wider text-amber-300 mb-4">
                  {language === 'ta' ? col.titleTa || col.titleEn : col.titleEn}
                </h5>
                <ul className="space-y-2.5 text-xs text-stone-300">
                  {col.links.map((link) => (
                    <li key={link.id}>
                      <button
                        type="button"
                        onClick={() => handleLinkClick(link.url)}
                        className="hover:text-amber-200 transition-colors text-left cursor-pointer"
                      >
                        {language === 'ta' ? link.labelTa || link.labelEn : link.labelEn}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <>
              {/* Fallback Heritage Weaves */}
              <div>
                <h5 className="font-serif text-xs font-semibold uppercase tracking-wider text-amber-300 mb-4">
                  Heritage Weaves
                </h5>
                <ul className="space-y-2.5 text-xs text-stone-300">
                  <li>
                    <Link
                      to="/catalog?category=sarees"
                      onClick={() => {
                        setSelectedCategory('cat-sarees');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-amber-200 transition-colors"
                    >
                      Kanchipuram Silk Sarees
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/catalog?category=cotton"
                      onClick={() => {
                        setSelectedCategory('cat-cotton');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-amber-200 transition-colors"
                    >
                      Chettinad Handloom Cottons
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/catalog?category=vesti"
                      onClick={() => {
                        setSelectedCategory('cat-vesti');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-amber-200 transition-colors"
                    >
                      Salem Royal Double Vestis
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Fallback Orders & Information */}
              <div>
                <h5 className="font-serif text-xs font-semibold uppercase tracking-wider text-amber-300 mb-4">
                  Orders & Information
                </h5>
                <ul className="space-y-2.5 text-xs text-stone-300">
                  <li>
                    <Link
                      to="/tracking"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="hover:text-amber-200 transition-colors"
                    >
                      Track Your Order
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/about"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="hover:text-amber-200 transition-colors"
                    >
                      Our Handloom Heritage
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="hover:text-amber-200 transition-colors"
                    >
                      Contact Support Desk
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/policies"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="hover:text-amber-200 transition-colors"
                    >
                      Privacy, Returns & Shipping Policies
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Administration Portal Access */}
          <div>
            <h5 className="font-serif text-xs font-semibold uppercase tracking-wider text-amber-300 mb-4">
              Administration
            </h5>
            <ul className="space-y-2.5 text-xs text-stone-300">
              <li>
                <button
                  onClick={() => {
                    setViewMode('admin');
                    navigate('/admin/dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-amber-200 text-amber-300/90 underline underline-offset-2 transition-colors text-left font-medium cursor-pointer"
                >
                  Admin Operations Console
                </button>
              </li>
              <li>
                <span className="text-stone-400">Secure Direct UPI Payment</span>
              </li>
              <li>
                <span className="text-stone-400">Verified Master Handlooms</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-3">
          <p>{copyrightText}</p>
          <p className="flex items-center gap-3">
            <span>Direct Master Weaves</span>
            <span>·</span>
            <span>Verified Direct UPI Payments</span>
            <span>·</span>
            <span>Fast Express Dispatch</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

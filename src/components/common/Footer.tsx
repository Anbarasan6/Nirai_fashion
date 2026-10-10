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
  const { setSelectedCategory, storeSettings, setViewMode } = useShop();

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
              Nirai honors authentic South Indian handloom traditions. Certified pure silk weaves, Salem wedding dhotis, and time-tested earthen cottons curated directly from artisan looms.
            </p>

            <div className="pt-1 text-xs text-stone-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>42 Weaver Guild Street, Kanchipuram, Tamil Nadu 631501</span>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="pt-2 flex items-center gap-3 text-stone-400">
              <a
                href="#instagram"
                onClick={(e) => e.preventDefault()}
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-amber-300 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#facebook"
                onClick={(e) => e.preventDefault()}
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-amber-300 flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#twitter"
                onClick={(e) => e.preventDefault()}
                aria-label="Twitter"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-amber-300 flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#whatsapp"
                onClick={(e) => e.preventDefault()}
                aria-label="WhatsApp"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-amber-300 flex items-center justify-center transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Heritage Weaves */}
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
              <li>
                <Link
                  to="/catalog?category=kids"
                  onClick={() => {
                    setSelectedCategory('cat-kids');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-amber-200 transition-colors"
                >
                  Pattu Pavadai & Kids
                </Link>
              </li>
            </ul>
          </div>

          {/* Orders & Policies */}
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

          {/* Administration Portal */}
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
                <span className="text-stone-400">Direct UPI Verification Engine</span>
              </li>
              <li>
                <span className="text-stone-400">Cloudinary CDN & Supabase Sync</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-3">
          <p>© 2026 NIRAI Handlooms & Apparel Private Limited. All rights reserved.</p>
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

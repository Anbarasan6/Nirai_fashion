import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Shield, Award, Sparkles, RefreshCw, Heart } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const Footer: React.FC = () => {
  const { language, t, settings } = useShop();

  return (
    <footer className="bg-[#1E0B0E] text-[#ECE6D9] pt-16 pb-20 lg:pb-8 border-t-4 border-[#D4AF37]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-[#D4AF37]/20 text-center">
          <div className="flex flex-col items-center p-4 rounded-xl bg-[#2D1619]/60 border border-[#D4AF37]/20">
            <div className="p-3 bg-[#4A0E17] text-[#D4AF37] rounded-full mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="font-serif-luxury text-sm font-bold text-[#F4E8C1] mb-1">
              {language === 'ta' ? '100% தூய கைத்தறி பட்டு' : '100% Pure Handloom Silk'}
            </h4>
            <p className="text-xs text-[#A09295]">
              {language === 'ta' ? 'உண்மையான சேலம் மல்பெரி பட்டு நெசவு' : 'Authentic Salem mulberry silk & pure zari motifs'}
            </p>
          </div>

          <div className="flex flex-col items-center p-4 rounded-xl bg-[#2D1619]/60 border border-[#D4AF37]/20">
            <div className="p-3 bg-[#4A0E17] text-[#D4AF37] rounded-full mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-serif-luxury text-sm font-bold text-[#F4E8C1] mb-1">
              {language === 'ta' ? 'நேரடி நெசவாளர் விலை' : 'Direct Weaver Pricing'}
            </h4>
            <p className="text-xs text-[#A09295]">
              {language === 'ta' ? 'இடைத்தரகர்கள் இல்லாத நியாயமான விலை' : 'Zero middleman markup, straight from looms'}
            </p>
          </div>

          <div className="flex flex-col items-center p-4 rounded-xl bg-[#2D1619]/60 border border-[#D4AF37]/20">
            <div className="p-3 bg-[#4A0E17] text-[#D4AF37] rounded-full mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="font-serif-luxury text-sm font-bold text-[#F4E8C1] mb-1">
              {language === 'ta' ? '0% கட்டண UPI செக்அவுட்' : '0% Gateway Fee UPI'}
            </h4>
            <p className="text-xs text-[#A09295]">
              {language === 'ta' ? 'உடனடி QR ஸ்கேன் & UTR சரிபார்ப்பு' : 'Instant QR code scan with 0% gateway fee'}
            </p>
          </div>

          <div className="flex flex-col items-center p-4 rounded-xl bg-[#2D1619]/60 border border-[#D4AF37]/20">
            <div className="p-3 bg-[#4A0E17] text-[#D4AF37] rounded-full mb-3">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="font-serif-luxury text-sm font-bold text-[#F4E8C1] mb-1">
              {language === 'ta' ? 'எளிதான டெலிவரி & கண்காணிப்பு' : 'Easy Delivery & Tracking'}
            </h4>
            <p className="text-xs text-[#A09295]">
              {language === 'ta' ? 'பாதுகாப்பான பேக்கிங் மற்றும் வாட்ஸ்அப் புதுப்பிப்புகள்' : 'Safe express shipping across India & abroad'}
            </p>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12">
          
          {/* Brand & Weaver Heritage */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="font-serif-luxury text-2xl font-extrabold text-[#D4AF37]">
              NIRAI
            </h3>
            <p className="text-xs text-[#C5B7BA] leading-relaxed">
              {language === 'ta'
                ? 'நிறை பட்டு - இளம்பிள்ளை மற்றும் காஞ்சிபுரம் பாரம்பரிய பட்டு சேலைகளின் இணையற்ற தொகுப்பு.'
                : 'NIRAI celebrates the grand heritage of South Indian textile craftsmanship, bringing master weaver sarees straight to your doorstep.'}
            </p>
            <div className="pt-2 text-xs text-[#D4AF37] font-semibold flex items-center gap-1.5">
              <Heart className="w-4 h-4 fill-[#D4AF37]" />
              <span>{language === 'ta' ? 'கைத்தறி நெசவாளர்களுக்கு ஆதரவளிக்கவும்' : 'Supporting 500+ Weaver Families'}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif-luxury text-sm font-bold text-[#F4E8C1] uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-[#C5B7BA]">
              <li>
                <Link to="/" className="hover:text-[#D4AF37] transition">{t('home')}</Link>
              </li>
              <li>
                <Link to="/catalog" className="hover:text-[#D4AF37] transition">{t('catalog')}</Link>
              </li>
              <li>
                <Link to="/deals" className="hover:text-[#D4AF37] transition">Offers & Deals</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#D4AF37] transition">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#D4AF37] transition">Contact Support</Link>
              </li>
              <li>
                <Link to="/tracking" className="hover:text-[#D4AF37] transition">{t('trackOrder')}</Link>
              </li>
            </ul>
          </div>

          {/* Customer Policies */}
          <div className="space-y-3">
            <h4 className="font-serif-luxury text-sm font-bold text-[#F4E8C1] uppercase tracking-wider">
              Legal & Policies
            </h4>
            <ul className="space-y-2 text-xs text-[#C5B7BA]">
              <li>
                <Link to="/privacy" className="hover:text-[#D4AF37] transition">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#D4AF37] transition">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-[#D4AF37] transition">Shipping Policy</Link>
              </li>
              <li>
                <Link to="/return-policy" className="hover:text-[#D4AF37] transition">Return & Exchange</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#D4AF37] transition">FAQ Help Center</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-serif-luxury text-sm font-bold text-[#F4E8C1] uppercase tracking-wider">
              {t('contactUs')}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#C5B7BA]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>Nirai Silk Looms, Main Road, Elampillai, Salem - 637502, Tamil Nadu, India.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{settings.contact_phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{settings.contact_email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Copyright */}
        <div className="pt-8 border-t border-[#D4AF37]/20 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#A09295]">
          <div>
            © {new Date().getFullYear()} NIRAI Handloom Silks & Sarees. All Rights Reserved.
          </div>
          <div className="font-serif-luxury text-[#D4AF37] font-semibold text-center">
            {language === 'ta' ? '✦ நெசவாளர் பாரம்பரியம் வாழ்க ✦' : '✦ Honoring Master Weavers ✦'}
          </div>
        </div>

      </div>
    </footer>
  );
};

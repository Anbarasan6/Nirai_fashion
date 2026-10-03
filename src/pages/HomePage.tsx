import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShoppingBag, Heart, Star, CheckCircle2, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { InfiniteMarquee } from '../components/common/InfiniteMarquee';
import { AutoScrollSareeTicker } from '../components/storefront/AutoScrollSareeTicker';

export const HomePage: React.FC = () => {
  const { language, t, categories, products, addToCart, toggleWishlist, isInWishlist, settings } = useShop();
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const heroSlides = settings.hero_slides && settings.hero_slides.length > 0 ? settings.hero_slides : [
    {
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=85',
      titleEn: 'Royal Elampillai Soft Silks',
      titleTa: 'ராயல் இளம்பிள்ளை சாஃப்ட் சில்க்ஸ்',
      subtitleEn: 'Handwoven in Salem with high-density pure zari peacock motifs.',
      subtitleTa: 'அடர்ந்த ஜரி மயில் உருவங்களுடன் சேலத்தில் கையால் நெய்யப்பட்டது.',
      ctaUrl: '/catalog?category=cat_elampillai'
    },
    {
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1920&q=85',
      titleEn: 'Kanchipuram Heritage Bridal Silks',
      titleTa: 'காஞ்சிபுரம் ஹெரிடேஜ் பிரைடல் பட்டு',
      subtitleEn: 'Authentic 3-ply heavy mulberry silk sarees with golden Korvai borders.',
      subtitleTa: 'தங்கக் கோர்வை பார்டர்களுடன் கூடிய தூய 3-பிளை காஞ்சிபுரம் திருமண புடவைகள்.',
      ctaUrl: '/catalog?category=cat_kanchipuram'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  const featuredProducts = products.filter(p => p.is_featured).slice(0, 8);

  return (
    <div className="space-y-16 pb-20">
      
      {/* Infinite Auto-Scrolling Announcement Marquee */}
      <InfiniteMarquee />

      {/* Dynamic Hero Carousel */}
      <section className="relative h-[480px] sm:h-[580px] lg:h-[650px] w-full overflow-hidden bg-[#1E0B0E]">
        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[10000ms]"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E0B0E]/95 via-[#2D1619]/80 to-transparent" />

            <div className="relative max-w-7xl mx-auto h-full px-6 sm:px-12 flex flex-col justify-center text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F4E8C1] text-xs font-semibold tracking-wider uppercase backdrop-blur-md w-fit">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>100% Direct Salem Looms</span>
              </div>

              <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F4E8C1] leading-tight max-w-2xl drop-shadow-md">
                {language === 'ta' ? slide.titleTa : slide.titleEn}
              </h1>

              <p className="text-sm sm:text-base text-[#ECE6D9] max-w-xl font-light leading-relaxed">
                {language === 'ta' ? slide.subtitleTa : slide.subtitleEn}
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to={slide.ctaUrl || '/catalog'}
                  className="px-7 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#2D1619] font-extrabold text-xs sm:text-sm rounded-full hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 shadow-lg"
                >
                  <span>{t('exploreCatalog')}</span>
                  <ArrowRight className="w-4 h-4 text-[#2D1619]" />
                </Link>
                <Link
                  to="/catalog"
                  className="px-7 py-3.5 bg-transparent border border-[#F4E8C1]/60 text-[#F4E8C1] font-bold text-xs sm:text-sm rounded-full hover:bg-[#F4E8C1]/10 transition"
                >
                  {t('viewCategories')}
                </Link>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 text-[#F4E8C1] hover:bg-[#D4AF37] hover:text-[#2D1619] transition backdrop-blur-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 text-[#F4E8C1] hover:bg-[#D4AF37] hover:text-[#2D1619] transition backdrop-blur-sm"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Auto-Scrolling Saree Ticker Showcase */}
      <section className="space-y-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#D4AF37] animate-pulse" />
            <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#2D1619]">
              {language === 'ta' ? 'நேரடி நெசவாளர் சேலை கண்காட்சி' : 'Live Auto-Scrolling Saree Showcase'}
            </h3>
          </div>
          <span className="text-xs text-[#8A7B7E] hidden sm:inline">Auto Gliding Weaves</span>
        </div>
        
        <AutoScrollSareeTicker />
      </section>

      {/* Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#4A0E17]">
            {language === 'ta' ? 'நெசவாளர் பிரிவுகள்' : 'Heritage Collections'}
          </span>
          <h2 className="font-serif-luxury text-2xl sm:text-4xl font-extrabold text-[#2D1619]">
            {t('categories')}
          </h2>
          <div className="w-16 h-1 bg-[#D4AF37] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.id}`}
              className="group relative h-80 rounded-2xl overflow-hidden shadow-lg border border-[#E2D9C8] hover:shadow-2xl transition-all duration-300"
            >
              <img
                src={cat.image_url}
                alt={cat.name_en}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D1619]/90 via-[#2D1619]/40 to-transparent" />

              <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end">
                <h3 className="font-serif-luxury text-xl font-bold text-[#F4E8C1] group-hover:text-[#D4AF37] transition">
                  {language === 'ta' && cat.name_ta ? cat.name_ta : cat.name_en}
                </h3>
                <p className="text-xs text-[#ECE6D9] mt-1 line-clamp-2 font-light">
                  {language === 'ta' && cat.description_ta ? cat.description_ta : cat.description_en}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs font-bold text-[#D4AF37]">
                  <span>Shop Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Curated Saree Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#4A0E17]">
              {language === 'ta' ? 'சிறந்த தயாரிப்புகள்' : 'Masterpiece Sarees'}
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-[#2D1619]">
              {t('featuredProducts')}
            </h2>
          </div>
          <Link
            to="/catalog"
            className="text-xs font-bold text-[#4A0E17] hover:text-[#2D1619] flex items-center gap-1 hover:gap-2 transition-all border-b border-[#4A0E17]"
          >
            <span>View All Sarees</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => {
            const name = language === 'ta' && product.name_ta ? product.name_ta : product.name_en;
            const price = product.discount_price || product.price;
            const inWishlist = isInWishlist(product.id);

            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl overflow-hidden border border-[#E2D9C8] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[#F2ECDF]">
                  <img
                    src={product.images[0]}
                    alt={name}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  />

                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${
                      inWishlist ? 'bg-[#800020] text-white' : 'bg-white/80 text-[#2D1619] hover:bg-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? 'fill-white' : ''}`} />
                  </button>

                  {product.discount_price && (
                    <div className="absolute top-3 left-3 bg-[#4A0E17] text-[#F4E8C1] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                    </div>
                  )}

                  {product.stock_quantity <= 5 && (
                    <div className="absolute bottom-3 left-3 bg-[#2D1619]/90 text-[#F4E8C1] text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm">
                      Only {product.stock_quantity} left
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#8A7B7E] uppercase tracking-wider">
                      {product.fabric_type || 'Pure Silk'}
                    </span>
                    <h3
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="font-serif-luxury text-sm font-bold text-[#2D1619] hover:text-[#4A0E17] transition cursor-pointer line-clamp-2 mt-1"
                    >
                      {name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-[#F2ECDF] flex items-center justify-between">
                    <div>
                      <div className="text-base font-extrabold text-[#4A0E17]">
                        ₹{price.toLocaleString('en-IN')}
                      </div>
                      {product.discount_price && (
                        <div className="text-xs text-[#8A7B7E] line-through">
                          ₹{product.price.toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(product, 1)}
                      className="p-2.5 rounded-full bg-[#2D1619] hover:bg-[#4A0E17] text-[#F4E8C1] transition shadow-md group-hover:scale-110"
                      title={t('addToCart')}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Direct Weaver Guarantee Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#2D1619] text-[#FBF9F5] rounded-3xl p-8 sm:p-12 border-2 border-[#D4AF37]/40 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                {language === 'ta' ? 'பாரம்பரிய உத்தரவாதம்' : 'Master Weaver Guarantee'}
              </span>
              <h2 className="font-serif-luxury text-2xl sm:text-4xl font-extrabold text-[#F4E8C1] leading-tight">
                {language === 'ta'
                  ? 'நேரடி சேலம் நெசவு, 100% தூய ஜரி பட்டு'
                  : 'Direct Salem Looms, Zero Middlemen Margins'}
              </h2>
              <p className="text-xs sm:text-sm text-[#ECE6D9] leading-relaxed">
                {language === 'ta'
                  ? 'நாங்கள் ஒவ்வொரு சேலையையும் எங்கள் சொந்த சேலம் மற்றும் இளம்பிள்ளை நெசவுக்கூடங்களில் இருந்து நேரடியாக தயார் செய்து உங்களிடம் சேர்ப்பிக்கிறோம்.'
                  : 'We hand-inspect each silk saree for density, zari brilliance, and border precision before dispatching with 0% UPI checkout fees.'}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-[#F4E8C1]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Silk Mark Quality Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>0% Gateway Fee via UPI QR</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Includes Matching Blouse Piece</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Express Safe Packing</span>
                </div>
              </div>
            </div>

            <div className="relative aspect-video lg:aspect-square rounded-2xl overflow-hidden border border-[#D4AF37]/30 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
                alt="Silk Looms"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#4A0E17]">
            {language === 'ta' ? 'வாடிக்கையாளர் கருத்துகள்' : 'Customer Happiness'}
          </span>
          <h2 className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-[#2D1619]">
            {t('customerReviews')}
          </h2>
          <div className="w-16 h-1 bg-[#D4AF37] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
            <div className="flex text-[#D4AF37]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
              ))}
            </div>
            <p className="text-xs text-[#4A0E17] leading-relaxed italic">
              "The Elampillai soft silk saree was extremely light and elegant. The zari color is rich, and the direct UPI payment was instant without extra charges!"
            </p>
            <div className="pt-2 border-t border-[#F2ECDF] text-xs font-bold text-[#2D1619]">
              — Priyadarshini M., Chennai
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
            <div className="flex text-[#D4AF37]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
              ))}
            </div>
            <p className="text-xs text-[#4A0E17] leading-relaxed italic">
              "Ordered pure Kanchipuram silk for my daughter's wedding function. The saree quality exceeded my expectations. Direct weaver prices are unbelievable!"
            </p>
            <div className="pt-2 border-t border-[#F2ECDF] text-xs font-bold text-[#2D1619]">
              — Meenakshi S., Coimbatore
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
            <div className="flex text-[#D4AF37]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
              ))}
            </div>
            <p className="text-xs text-[#4A0E17] leading-relaxed italic">
              "Super fast order dispatch and live order tracking. Tamil description helped my mother choose the exact color variant. Truly a genuine handloom brand."
            </p>
            <div className="pt-2 border-t border-[#F2ECDF] text-xs font-bold text-[#2D1619]">
              — Karthik R., Madurai
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

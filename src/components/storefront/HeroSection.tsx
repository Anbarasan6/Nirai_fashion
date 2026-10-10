import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { HeroSlide } from '../../types';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { language, t, setActiveTab, setSelectedCategory, storeSettings } = useShop();

  const slides: HeroSlide[] = (storeSettings.heroSlides || []).filter((s) => s.isActive);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  // Auto-slide every 5 seconds, pauses on hover
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, isPaused]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const handleShopNow = (targetLink?: string) => {
    if (targetLink && targetLink.startsWith('cat-')) {
      setSelectedCategory(targetLink);
    } else {
      setSelectedCategory(null);
    }
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      id="hero-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden bg-[#1A0E10] text-white"
    >
      {/* Visual Banner Container */}
      <div className="relative w-full h-[520px] sm:h-[620px] lg:h-[680px]">
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlideIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Picture tag for responsive desktop vs mobile banner */}
              <picture>
                {slide.mobileImage && (
                  <source media="(max-width: 640px)" srcSet={slide.mobileImage} />
                )}
                <img
                  src={slide.desktopImage}
                  alt={slide.titleEn}
                  className="w-full h-full object-cover object-center filter brightness-[0.82]"
                />
              </picture>

              {/* Minimal Warm Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              {/* Content Placement */}
              <div className="absolute inset-0 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex flex-col justify-center">
                <div className="max-w-xl sm:max-w-2xl space-y-4 sm:space-y-6">
                  {/* Minimal unboxed kicker */}
                  {(slide.badgeEn || slide.badgeTa) && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium tracking-widest uppercase text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{language === 'ta' ? slide.badgeTa : slide.badgeEn}</span>
                      <span aria-hidden="true" className="opacity-50">·</span>
                      <span className="text-stone-300">Heritage Weaves</span>
                    </div>
                  )}

                  {/* Minimal Headline */}
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-[1.12]">
                    {language === 'ta' && slide.titleTa ? slide.titleTa : slide.titleEn}
                  </h1>

                  {/* Short Subtitle */}
                  {(slide.subtitleEn || slide.subtitleTa) && (
                    <p className="text-sm sm:text-base text-stone-200/90 leading-relaxed font-sans max-w-lg">
                      {language === 'ta' && slide.subtitleTa ? slide.subtitleTa : slide.subtitleEn}
                    </p>
                  )}

                  {/* One Clear "Shop Now" Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleShopNow(slide.ctaLink)}
                      className="px-7 py-3.5 bg-white text-slate-900 hover:bg-amber-100 hover:text-amber-950 font-semibold text-xs uppercase tracking-widest rounded-lg transition-all shadow-md inline-flex items-center gap-2 cursor-pointer group"
                    >
                      <span>
                        {language === 'ta' && slide.ctaTextTa ? slide.ctaTextTa : slide.ctaTextEn || 'Shop Now'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Carousel Left/Right Arrows */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white flex items-center justify-center transition-all backdrop-blur-xs cursor-pointer border border-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white flex items-center justify-center transition-all backdrop-blur-xs cursor-pointer border border-white/10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Small Navigation Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    idx === currentSlideIndex
                      ? 'w-7 h-1.5 bg-amber-400'
                      : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

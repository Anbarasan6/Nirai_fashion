import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const PromoBannerSection: React.FC = () => {
  const { language, setActiveTab, setSelectedCategory, storeSettings } = useShop();
  const promo = storeSettings.promoBanner;

  // Countdown calculations
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!promo?.countdownDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(promo.countdownDate!) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [promo?.countdownDate]);

  if (!promo || !promo.isActive) return null;

  const handleCta = () => {
    if (promo.ctaLink && promo.ctaLink.startsWith('cat-')) {
      setSelectedCategory(promo.ctaLink);
    } else {
      setSelectedCategory(null);
    }
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const title = language === 'ta' && promo.titleTa ? promo.titleTa : promo.titleEn;
  const subtitle = language === 'ta' && promo.subtitleTa ? promo.subtitleTa : promo.subtitleEn;
  const badge = language === 'ta' && promo.badgeTa ? promo.badgeTa : promo.badgeEn;
  const ctaText = language === 'ta' && promo.ctaTextTa ? promo.ctaTextTa : promo.ctaTextEn;

  return (
    <section className="py-14 sm:py-20 bg-[#FAF9F5] border-b border-[#EAE5DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden shadow-md bg-[#251214] text-white">
          {/* Responsive Image with Picture tag (1600x600 Desktop, 1080x900 Mobile) */}
          <div className="relative h-[380px] sm:h-[460px] lg:h-[500px] w-full">
            <picture>
              {promo.mobileImage && (
                <source media="(max-width: 640px)" srcSet={promo.mobileImage} />
              )}
              <img
                src={promo.desktopImage}
                alt={promo.titleEn}
                loading="lazy"
                className="w-full h-full object-cover object-center filter brightness-[0.78]"
              />
            </picture>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Content Container */}
            <div className="absolute inset-0 p-6 sm:p-12 lg:p-16 flex flex-col justify-center">
              <div className="max-w-xl space-y-4 sm:space-y-5">
                {/* Badge / Kicker */}
                {badge && (
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{badge}</span>
                  </div>
                )}

                {/* Headline */}
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                  {title}
                </h2>

                {/* Subtitle */}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-stone-200/90 leading-relaxed font-sans max-w-md">
                    {subtitle}
                  </p>
                )}

                {/* Live Countdown Timer if configured */}
                {timeLeft && (
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 sm:gap-3 bg-black/45 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                      <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                      <div className="flex items-center gap-2 text-center text-xs font-mono">
                        <div>
                          <span className="font-bold text-sm text-white">{timeLeft.days}</span>
                          <span className="text-[9px] uppercase text-stone-300 block">Days</span>
                        </div>
                        <span className="text-amber-300 font-bold">:</span>
                        <div>
                          <span className="font-bold text-sm text-white">
                            {String(timeLeft.hours).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] uppercase text-stone-300 block">Hrs</span>
                        </div>
                        <span className="text-amber-300 font-bold">:</span>
                        <div>
                          <span className="font-bold text-sm text-white">
                            {String(timeLeft.minutes).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] uppercase text-stone-300 block">Min</span>
                        </div>
                        <span className="text-amber-300 font-bold">:</span>
                        <div>
                          <span className="font-bold text-sm text-white">
                            {String(timeLeft.seconds).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] uppercase text-stone-300 block">Sec</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCta}
                    className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-md inline-flex items-center gap-2 cursor-pointer group"
                  >
                    <span>{ctaText || 'Claim Offer'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

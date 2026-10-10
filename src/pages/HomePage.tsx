import React from 'react';
import { useShop } from '../context/ShopContext';
import { HeroSection } from '../components/storefront/HeroSection';
import { CategorySection } from '../components/storefront/CategorySection';
import { FeaturedSection } from '../components/storefront/FeaturedSection';
import { PromoBannerSection } from '../components/storefront/PromoBannerSection';
import { NewArrivalsSection } from '../components/storefront/NewArrivalsSection';
import { WhyChooseUsSection } from '../components/storefront/WhyChooseUsSection';
import { FinalCtaSection } from '../components/storefront/FinalCtaSection';

export const HomePage: React.FC = () => {
  const { storeSettings } = useShop();

  const sectionRegistry: Record<string, React.ReactNode> = {
    hero: <HeroSection key="hero" />,
    categories: <CategorySection key="categories" />,
    featured: <FeaturedSection key="featured" />,
    promo: <PromoBannerSection key="promo" />,
    new_arrivals: <NewArrivalsSection key="new_arrivals" />,
    why_us: <WhyChooseUsSection key="why_us" />,
    final_cta: <FinalCtaSection key="final_cta" />,
  };

  const configuredSections = storeSettings?.homepageSections;

  if (configuredSections && configuredSections.length > 0) {
    return (
      <div className="space-y-0">
        {[...configuredSections]
          .filter((sec) => sec.isVisible !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((sec) => sectionRegistry[sec.id] || null)}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <HeroSection />
      <CategorySection />
      <FeaturedSection />
      <PromoBannerSection />
      <NewArrivalsSection />
      <WhyChooseUsSection />
      <FinalCtaSection />
    </div>
  );
};

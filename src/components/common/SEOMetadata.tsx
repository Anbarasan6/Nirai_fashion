import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOMetadataProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
}

export const SEOMetadata: React.FC<SEOMetadataProps> = ({
  title = 'Nirai | Pure Silk Sarees & Handloom Apparel Online',
  description = 'Discover authentic South Indian handloom silk sarees, Kanchipuram silks, Elampillai soft silks, pure silk dhotis, and traditional kids wear crafted by master weavers. Express delivery across India with 100% Pure Silk Guarantee.',
  canonicalUrl,
  ogImage = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&h=630&q=80',
  ogType = 'website',
}) => {
  const location = useLocation();
  const currentUrl = canonicalUrl || `https://niraifashions.vercel.app${location.pathname}`;

  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // 2. Helper to set or update meta tags
    const updateMetaTag = (attribute: 'name' | 'property', key: string, value: string) => {
      let element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    // 3. Helper to update canonical link
    const updateCanonical = (href: string) => {
      let element = document.querySelector('link[rel="canonical"]');
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', 'canonical');
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'title', title);
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', currentUrl);
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', ogImage);

    updateCanonical(currentUrl);
  }, [title, description, currentUrl, ogImage, ogType]);

  return null;
};

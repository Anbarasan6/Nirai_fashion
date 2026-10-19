import React, { useState } from 'react';
import { cldUrl, getSrcSet, CldOptions } from '../../utils/cloudinary';

export interface ImageWithFallbackProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackText?: string;
  cldWidth?: number;
  cldHeight?: number;
  cldCrop?: CldOptions['crop'];
  responsive?: boolean;
  priority?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
  cldWidth,
  cldHeight,
  cldCrop,
  responsive = false,
  priority = false,
  loading,
  decoding = 'async',
  ...props
}) => {
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#2D1619] via-[#4A2026] to-[#1E1114] text-amber-100 p-6 ${className}`}
        role="img"
        aria-label={alt}
      >
        {/* Intricate South Indian Kolam / Temple Zari SVG motif */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="100"
            viewBox="0 0 100 100"
          >
            <defs>
              <pattern id="zari-grid-fallback" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M12 0 L24 12 L12 24 L0 12 Z" fill="none" stroke="#F59E0B" strokeWidth="0.75" />
                <circle cx="12" cy="12" r="2.5" fill="#F59E0B" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#zari-grid-fallback)" />
          </svg>
        </div>
        <div className="relative z-10 text-center px-4">
          <div className="w-10 h-10 mx-auto mb-2 border border-amber-400/40 rounded-full flex items-center justify-center text-amber-300">
            <span className="font-serif text-sm">நி</span>
          </div>
          <span className="font-serif text-sm font-semibold tracking-wider text-amber-200 block line-clamp-1">
            {fallbackText || alt}
          </span>
          <span className="text-[11px] text-amber-300/70 tracking-widest uppercase mt-0.5 block">
            Nirai Heritage Handloom
          </span>
        </div>
      </div>
    );
  }

  const optimizedSrc = cldUrl(src, {
    w: cldWidth,
    h: cldHeight,
    crop: cldCrop,
  });

  const srcSetString = responsive ? getSrcSet(src) : undefined;
  const imageLoading = loading || (priority ? 'eager' : 'lazy');
  const fetchPriority = priority ? 'high' : 'auto';

  return (
    <img
      src={optimizedSrc}
      srcSet={srcSetString}
      sizes={responsive ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' : undefined}
      alt={alt}
      loading={imageLoading}
      decoding={decoding}
      // @ts-expect-error React 19 supports fetchPriority
      fetchpriority={fetchPriority}
      className={`${className} ${!isLoaded && !priority ? 'opacity-90 transition-opacity duration-300' : ''}`}
      referrerPolicy="no-referrer"
      onLoad={() => setIsLoaded(true)}
      onError={() => setError(true)}
      {...props}
    />
  );
};

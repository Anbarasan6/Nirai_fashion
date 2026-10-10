import React, { useState } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
  ...props
}) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#2D1619] via-[#4A2026] to-[#1E1114] text-amber-100 p-6 ${className}`}
      >
        {/* Intricate South Indian Kolam / Temple Zari SVG motif */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <defs>
              <pattern id="zari-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M12 0 L24 12 L12 24 L0 12 Z" fill="none" stroke="#F59E0B" strokeWidth="0.75" />
                <circle cx="12" cy="12" r="2.5" fill="#F59E0B" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#zari-grid)" />
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

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      {...props}
    />
  );
};

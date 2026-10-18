import React from 'react';

export const ShimmerBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-stone-200/80 rounded ${className}`} />
);

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs space-y-3 p-3">
    {/* Aspect ratio image placeholder */}
    <div className="aspect-[3/4] w-full bg-stone-200/80 rounded-lg animate-pulse" />
    <div className="space-y-2 pt-1">
      <div className="h-3 w-1/3 bg-stone-200/80 rounded animate-pulse" />
      <div className="h-4 w-4/5 bg-stone-200/80 rounded animate-pulse" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-4 w-1/4 bg-stone-200/80 rounded animate-pulse" />
        <div className="h-7 w-20 bg-stone-200/80 rounded-lg animate-pulse" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <div className="flex items-center justify-between mb-6">
      <div className="h-6 w-48 bg-stone-200/80 rounded animate-pulse" />
      <div className="h-8 w-32 bg-stone-200/80 rounded animate-pulse" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const ProductDetailSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Gallery skeleton */}
      <div className="space-y-4">
        <div className="aspect-[4/5] w-full bg-stone-200/80 rounded-2xl animate-pulse" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-20 h-20 bg-stone-200/80 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
      {/* Details skeleton */}
      <div className="space-y-5 pt-2">
        <div className="h-4 w-28 bg-stone-200/80 rounded animate-pulse" />
        <div className="h-8 w-3/4 bg-stone-200/80 rounded animate-pulse" />
        <div className="h-6 w-36 bg-stone-200/80 rounded animate-pulse" />
        <div className="space-y-2 pt-4">
          <div className="h-3 w-full bg-stone-200/80 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-stone-200/80 rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-stone-200/80 rounded animate-pulse" />
        </div>
        <div className="flex gap-4 pt-6">
          <div className="h-12 flex-1 bg-stone-200/80 rounded-xl animate-pulse" />
          <div className="h-12 w-12 bg-stone-200/80 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs p-4 space-y-4">
    <div className="flex justify-between items-center pb-2 border-b border-stone-100">
      <div className="h-6 w-40 bg-stone-200/80 rounded animate-pulse" />
      <div className="h-8 w-28 bg-stone-200/80 rounded animate-pulse" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 w-full bg-stone-100 rounded-lg animate-pulse" />
      ))}
    </div>
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
    <div className="h-8 w-64 bg-stone-200/80 rounded animate-pulse" />
    <div className="h-4 w-96 bg-stone-200/80 rounded animate-pulse" />
    <div className="space-y-3 pt-4">
      <div className="h-4 w-full bg-stone-200/80 rounded animate-pulse" />
      <div className="h-4 w-full bg-stone-200/80 rounded animate-pulse" />
      <div className="h-4 w-3/4 bg-stone-200/80 rounded animate-pulse" />
    </div>
  </div>
);

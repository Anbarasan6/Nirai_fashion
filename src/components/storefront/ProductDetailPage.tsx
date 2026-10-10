import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ProductCard } from './ProductCard';
import {
  Heart,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ArrowLeft,
  Check,
  ShoppingBag,
  Zap,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const {
    language,
    t,
    selectedProductSlug,
    setActiveTab,
    addToCart,
    toggleWishlist,
    isInWishlist,
    storeSettings,
  } = useShop();

  const product = StorageService.getPublicProducts().find(
    (p) => p.slug === selectedProductSlug || p.id === selectedProductSlug
  );

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTabSection, setActiveTabSection] = useState<'desc' | 'specs' | 'reviews'>('desc');

  // Review Form State
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-slate-800">
          Product Not Found
        </h2>
        <p className="text-xs text-stone-500 mt-2">
          The requested creation is either unavailable or has been archived.
        </p>
        <button
          onClick={() => setActiveTab('catalog')}
          className="mt-6 px-4 py-2 bg-[#2D1619] text-amber-100 text-xs font-semibold rounded-lg"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const selectedVariant = product.variants?.[selectedVariantIdx] || product.variants?.[0];
  const isFavorited = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;

  const totalDiscountPercent = product.regularDiscount + (product.specialDiscount || 0);

  const displayName = language === 'ta' && product.nameTa ? product.nameTa : product.nameEn;
  const displayDesc = language === 'ta' && product.descriptionTa ? product.descriptionTa : product.descriptionEn;
  const displayCare = language === 'ta' && product.careInstructionsTa ? product.careInstructionsTa : product.careInstructionsEn;

  const handleBuyNow = () => {
    addToCart(product, selectedVariant, quantity);
    setActiveTab('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) return;

    StorageService.addReview(product.id, {
      productId: product.id,
      customerName: reviewerName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      verifiedPurchase: true,
    });

    setReviewSubmitted(true);
    setReviewerName('');
    setReviewComment('');
  };

  // Related products
  const relatedProducts = StorageService.getPublicProducts()
    .filter((p) => p.id !== product.id && (p.categoryId === product.categoryId || p.subCategoryId === product.subCategoryId))
    .slice(0, 3);

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-6">
          <button
            onClick={() => setActiveTab('catalog')}
            className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Catalog</span>
          </button>
          <span>/</span>
          <span className="capitalize">{product.brand}</span>
          <span>/</span>
          <span className="text-slate-900 font-medium truncate max-w-xs">{displayName}</span>
        </div>

        {/* Main Contiguous Purchase Module */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnail list */}
            {product.images.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible shrink-0">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImageIdx === idx
                        ? 'border-amber-800 ring-2 ring-amber-800/20'
                        : 'border-[#E2DC CF] hover:border-amber-600'
                    }`}
                  >
                    <ImageWithFallback
                      src={img}
                      alt={`${product.nameEn} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Primary Image */}
            <div className="relative flex-1 aspect-[3/4] rounded-2xl overflow-hidden bg-[#F2EDE2] border border-[#E5DFD3] shadow-sm">
              <ImageWithFallback
                src={product.images[selectedImageIdx] || product.images[0]}
                alt={displayName}
                fallbackText={displayName}
                className="w-full h-full object-cover object-top"
              />

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:text-rose-600 transition-colors shadow-sm cursor-pointer"
                title="Save to Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${isFavorited ? 'fill-rose-600 text-rose-600' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              {/* Clean metadata line */}
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1">
                <span>{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span className="text-stone-500">SKU: {selectedVariant?.sku || product.sku}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 leading-tight">
                {displayName}
              </h1>

              {/* Star Rating & Reviews */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-amber-500 text-amber-500'
                          : 'fill-stone-200 text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-800 tabular-nums">
                  {product.rating} / 5.0
                </span>
                <span className="text-xs text-stone-400">·</span>
                <button
                  onClick={() => setActiveTabSection('reviews')}
                  className="text-xs text-amber-900 underline hover:text-amber-800 font-medium cursor-pointer"
                >
                  {product.reviewCount} Reviews
                </button>
              </div>
            </div>

            {/* Price Module */}
            <div className="p-4 bg-[#F5EFE4] border border-[#E2D9C8] rounded-xl space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-3xl font-bold text-slate-950 tabular-nums">
                  ₹{product.finalPrice.toLocaleString()}
                </span>
                {totalDiscountPercent > 0 && (
                  <span className="text-sm text-stone-400 line-through tabular-nums">
                    ₹{product.basePrice.toLocaleString()}
                  </span>
                )}
                {totalDiscountPercent > 0 && (
                  <span className="text-xs font-bold text-[#8B2630] tabular-nums">
                    {totalDiscountPercent}% OFF
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                Inclusive of all taxes · Includes regular and festive discounts
              </p>
            </div>

            {/* Free Shipping Progress Indicator Note */}
            <div className="flex items-center gap-2 text-xs text-amber-950 bg-amber-50 border border-amber-200/80 p-3 rounded-lg">
              <Truck className="w-4 h-4 text-amber-800 shrink-0" />
              <span>
                {product.finalPrice >= storeSettings.freeShippingThreshold
                  ? '🎉 This item qualifies for FREE EXPRESS DELIVERY!'
                  : `Add ₹${(storeSettings.freeShippingThreshold - product.finalPrice).toLocaleString()} more to unlock FREE DELIVERY.`}
              </span>
            </div>

            {/* Variant / Size Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-serif font-bold text-slate-900 uppercase tracking-wider">
                    {language === 'ta' ? 'அளவு / வகை' : 'Select Variant / Size'}
                  </span>
                  <span className="text-stone-500 font-medium">
                    {selectedVariant?.size || selectedVariant?.name}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant, idx) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        selectedVariantIdx === idx
                          ? 'border-amber-900 bg-amber-900 text-white shadow-xs'
                          : 'border-stone-300 bg-white text-slate-800 hover:border-amber-700'
                      }`}
                    >
                      {variant.size || variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Stock Info */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-serif font-bold text-slate-900 uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center border border-[#D8D2C5] rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-slate-700 hover:bg-stone-100 text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-slate-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-slate-700 hover:bg-stone-100 text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Availability Status */}
              <div className="text-xs font-medium">
                {isOutOfStock ? (
                  <span className="text-rose-600 font-semibold">Out of Stock</span>
                ) : (
                  <span className="text-emerald-800 flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>In Stock Ready to Dispatch</span>
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons: Add to Bag & Buy Now */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => addToCart(product, selectedVariant, quantity)}
                className={`py-3.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isOutOfStock
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-[#2D1619] hover:bg-[#431B21] text-amber-100 shadow-sm'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>{isOutOfStock ? 'Sold Out' : t.product.addToCart}</span>
              </button>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className={`py-3.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isOutOfStock
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold shadow-sm'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{t.product.buyNow}</span>
              </button>
            </div>

            {/* Trust Assurances */}
            <div className="pt-4 border-t border-[#ECE6D9] grid grid-cols-3 gap-2 text-center text-[11px] text-stone-600">
              <div className="p-2 bg-white rounded-lg border border-[#EDE8DE]">
                <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-amber-800" />
                <span className="font-semibold text-slate-900 block">100% Handloom</span>
                <span>Direct Weaver GI</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-[#EDE8DE]">
                <Truck className="w-4 h-4 mx-auto mb-1 text-amber-800" />
                <span className="font-semibold text-slate-900 block">Express Delivery</span>
                <span>Fast dispatch</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-[#EDE8DE]">
                <RotateCcw className="w-4 h-4 mx-auto mb-1 text-amber-800" />
                <span className="font-semibold text-slate-900 block">7-Day Exchange</span>
                <span>Hassle-free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details, Specs & Reviews Tabs */}
        <div className="mt-16 pt-10 border-t border-[#E8E2D5]">
          <div className="flex items-center gap-6 border-b border-[#E8E2D5] text-sm font-medium">
            <button
              onClick={() => setActiveTabSection('desc')}
              className={`pb-3 transition-colors cursor-pointer ${
                activeTabSection === 'desc'
                  ? 'border-b-2 border-amber-900 text-amber-950 font-bold'
                  : 'text-stone-500 hover:text-slate-900'
              }`}
            >
              Description & Craft
            </button>
            <button
              onClick={() => setActiveTabSection('specs')}
              className={`pb-3 transition-colors cursor-pointer ${
                activeTabSection === 'specs'
                  ? 'border-b-2 border-amber-900 text-amber-950 font-bold'
                  : 'text-stone-500 hover:text-slate-900'
              }`}
            >
              Weave Specifications
            </button>
            <button
              onClick={() => setActiveTabSection('reviews')}
              className={`pb-3 transition-colors cursor-pointer ${
                activeTabSection === 'reviews'
                  ? 'border-b-2 border-amber-900 text-amber-950 font-bold'
                  : 'text-stone-500 hover:text-slate-900'
              }`}
            >
              Customer Reviews ({product.reviews?.length || 0})
            </button>
          </div>

          <div className="py-6">
            {activeTabSection === 'desc' && (
              <div className="space-y-4 max-w-3xl text-sm text-stone-700 leading-relaxed font-sans">
                <p>{displayDesc}</p>
                <div className="bg-[#F5EFE4] p-4 rounded-xl border border-[#E5DFD3] text-xs space-y-1">
                  <span className="font-serif font-bold text-slate-900 uppercase tracking-wider block">
                    Care Instructions
                  </span>
                  <p className="text-stone-600">{displayCare}</p>
                </div>
              </div>
            )}

            {activeTabSection === 'specs' && (
              <div className="max-w-2xl">
                <table className="w-full text-xs text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-stone-200">
                      <td className="py-2.5 font-semibold text-stone-500 w-1/3">Fabric & Weave</td>
                      <td className="py-2.5 text-slate-900 font-medium">{product.fabric}</td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td className="py-2.5 font-semibold text-stone-500">Material Composition</td>
                      <td className="py-2.5 text-slate-900 font-medium">{product.material}</td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td className="py-2.5 font-semibold text-stone-500">Occasion / Style</td>
                      <td className="py-2.5 text-slate-900 font-medium">{product.style}</td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td className="py-2.5 font-semibold text-stone-500">Base SKU</td>
                      <td className="py-2.5 text-slate-900 font-medium tabular-nums">{product.sku}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTabSection === 'reviews' && (
              <div className="space-y-8 max-w-3xl">
                {/* Submit Review */}
                <div className="bg-white p-6 rounded-xl border border-[#E5DFD3]">
                  <h4 className="font-serif text-sm font-bold text-slate-900 mb-3">
                    Write a Verified Review
                  </h4>
                  {reviewSubmitted ? (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold">
                      Thank you for reviewing! Your feedback has been published.
                    </div>
                  ) : (
                    <form onSubmit={handleAddReview} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                            Your Name
                          </label>
                          <input
                            type="text"
                            required
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            placeholder="e.g. Meenakshi"
                            className="w-full text-xs p-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                            Rating
                          </label>
                          <select
                            value={reviewRating}
                            onChange={(e) => setReviewRating(Number(e.target.value))}
                            className="w-full text-xs p-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-800"
                          >
                            <option value="5">⭐⭐⭐⭐⭐ (5 - Exceptional Silk & Weave)</option>
                            <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                            <option value="3">⭐⭐⭐ (3 - Average)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Review Comments
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Describe the fabric quality, color fidelity, packaging..."
                          className="w-full text-xs p-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-800"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#2D1619] text-amber-100 text-xs font-semibold rounded-lg hover:bg-[#431B21] cursor-pointer"
                      >
                        Submit Review
                      </button>
                    </form>
                  )}
                </div>

                {/* Existing Reviews */}
                <div className="space-y-4">
                  {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((rev) => (
                      <div key={rev.id} className="p-4 bg-white rounded-xl border border-[#E5DFD3] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{rev.customerName}</span>
                            {rev.verifiedPurchase && (
                              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                                Verified Buyer
                              </span>
                            )}
                          </div>
                          <span className="text-stone-400 text-[11px] tabular-nums">{rev.date}</span>
                        </div>
                        <div className="flex text-amber-500">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          ))}
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-500">No reviews yet for this creation.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Complementary Creations / Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-10 border-t border-[#E8E2D5]">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mb-6">
              Complementary Creations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

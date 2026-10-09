import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Heart, ShieldCheck, Star, CheckCircle, ZoomIn, X, Truck, MessageCircle, MapPin, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const ProductDetailPage: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const { language, t, products, addToCart, toggleWishlist, isInWishlist, checkPincodeDelivery } = useShop();

  const searchId = id || slug;
  const product = products.find(p => p.id === searchId || p.slug === searchId);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  // Pincode checker state
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<{ checked: boolean; available?: boolean; date?: string }>({ checked: false });

  // Review Form state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewsList, setReviewsList] = useState([
    { name: 'Kavitha R.', rating: 5, comment: 'Stunning silk quality! The zari shimmer is pure gold.', date: '2 days ago' },
    { name: 'Sujatha P.', rating: 5, comment: 'Very soft texture, perfect for long wedding functions.', date: '1 week ago' }
  ]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-serif-luxury font-bold text-[#4A0E17]">Saree Not Found</h2>
        <p className="text-xs text-[#8A7B7E]">The handloom creation you are looking for may have been sold or moved.</p>
        <button
          onClick={() => navigate('/shop')}
          className="px-6 py-2.5 bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold rounded-full hover:bg-[#2D1619] transition shadow-md"
        >
          Return to Handloom Shop
        </button>
      </div>
    );
  }

  const name = language === 'ta' && product.name_ta ? product.name_ta : product.name_en;
  const desc = language === 'ta' && product.description_ta ? product.description_ta : product.description_en;
  const price = product.discount_price || product.price;
  const images = product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80'];
  const activeImage = selectedImage || images[0];
  const inWishlist = isInWishlist(product.id);

  const relatedProducts = products.filter(p => p.id !== product.id && p.category_id === product.category_id).slice(0, 4);

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant || (product.variants[0]?.color));
    navigate('/checkout');
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode) return;
    const res = checkPincodeDelivery(pincode);
    setPincodeStatus({ checked: true, available: res.available, date: res.estimatedDate });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewText) return;
    setReviewsList([
      { name: reviewName, rating: reviewRating, comment: reviewText, date: 'Just now' },
      ...reviewsList
    ]);
    setReviewName('');
    setReviewText('');
  };

  const whatsappMessage = encodeURIComponent(
    `Hi NIRAI, I have an enquiry regarding this handloom creation: ${name} (SKU: ${product.sku || product.id}). Link: https://niraifashions.vercel.app/product/${product.slug}`
  );

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    image: images,
    description: desc,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: 'NIRAI Handloom Silks',
    },
    offers: {
      '@type': 'Offer',
      url: `https://niraifashions.vercel.app/product/${product.slug}`,
      priceCurrency: 'INR',
      price: price,
      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E1012] pb-20 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      <Breadcrumbs
        items={[
          { label: language === 'ta' ? 'அங்காடி' : 'Shop', path: '/shop' },
          { label: name },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Gallery Section */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-[#F2ECDF] rounded-2xl overflow-hidden border border-[#E2D9C8] shadow-lg group">
              <img
                src={activeImage}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Zoom Trigger Button */}
              <button
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-4 right-4 p-3 rounded-full bg-white/90 text-[#2D1619] shadow-md hover:bg-[#4A0E17] hover:text-[#F4E8C1] transition"
                title="Zoom Saree Preview"
              >
                <ZoomIn className="w-5 h-5" />
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition ${
                  inWishlist ? 'bg-[#4A0E17] text-white' : 'bg-white/80 text-[#2D1619] hover:bg-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-white' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                      activeImage === img ? 'border-[#4A0E17] scale-105 shadow-md' : 'border-[#E2D9C8] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="space-y-6">
            <div>
              <div className="inline-block px-3 py-1 bg-[#F4E8C1] text-[#4A0E17] text-xs font-extrabold rounded-full mb-2">
                {product.fabric_type || 'Pure Handloom Silk'}
              </div>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-[#2D1619] leading-tight">
                {name}
              </h1>
              <p className="text-xs text-[#8A7B7E] mt-1">SKU: {product.sku || product.id}</p>
            </div>

            {/* Pricing Box */}
            <div className="p-5 bg-white rounded-2xl border border-[#D4AF37]/50 shadow-sm space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-[#4A0E17]">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                {product.discount_price && (
                  <span className="text-sm text-[#8A7B7E] line-through font-medium">
                    MRP ₹{product.price.toLocaleString('en-IN')}
                  </span>
                )}
                {product.discount_price && (
                  <span className="bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Save ₹{(product.price - product.discount_price).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#0B6623] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Inclusive of all taxes & Silk Mark Verification</span>
              </p>
            </div>

            {/* Stock Availability Indicator */}
            {product.stock_quantity > 0 ? (
              <div className="flex items-center gap-2 text-xs font-bold text-[#0B6623]">
                <CheckCircle className="w-4 h-4 text-[#0B6623]" />
                <span>{product.stock_quantity <= 5 ? t('stockAlert', { count: product.stock_quantity }) : t('inStock')}</span>
              </div>
            ) : (
              <div className="text-xs font-bold text-[#800020]">{t('outOfStock')}</div>
            )}

            {/* Pincode Delivery Check */}
            <div className="p-4 bg-white rounded-xl border border-[#E2D9C8] space-y-2">
              <label className="text-xs font-bold text-[#2D1619] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#4A0E17]" />
                <span>Check Express Delivery Availability</span>
              </label>
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 text-xs px-3 py-2 border border-[#D4AF37]/50 rounded-lg focus:outline-none focus:border-[#4A0E17]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold rounded-lg hover:bg-[#2D1619] transition"
                >
                  Check
                </button>
              </form>
              {pincodeStatus.checked && (
                <div className="text-xs mt-2">
                  {pincodeStatus.available ? (
                    <p className="text-[#0B6623] font-semibold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Express Shipping Available! Estimated Delivery: {pincodeStatus.date}</span>
                    </p>
                  ) : (
                    <p className="text-[#800020] font-semibold">Standard 5-7 days delivery available across India.</p>
                  )}
                </div>
              )}
            </div>

            {/* Color Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2D1619] uppercase tracking-wider block">
                  {t('colorVariants')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(v.color)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
                        (selectedVariant || product.variants[0]?.color) === v.color
                          ? 'bg-[#4A0E17] text-[#F4E8C1] border-[#4A0E17] shadow-md'
                          : 'bg-white text-[#2D1619] border-[#E2D9C8] hover:bg-[#ECE6D9]'
                      }`}
                    >
                      {v.color_code && (
                        <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: v.color_code }} />
                      )}
                      <span>{v.color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#2D1619] uppercase tracking-wider block">
                {t('quantity')}
              </label>
              <div className="flex items-center border border-[#D4AF37]/50 rounded-xl overflow-hidden w-fit bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2 text-[#4A0E17] hover:bg-[#ECE6D9] font-bold text-sm transition"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-[#2D1619]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3.5 py-2 text-[#4A0E17] hover:bg-[#ECE6D9] font-bold text-sm transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => addToCart(product, quantity, selectedVariant || product.variants[0]?.color)}
                className="flex-1 py-3.5 bg-[#2D1619] text-[#F4E8C1] font-bold text-sm rounded-xl hover:bg-[#4A0E17] transition shadow-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                <span>{t('addToCart')}</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#2D1619] font-extrabold text-sm rounded-xl hover:shadow-xl transition shadow-md"
              >
                {t('buyNow')}
              </button>

              <a
                href={`https://wa.me/919876543210?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3.5 bg-[#25D366] text-white font-bold text-xs rounded-xl hover:bg-[#1EBE5B] transition shadow flex items-center justify-center gap-1.5"
                title="Enquire on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                <span className="hidden xl:inline">Enquire</span>
              </a>
            </div>

            {/* Saree Weave Specifications */}
            <div className="p-5 bg-white rounded-2xl border border-[#E2D9C8] space-y-3">
              <h4 className="font-serif-luxury text-sm font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-2">
                {t('fabricDetails')}
              </h4>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-[#8A7B7E]">Fabric Material:</span>
                <span className="font-semibold text-[#2D1619]">{product.fabric_type || 'Pure Mulberry Silk'}</span>
                
                <span className="text-[#8A7B7E]">Zari Crafting:</span>
                <span className="font-semibold text-[#2D1619]">High Density Golden Zari Motifs</span>
                
                <span className="text-[#8A7B7E]">Blouse Piece:</span>
                <span className="font-semibold text-[#2D1619]">Included (Unstitched 80cm)</span>
                
                <span className="text-[#8A7B7E]">Saree Length:</span>
                <span className="font-semibold text-[#2D1619]">6.3 Meters with Blouse</span>

                <span className="text-[#8A7B7E]">Origin:</span>
                <span className="font-semibold text-[#2D1619]">Salem Weaver Cluster, Tamil Nadu</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="font-serif-luxury text-sm font-bold text-[#2D1619]">
                Weaver Description
              </h4>
              <p className="text-xs text-[#4A0E17] leading-relaxed bg-[#FBF9F5] p-4 rounded-xl border border-[#E2D9C8]">
                {desc}
              </p>
            </div>

          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 border-t border-[#E2D9C8] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-luxury text-xl font-bold text-[#2D1619] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <span>You May Also Like</span>
              </h3>
              <Link to="/shop" className="text-xs font-bold text-[#4A0E17] hover:underline">
                View All Handlooms →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/product/${rel.slug || rel.id}`}
                  className="bg-white rounded-2xl border border-[#E2D9C8] overflow-hidden shadow-sm hover:shadow-md transition group"
                >
                  <div className="aspect-[3/4] bg-[#F2ECDF] overflow-hidden relative">
                    <img
                      src={rel.images[0]}
                      alt={rel.name_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-bold text-[#2D1619] truncate">{rel.name_en}</p>
                    <p className="text-xs font-extrabold text-[#4A0E17]">
                      ₹{(rel.discount_price || rel.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="pt-10 border-t border-[#E2D9C8] space-y-6">
          <h3 className="font-serif-luxury text-xl font-bold text-[#2D1619]">
            {t('customerReviews')} ({reviewsList.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Add Review Form */}
            <form onSubmit={handleAddReview} className="p-5 bg-white rounded-2xl border border-[#E2D9C8] space-y-4">
              <h4 className="text-xs font-bold text-[#2D1619] uppercase tracking-wider">
                {t('writeReview')}
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full text-xs px-3 py-2 border border-[#D4AF37]/50 rounded-lg"
                  required
                />
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this saree..."
                  rows={3}
                  className="w-full text-xs p-3 border border-[#D4AF37]/50 rounded-lg"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-[#2D1619] text-[#F4E8C1] text-xs font-bold rounded-lg hover:bg-[#4A0E17]"
              >
                Submit Review
              </button>
            </form>

            {/* Review Feed */}
            <div className="space-y-4">
              {reviewsList.map((rev, idx) => (
                <div key={idx} className="p-4 bg-white rounded-xl border border-[#E2D9C8] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2D1619]">{rev.name}</span>
                    <span className="text-[#8A7B7E] text-[10px]">{rev.date}</span>
                  </div>
                  <div className="flex text-[#D4AF37]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37]" />
                    ))}
                  </div>
                  <p className="text-xs text-[#4A0E17]">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Image Zoom Modal */}
        {isZoomOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 text-white p-2 hover:text-[#D4AF37]"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={activeImage}
              alt={name}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}

      </div>

      {/* Sticky Mobile Add-to-Cart Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#2D1619] border-t border-[#D4AF37]/40 p-3 flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <p className="text-[10px] text-[#D5CEBF]">Price</p>
          <p className="text-base font-extrabold text-[#F4E8C1]">₹{price.toLocaleString('en-IN')}</p>
        </div>
        <div className="flex gap-2 flex-1 justify-end">
          <button
            onClick={() => addToCart(product, quantity, selectedVariant || product.variants[0]?.color)}
            className="px-3.5 py-2 bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Add to Cart</span>
          </button>
          <button
            onClick={handleBuyNow}
            className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#2D1619] text-xs font-extrabold rounded-xl shadow"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

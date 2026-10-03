import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Heart, CheckCircle } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import type { Product } from '../../types';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { language, t, addToCart, toggleWishlist, isInWishlist } = useShop();
  const navigate = useNavigate();

  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity] = useState<number>(1);

  if (!product) return null;

  const name = language === 'ta' && product.name_ta ? product.name_ta : product.name_en;
  const desc = language === 'ta' && product.description_ta ? product.description_ta : product.description_en;
  const price = product.discount_price || product.price;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant || (product.variants[0]?.color));
    onClose();
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant || (product.variants[0]?.color));
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative border-2 border-[#D4AF37] shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8A7B7E] hover:text-[#2D1619] rounded-full hover:bg-[#F2ECDF] transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image preview */}
          <div className="aspect-[3/4] bg-[#F2ECDF] rounded-2xl overflow-hidden border border-[#E2D9C8]">
            <img src={product.images[0]} alt={name} className="w-full h-full object-cover" />
          </div>

          {/* Product Quick Info */}
          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#8A7B7E] uppercase tracking-wider block">
                {product.fabric_type || 'Pure Silk'}
              </span>
              <h3 className="font-serif-luxury text-xl font-bold text-[#2D1619] mt-1">
                {name}
              </h3>
              <p className="text-xs text-[#6B5B5E] mt-2 line-clamp-3">
                {desc}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#4A0E17]">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {product.discount_price && (
                <span className="text-xs text-[#8A7B7E] line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B6623]">
              <CheckCircle className="w-4 h-4 text-[#0B6623]" />
              <span>{product.stock_quantity > 0 ? `${product.stock_quantity} available in weaver stock` : 'Out of Stock'}</span>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-[#2D1619] uppercase tracking-wider block">
                  Color Options:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(v.color)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                        (selectedVariant || product.variants[0]?.color) === v.color
                          ? 'bg-[#4A0E17] text-[#F4E8C1] border-[#4A0E17]'
                          : 'bg-white text-[#2D1619] border-[#E2D9C8]'
                      }`}
                    >
                      {v.color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-[#F2ECDF]">
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 bg-[#2D1619] text-[#F4E8C1] font-bold text-xs rounded-xl hover:bg-[#4A0E17] flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t('addToCart')}</span>
                </button>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3 rounded-xl border transition ${
                    inWishlist ? 'bg-[#800020] text-white border-[#800020]' : 'border-[#E2D9C8] text-[#2D1619] hover:bg-[#F2ECDF]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-white' : ''}`} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#2D1619] font-extrabold text-xs rounded-xl hover:shadow-lg"
              >
                {t('buyNow')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

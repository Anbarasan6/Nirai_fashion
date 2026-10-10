import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { Product, ProductVariant } from '../../types';
import { generateTamilProductDetails } from '../../services/translator';
import { MediaUploadModal } from '../common/MediaUploadModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  X,
  Check,
  AlertTriangle,
  Lock,
  Star,
  UploadCloud,
} from 'lucide-react';

export const ProductManager: React.FC = () => {
  const { showToast, refreshData } = useShop();

  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const categories = StorageService.getCategories();
  const suppliers = StorageService.getSuppliers();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [reviewingProduct, setReviewingProduct] = useState<Product | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Form State
  const [sku, setSku] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-sarees');
  const [brand, setBrand] = useState('Nirai Heritage');
  const [basePrice, setBasePrice] = useState(2500);
  const [regularDiscount, setRegularDiscount] = useState(15);
  const [specialDiscount, setSpecialDiscount] = useState(0);
  const [stock, setStock] = useState(10);
  const [lowStockThreshold, setLowStockThreshold] = useState(3);
  const [fabric, setFabric] = useState('Pure Mulberry Silk');
  const [material, setMaterial] = useState('100% Silk with Zari');
  const [style, setStyle] = useState('Bridal & Festival Ceremonial');
  const [descEn, setDescEn] = useState('');
  const [descTa, setDescTa] = useState('');
  const [careEn, setCareEn] = useState('Dry clean only. Store wrapped in soft muslin.');
  const [careTa, setCareTa] = useState('டிரை கிளீன் மட்டும் செய்யவும்.');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Internal Sourcing (ADMIN ONLY)
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || 'sup-1');
  const [purchaseCost, setPurchaseCost] = useState(1200);
  const [internalNotes, setInternalNotes] = useState('');

  const syncProducts = () => {
    const list = StorageService.getProducts();
    setProducts(list);
    refreshData();
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setSku(`NIR-ETN-${Math.floor(100 + Math.random() * 900)}`);
    setNameEn('');
    setNameTa('');
    setDescEn('Artisanal South Indian traditional handloom attire, woven with precision for timeless elegance.');
    setDescTa('');
    setBasePrice(3499);
    setRegularDiscount(15);
    setSpecialDiscount(0);
    setStock(15);
    setLowStockThreshold(4);
    setFabric('Pure Combed Cotton');
    setMaterial('100% Cotton');
    setStyle('Festive Ceremonial');
    setImageUrl('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80');
    setPurchaseCost(1400);
    setInternalNotes('Sourced from master weaver cooperative.');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setSku(product.sku);
    setNameEn(product.nameEn);
    setNameTa(product.nameTa);
    setCategoryId(product.categoryId);
    setBrand(product.brand);
    setBasePrice(product.basePrice);
    setRegularDiscount(product.regularDiscount);
    setSpecialDiscount(product.specialDiscount || 0);
    setStock(product.stock);
    setLowStockThreshold(product.lowStockThreshold);
    setFabric(product.fabric);
    setMaterial(product.material);
    setStyle(product.style);
    setDescEn(product.descriptionEn);
    setDescTa(product.descriptionTa);
    setCareEn(product.careInstructionsEn);
    setCareTa(product.careInstructionsTa);
    setImageUrl(product.images[0] || '');
    setIsFeatured(product.isFeatured);
    setIsActive(product.isActive);
    setSupplierId(product.supplierId || suppliers[0]?.id || '');
    setPurchaseCost(product.purchaseCost || 0);
    setInternalNotes(product.internalNotes || '');
    setIsModalOpen(true);
  };

  const handleAutoTranslateTamil = () => {
    if (!nameEn.trim()) {
      showToast('Please enter an English product name first', 'info');
      return;
    }
    const result = generateTamilProductDetails(nameEn, descEn, fabric, style);
    setNameTa(result.nameTa);
    setDescTa(result.descriptionTa);
    setCareTa(result.careInstructionsTa);
    showToast('Tamil terminology generated! You may edit it further.', 'success');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !sku.trim()) return;

    // Recalculate final price
    const regularOff = (basePrice * regularDiscount) / 100;
    const priceAfterRegular = basePrice - regularOff;
    const specialOff = (priceAfterRegular * specialDiscount) / 100;
    const finalPrice = Math.round(priceAfterRegular - specialOff);

    const productPayload: Product = {
      id: editingProduct?.id || `prod-${Date.now()}`,
      sku,
      nameEn,
      nameTa: nameTa || nameEn,
      slug: (editingProduct?.slug || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')),
      descriptionEn: descEn,
      descriptionTa: descTa || descEn,
      shortDescEn: `${fabric} - Traditional handloom attire.`,
      shortDescTa: `${fabric} - பாரம்பரிய கைத்தறி ஆடை.`,
      categoryId,
      brand,
      images: imageUrl.split(',').map((u) => u.trim()).filter(Boolean).length > 0
        ? imageUrl.split(',').map((u) => u.trim()).filter(Boolean)
        : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
      basePrice: Number(basePrice),
      regularDiscount: Number(regularDiscount),
      specialDiscount: Number(specialDiscount),
      finalPrice,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      isFeatured,
      isActive,
      fabric,
      material,
      style,
      careInstructionsEn: careEn,
      careInstructionsTa: careTa,
      variants: editingProduct?.variants || [
        {
          id: `var-${Date.now()}`,
          name: 'Standard Free Size',
          size: 'Free Size',
          color: 'Traditional Tone',
          sku: `${sku}-STD`,
          stock: Number(stock),
        },
      ],
      rating: editingProduct?.rating || 4.8,
      reviewCount: editingProduct?.reviewCount || 1,
      reviews: editingProduct?.reviews || [],
      supplierId,
      purchaseCost: Number(purchaseCost),
      internalNotes,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveProduct(productPayload);
    syncProducts();
    setIsModalOpen(false);
    showToast(editingProduct ? 'Product updated successfully' : 'Product created successfully', 'success');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This will remove it from the customer storefront.`)) {
      StorageService.deleteProduct(id);
      syncProducts();
      showToast('Product removed from catalog', 'info');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by name, SKU, or fabric..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs p-2.5 pl-9 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-900"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-3" />
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Handloom Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">SKU & Category</th>
                <th className="py-3 px-4 font-semibold">Pricing (MRP / Final)</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 font-semibold">Wholesale Cost (Admin)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= p.lowStockThreshold;
                const cat = categories.find((c) => c.id === p.categoryId);

                return (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]}
                          alt={p.nameEn}
                          className="w-10 h-12 object-cover object-top rounded-md bg-stone-100 shrink-0"
                        />
                        <div>
                          <span className="font-serif font-bold text-slate-900 block line-clamp-1">
                            {p.nameEn}
                          </span>
                          <span className="text-[11px] text-stone-500 font-serif block">
                            {p.nameTa}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-slate-800 block">{p.sku}</span>
                      <span className="text-[11px] text-stone-500">{cat?.nameEn || p.categoryId}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-baseline gap-1.5 font-serif font-bold text-slate-900 tabular-nums">
                        <span>₹{p.finalPrice.toLocaleString()}</span>
                        <span className="text-[11px] text-stone-400 line-through">
                          ₹{p.basePrice.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8B2630] font-semibold tabular-nums">
                        {p.regularDiscount + (p.specialDiscount || 0)}% off total
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold tabular-nums ${
                            p.stock <= 0
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {p.stock} units
                        </span>
                        {isLow && (
                          <span title="Low stock alert">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-stone-700">
                        <Lock className="w-3 h-3 text-amber-800" />
                        <span className="font-mono font-semibold tabular-nums">
                          ₹{p.purchaseCost?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        Margin: ₹{((p.finalPrice || 0) - (p.purchaseCost || 0)).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReviewingProduct(p)}
                          className="px-2 py-1 text-stone-600 hover:text-amber-900 rounded hover:bg-stone-100 flex items-center gap-1 text-[11px] font-medium"
                          title="Manage Customer Reviews"
                        >
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{p.reviews?.length || 0}</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-stone-600 hover:text-amber-900 rounded hover:bg-stone-100"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.nameEn)}
                          className="p-1.5 text-stone-600 hover:text-rose-600 rounded hover:bg-stone-100"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-2xl w-full max-w-3xl overflow-hidden my-8">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900">
                  {editingProduct ? 'Edit Handloom Product' : 'Add Handloom Product to Catalog'}
                </h3>
                <span className="text-xs text-stone-500">
                  All changes immediately synchronize to the customer storefront.
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">English Product Name *</label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Kanchipuram Pure Silk Temple Saree"
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
              </div>

              {/* Tamil Name & AI Translation Tool */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-amber-950">
                    Tamil Product Name (தமிழ் பெயர்)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoTranslateTamil}
                    className="px-2.5 py-1 bg-amber-900 hover:bg-amber-950 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Auto-Generate Tamil</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={nameTa}
                  onChange={(e) => setNameTa(e.target.value)}
                  placeholder="e.g. காஞ்சிபுரம் தூய பட்டுப் புடவை"
                  className="w-full p-2 border border-amber-300 rounded-md bg-white font-serif"
                />
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn} (Level {c.level})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Brand Collection</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md bg-white"
                  >
                    <option value="Nirai Heritage">Nirai Heritage (Silks)</option>
                    <option value="Nirai Parampara">Nirai Parampara (Dhotis & Sets)</option>
                    <option value="Nirai Everyday">Nirai Everyday (Cottons)</option>
                    <option value="Nirai Contemporary">Nirai Contemporary (Linens)</option>
                    <option value="Nirai Kutties">Nirai Kutties (Kids)</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Dual Discounts */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <span className="font-serif font-bold text-slate-900 block">
                  Dual Pricing & Discount Engine
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Base MRP (₹) *</label>
                    <input
                      type="number"
                      required
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      className="w-full p-2 border border-stone-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Regular Disc. (%)</label>
                    <input
                      type="number"
                      value={regularDiscount}
                      onChange={(e) => setRegularDiscount(Number(e.target.value))}
                      className="w-full p-2 border border-stone-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Special Disc. (%)</label>
                    <input
                      type="number"
                      value={specialDiscount}
                      onChange={(e) => setSpecialDiscount(Number(e.target.value))}
                      className="w-full p-2 border border-stone-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Final Store Price</label>
                    <div className="p-2 bg-amber-100/70 border border-amber-300 rounded-md font-serif font-bold text-amber-950 tabular-nums">
                      ₹
                      {Math.round(
                        (basePrice * (1 - regularDiscount / 100)) * (1 - specialDiscount / 100)
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock & Low Stock Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Low-Stock Alert Level</label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
              </div>

              {/* Fabric Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Fabric & Weave</label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Material</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Style / Occasion</label>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">English Description</label>
                <textarea
                  rows={2}
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tamil Description</label>
                <textarea
                  rows={2}
                  value={descTa}
                  onChange={(e) => setDescTa(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-md font-serif"
                />
              </div>

              {/* Image URL(s) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-stone-700">
                    Product Image URLs (comma-separated for multi-angle gallery)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Browse Cloud Media</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://...image1.jpg, https://...image2.jpg"
                  className="w-full p-2 border border-stone-300 rounded-md text-xs font-mono"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Add multiple image URLs separated by commas. Recommended: 1000 × 1200 px (5:6 aspect ratio) for handloom draping fidelity.
                </span>
              </div>

              {/* Internal Supplier Sourcing (Strictly Isolated Admin Layer) */}
              <div className="p-4 bg-amber-900/5 border border-amber-900/20 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Internal Supplier Sourcing Layer (Concealed from Storefront)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Sourcing Partner</label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-md bg-white"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Wholesale Cost (₹)</label>
                    <input
                      type="number"
                      value={purchaseCost}
                      onChange={(e) => setPurchaseCost(Number(e.target.value))}
                      className="w-full p-2 border border-stone-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Flags */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-amber-900"
                  />
                  <span>Mark as Featured Creation</span>
                </label>
                <label className="flex items-center gap-2 font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-amber-900"
                  />
                  <span>Active on Storefront</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Handloom Creation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Reviews Management Modal */}
      {reviewingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-stone-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Customer Reviews</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                  {reviewingProduct.nameEn} ({reviewingProduct.sku})
                </p>
              </div>
              <button
                onClick={() => setReviewingProduct(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold text-slate-900">
                  {reviewingProduct.rating} / 5.0
                </span>
                <span className="text-stone-600">
                  ({reviewingProduct.reviews?.length || 0} verified rating{reviewingProduct.reviews?.length !== 1 ? 's' : ''})
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">
                Admin Moderation Active
              </span>
            </div>

            {/* List of Reviews */}
            <div className="space-y-3 pt-2">
              {(!reviewingProduct.reviews || reviewingProduct.reviews.length === 0) ? (
                <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-400">
                  No customer reviews have been submitted for this product yet.
                </div>
              ) : (
                reviewingProduct.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2 relative group hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rev.customerName}</span>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-stone-400">{rev.date}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Remove review by ${rev.customerName}?`)) {
                              StorageService.deleteReview(reviewingProduct.id, rev.id);
                              syncProducts();
                              const updated = StorageService.getProductById(reviewingProduct.id);
                              setReviewingProduct(updated || null);
                              showToast('Customer review removed', 'info');
                            }
                          }}
                          className="text-stone-400 hover:text-rose-600 p-1 rounded hover:bg-stone-200 transition-colors"
                          title="Delete / Moderate Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-stone-700 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setReviewingProduct(null)}
                className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Close Reviews
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Image Media Modal */}
      <MediaUploadModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelectImage={(url) => {
          if (imageUrl) {
            setImageUrl(`${imageUrl}, ${url}`);
          } else {
            setImageUrl(url);
          }
        }}
        category="products"
        title="Select Product Photography"
        aspectRatioNote="Recommended: 1000 × 1200 px (5:6 aspect ratio) for crisp handloom textures"
      />
    </div>
  );
};

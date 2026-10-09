import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Search, X } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import type { Product, ProductVariant } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const { products, categories } = useShop();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat_elampillai');
  const [price, setPrice] = useState<number>(4999);
  const [discountPrice, setDiscountPrice] = useState<number>(3999);
  const [fabricType, setFabricType] = useState('Elampillai Soft Silk');
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [isInStock, setIsInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [descEn, setDescEn] = useState('');
  const [descTa, setDescTa] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);

  // Variant Editor state
  const [variants, setVariants] = useState<ProductVariant[]>([
    { color: 'Maroon', color_code: '#4A0E17', stock: 5 }
  ]);

  const openAddModal = () => {
    setEditingProduct(null);
    setNameEn('');
    setNameTa('');
    setSku(`NIR-SLK-${Math.floor(100 + Math.random() * 900)}`);
    setPrice(4999);
    setDiscountPrice(3999);
    setFabricType('Elampillai Soft Silk');
    setStockQuantity(10);
    setIsInStock(true);
    setIsFeatured(false);
    setIsNewArrival(true);
    setDescEn('');
    setDescTa('');
    setImages(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']);
    setVariants([{ color: 'Royal Maroon', color_code: '#4A0E17', stock: 5 }]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setNameEn(p.name_en);
    setNameTa(p.name_ta || '');
    setSku(p.sku || '');
    setCategoryId(p.category_id || categories[0]?.id);
    setPrice(p.price);
    setDiscountPrice(p.discount_price || 0);
    setFabricType(p.fabric_type || 'Pure Silk');
    setStockQuantity(p.stock_quantity);
    setIsInStock(p.is_in_stock);
    setIsFeatured(p.is_featured);
    setIsNewArrival(p.is_new_arrival);
    setDescEn(p.description_en || '');
    setDescTa(p.description_ta || '');
    setImages(p.images.length > 0 ? p.images : []);
    setVariants(p.variants.length > 0 ? p.variants : [{ color: 'Default', stock: p.stock_quantity }]);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadToCloudinary(files[i]);
        uploadedUrls.push(url);
      }
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.warn('Cloudinary upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;
    const prodId = editingProduct?.id || `prod_${Date.now()}`;

    const newProduct: Product = {
      id: prodId,
      sku,
      slug,
      name_en: nameEn,
      name_ta: nameTa,
      description_en: descEn,
      description_ta: descTa,
      category_id: categoryId,
      price: Number(price),
      discount_price: discountPrice ? Number(discountPrice) : undefined,
      fabric_type: fabricType,
      is_in_stock: isInStock,
      stock_quantity: Number(stockQuantity),
      is_featured: isFeatured,
      is_new_arrival: isNewArrival,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
      variants
    };

    await StorageService.saveProduct(newProduct);
    setIsModalOpen(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this saree product from inventory?')) {
      await StorageService.deleteProduct(id);
    }
  };

  const handleExportCSV = () => {
    const headers = ['id', 'sku', 'name_en', 'name_ta', 'price', 'discount_price', 'fabric_type', 'stock_quantity', 'category_id', 'description_en'];
    const rows = products.map(p => [
      p.id,
      p.sku || '',
      `"${(p.name_en || '').replace(/"/g, '""')}"`,
      `"${(p.name_ta || '').replace(/"/g, '""')}"`,
      p.price,
      p.discount_price || '',
      `"${(p.fabric_type || '').replace(/"/g, '""')}"`,
      p.stock_quantity,
      p.category_id || '',
      `"${(p.description_en || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nirai_products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) return;

      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 5) {
          const skuVal = parts[1]?.replace(/"/g, '') || `NIR-CSV-${Date.now()}-${i}`;
          const nameVal = parts[2]?.replace(/"/g, '') || `CSV Handloom ${i}`;
          const priceVal = Number(parts[4]) || 3999;
          const stockVal = Number(parts[7]) || 10;

          const newProd: Product = {
            id: `prod_csv_${Date.now()}_${i}`,
            sku: skuVal,
            slug: nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name_en: nameVal,
            name_ta: parts[3]?.replace(/"/g, '') || nameVal,
            description_en: parts[9]?.replace(/"/g, '') || 'Imported handloom silk saree.',
            category_id: parts[8]?.replace(/"/g, '') || 'cat_elampillai',
            price: priceVal,
            discount_price: parts[5] ? Number(parts[5]) : undefined,
            fabric_type: parts[6]?.replace(/"/g, '') || 'Pure Silk',
            is_in_stock: stockVal > 0,
            stock_quantity: stockVal,
            is_featured: false,
            is_new_arrival: true,
            images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
            variants: [{ color: 'Standard', stock: stockVal }]
          };

          await StorageService.saveProduct(newProd);
          importedCount++;
        }
      }

      alert(`Successfully imported ${importedCount} products into inventory!`);
    };
    reader.readAsText(file);
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.name_en.toLowerCase().includes(q) || p.name_ta?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm">
        <div>
          <h2 className="font-serif-luxury text-xl font-bold text-[#2D1619]">
            Product & Saree Inventory Manager
          </h2>
          <p className="text-xs text-[#8A7B7E]">Manage silk variants, pricing, bulk CSV import/export, and Cloudinary media uploads</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU or Name..."
              className="w-full text-xs pl-3 pr-8 py-2 border border-[#D4AF37]/50 rounded-xl"
            />
            <Search className="w-4 h-4 text-[#8A7B7E] absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#F4E8C1] text-[#4A0E17] text-xs font-bold rounded-xl hover:bg-[#EADBAB] transition flex items-center gap-1 shrink-0"
            title="Export catalog to CSV"
          >
            <span>Export CSV</span>
          </button>

          <label className="px-3.5 py-2 bg-[#F4E8C1] text-[#4A0E17] text-xs font-bold rounded-xl hover:bg-[#EADBAB] transition cursor-pointer flex items-center gap-1 shrink-0">
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-[#2D1619] text-[#F4E8C1] text-xs font-bold rounded-xl hover:bg-[#4A0E17] flex items-center gap-1.5 shrink-0 shadow"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Add New Saree</span>
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-[#E2D9C8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2D9C8] text-[11px] font-bold text-[#8A7B7E] uppercase bg-[#FBF9F5]">
                <th className="py-3 px-4">Image</th>
                <th className="py-3 px-4">Name (EN / TA)</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Fabric</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECDF] text-xs">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-[#FBF9F5]">
                  <td className="py-3 px-4">
                    <img
                      src={prod.images[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80'}
                      alt={prod.name_en}
                      className="w-10 h-12 object-cover rounded-lg border border-[#E2D9C8]"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#2D1619]">{prod.name_en}</div>
                    {prod.name_ta && <div className="text-[11px] text-[#4A0E17]">{prod.name_ta}</div>}
                  </td>
                  <td className="py-3 px-4 font-mono">{prod.sku || prod.id}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#4A0E17]">₹{(prod.discount_price || prod.price).toLocaleString('en-IN')}</span>
                    {prod.discount_price && <span className="text-[10px] text-[#8A7B7E] block line-through">₹{prod.price}</span>}
                  </td>
                  <td className="py-3 px-4">{prod.fabric_type}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      prod.stock_quantity <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {prod.stock_quantity} left
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 text-[#2D1619] hover:bg-[#F4E8C1] rounded-lg transition"
                        title="Edit Saree"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Saree"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 border-2 border-[#D4AF37] shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#F2ECDF] pb-3">
              <h3 className="font-serif-luxury text-lg font-bold text-[#2D1619]">
                {editingProduct ? 'Edit Silk Saree Details' : 'Add New Handloom Saree'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8A7B7E] hover:text-[#2D1619]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">English Name *</label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Royal Maroon Elampillai Silk"
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Tamil Name (தமிழ்)</label>
                  <input
                    type="text"
                    value={nameTa}
                    onChange={(e) => setNameTa(e.target.value)}
                    placeholder="e.g. ராயல் மரூன் இளம்பிள்ளை பட்டு"
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name_en}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Original MRP Price (₹) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-bold text-[#4A0E17]"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Special Discount Price (₹)</label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-bold text-green-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Fabric Type</label>
                  <input
                    type="text"
                    value={fabricType}
                    onChange={(e) => setFabricType(e.target.value)}
                    placeholder="Elampillai Soft Silk / Kanchipuram"
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Cloudinary Image Upload */}
              <div className="p-4 bg-[#FBF9F5] rounded-xl border border-[#E2D9C8] space-y-3">
                <label className="font-bold text-[#2D1619] block">
                  Saree Images (Cloudinary CDN Upload)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-xs text-[#6B5B5E] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#2D1619] file:text-[#F4E8C1]"
                  />
                  {uploading && <span className="text-xs text-[#D4AF37] animate-pulse">Uploading...</span>}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Or paste image URL"
                    className="flex-1 p-2 border border-[#D4AF37]/50 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="px-3 py-2 bg-[#2D1619] text-[#F4E8C1] rounded-xl font-bold"
                  >
                    Add URL
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-20 rounded-lg overflow-hidden border border-[#E2D9C8]">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#2D1619] text-[#F4E8C1] font-bold text-sm rounded-xl hover:bg-[#4A0E17]"
              >
                Save Saree Inventory
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

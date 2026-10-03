import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import type { Category } from '../../types';

export const AdminCategoriesPage: React.FC = () => {
  const { categories } = useShop();
  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descTa, setDescTa] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn) return;

    const id = editingId || `cat_${nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
    const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const category: Category = {
      id,
      name_en: nameEn,
      name_ta: nameTa,
      slug,
      image_url: imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      description_en: descEn,
      description_ta: descTa,
      is_active: true
    };

    await StorageService.saveCategory(category);
    resetForm();
  };

  const handleEdit = (c: Category) => {
    setEditingId(c.id);
    setNameEn(c.name_en);
    setNameTa(c.name_ta || '');
    setImageUrl(c.image_url || '');
    setDescEn(c.description_en || '');
    setDescTa(c.description_ta || '');
  };

  const resetForm = () => {
    setEditingId(null);
    setNameEn('');
    setNameTa('');
    setImageUrl('');
    setDescEn('');
    setDescTa('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Category List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
        <h2 className="font-serif-luxury text-lg font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-3">
          Saree Categories Manager
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="p-4 bg-[#FBF9F5] rounded-xl border border-[#E2D9C8] flex gap-3">
              <img src={c.image_url} alt={c.name_en} className="w-16 h-20 object-cover rounded-lg border border-[#E2D9C8] shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-[#2D1619]">{c.name_en}</h4>
                {c.name_ta && <p className="text-[11px] text-[#4A0E17] font-semibold">{c.name_ta}</p>}
                <p className="text-[10px] text-[#8A7B7E] line-clamp-2 mt-1">{c.description_en}</p>
                <button
                  onClick={() => handleEdit(c)}
                  className="mt-2 text-xs text-[#4A0E17] font-bold underline hover:text-[#2D1619]"
                >
                  Edit Category
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Form */}
      <form onSubmit={handleSaveCategory} className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4 text-xs h-fit">
        <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-2">
          {editingId ? 'Edit Category' : 'Add New Category'}
        </h3>

        <div>
          <label className="font-bold text-[#2D1619] block mb-1">Category Name (English) *</label>
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="e.g. Designer Soft Silks"
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
            placeholder="e.g. டிசைனர் சாஃப்ட் பட்டு"
            className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
          />
        </div>

        <div>
          <label className="font-bold text-[#2D1619] block mb-1">Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
          />
        </div>

        <div>
          <label className="font-bold text-[#2D1619] block mb-1">English Description</label>
          <textarea
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            rows={2}
            className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 py-3 bg-[#2D1619] text-[#F4E8C1] font-bold rounded-xl hover:bg-[#4A0E17]"
          >
            Save Category
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-3 bg-[#ECE6D9] text-[#2D1619] font-bold rounded-xl"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

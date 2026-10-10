import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { Category } from '../../types';
import { MediaUploadModal } from '../common/MediaUploadModal';
import { Plus, Edit2, Trash2, X, Layers, Image as ImageIcon, ArrowUp, ArrowDown, UploadCloud } from 'lucide-react';

export const CategoryManager: React.FC = () => {
  const { showToast, refreshData } = useShop();
  const [categories, setCategories] = useState<Category[]>(() => StorageService.getCategories());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Form
  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [parentId, setParentId] = useState<string>('');
  const [image, setImage] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descTa, setDescTa] = useState('');
  const [isActive, setIsActive] = useState(true);

  const syncCategories = () => {
    setCategories(StorageService.getCategories());
    refreshData();
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setNameEn('');
    setNameTa('');
    setLevel(2);
    setParentId('cat-women');
    setImage('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&h=1000&q=80');
    setDescEn('Fine traditional handloom attire.');
    setDescTa('பாரம்பரிய கைத்தறி ஆடைகள்.');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setNameEn(c.nameEn);
    setNameTa(c.nameTa);
    setLevel(c.level);
    setParentId(c.parentId || '');
    setImage(c.image);
    setDescEn(c.descriptionEn || '');
    setDescTa(c.descriptionTa || '');
    setIsActive(c.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    const payload: Category = {
      id: editingCategory?.id || `cat-${Date.now()}`,
      slug: editingCategory?.slug || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      nameEn,
      nameTa: nameTa || nameEn,
      level,
      parentId: parentId || null,
      image: image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&h=1000&q=80',
      descriptionEn: descEn,
      descriptionTa: descTa,
      isActive,
      itemCount: editingCategory?.itemCount || 0,
      order: editingCategory?.order || categories.length + 1,
    };

    StorageService.saveCategory(payload);
    syncCategories();
    setIsModalOpen(false);
    showToast(editingCategory ? 'Category updated' : 'New category created', 'success');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete category "${name}"?`)) {
      StorageService.deleteCategory(id);
      syncCategories();
      showToast('Category deleted', 'info');
    }
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const list = [...categories];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    setCategories(list);
    StorageService.reorderCategories(list.map((c) => c.id));
    syncCategories();
    showToast('Category sequence updated!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
            3-Level Category Architecture & Carousel Cards
          </h2>
          <p className="text-xs text-stone-500">
            Configure Level 1 (Department), Level 2 (Category), and Level 3 (Subcategory) hierarchies with 4:5 image cards (800 × 1000 px).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((c, idx) => (
          <div
            key={c.id}
            className="bg-white rounded-xl border border-[#E2DBD0] shadow-2xs overflow-hidden flex flex-col justify-between"
          >
            <div className="relative aspect-[4/3] bg-stone-100">
              <img
                src={c.image}
                alt={c.nameEn}
                className="w-full h-full object-cover object-center"
              />
              <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Level {c.level}
              </span>
              <span
                className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                  c.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {c.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900">
                  {c.nameEn}
                </h3>
                <span className="font-serif text-xs text-amber-900 block font-medium">
                  {c.nameTa}
                </span>
                {c.descriptionEn && (
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                    {c.descriptionEn}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-400 font-mono text-[11px]">
                  {c.itemCount || 0} active SKUs
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveCategory(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-20"
                    title="Move earlier"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveCategory(idx, 'down')}
                    disabled={idx === categories.length - 1}
                    className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-20"
                    title="Move later"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 text-stone-600 hover:text-amber-900 rounded hover:bg-stone-100"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.nameEn)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-xl">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Hierarchy Level</label>
                  <select
                    value={level}
                    onChange={(e: any) => setLevel(Number(e.target.value) as any)}
                    className="w-full p-2 border border-stone-300 rounded-md bg-white"
                  >
                    <option value={1}>Level 1 (Department / Women, Men, Kids)</option>
                    <option value={2}>Level 2 (Category / Sarees, Vesti, Shirts)</option>
                    <option value={3}>Level 3 (Subcategory / Silk Sarees, Cotton)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Parent Category</label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md bg-white"
                  >
                    <option value="">None (Top Level)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn} (Level {c.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">English Category Name *</label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Sarees"
                  className="w-full p-2 border border-stone-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tamil Category Name (தமிழ் பெயர்)</label>
                <input
                  type="text"
                  value={nameTa}
                  onChange={(e) => setNameTa(e.target.value)}
                  placeholder="e.g. புடவைகள்"
                  className="w-full p-2 border border-stone-300 rounded-md font-serif"
                />
              </div>

              {/* Category Cover Image with Media Uploader */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-700">Category Card Image (800 × 1000 px, 4:5)</label>
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Open Media Library</span>
                  </button>
                </div>

                {image && (
                  <div className="h-28 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center">
                    <img src={image} alt="Preview" className="max-h-full object-contain" />
                  </div>
                )}

                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 border border-stone-300 rounded-md font-mono text-[11px]"
                />
              </div>

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
                  className="w-full p-2 border border-stone-300 rounded-md"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-amber-900"
                />
                <label htmlFor="cat-active" className="font-semibold text-stone-700">
                  Visible in Storefront & Navigation
                </label>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-md font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-md font-semibold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Upload Modal for Category */}
      <MediaUploadModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelectImage={(url) => setImage(url)}
        category="categories"
        title="Select Category Image"
        aspectRatioNote="Recommended: 800 × 1000 px (4:5 aspect ratio) for smooth carousel cards"
      />
    </div>
  );
};

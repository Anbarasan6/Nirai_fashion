import React, { useState, useEffect } from 'react';
import { MediaItem } from '../../types';
import { StorageService } from '../../services/storage';
import { processAndUploadImage, MAX_UPLOAD_SIZES } from '../../services/mediaService';
import { useShop } from '../../context/ShopContext';
import {
  UploadCloud,
  Search,
  FolderOpen,
  Image as ImageIcon,
  Copy,
  Trash2,
  Check,
  Eye,
  X,
  Plus,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export const MediaLibraryPage: React.FC = () => {
  const { showToast } = useShop();
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => StorageService.getMediaItems());
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const syncMedia = () => {
    setMediaList(StorageService.getMediaItems());
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('Image URL copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete asset "${name}" from Cloud Storage?`)) {
      StorageService.deleteMediaItem(id);
      syncMedia();
      showToast('Image removed from media library', 'info');
    }
  };

  const handleFiles = async (files: File[]) => {
    setIsUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        const cat = selectedFolder === 'all' ? 'general' : (selectedFolder as any);
        await processAndUploadImage(file, { category: cat });
        successCount++;
      } catch (err: any) {
        showToast(err.message || `Failed to upload ${file.name}`, 'error');
      }
    }

    setIsUploading(false);
    syncMedia();
    if (successCount > 0) {
      showToast(`${successCount} image(s) optimized & uploaded to cloud!`, 'success');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const filteredMedia = mediaList.filter((m) => {
    const matchesCat = selectedFolder === 'all' ? true : m.category === selectedFolder;
    const matchesSearch =
      searchQuery.trim() === ''
        ? true
        : m.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.altText && m.altText.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const folderCounts = {
    all: mediaList.length,
    logos: mediaList.filter((m) => m.category === 'logos').length,
    hero: mediaList.filter((m) => m.category === 'hero').length,
    categories: mediaList.filter((m) => m.category === 'categories').length,
    products: mediaList.filter((m) => m.category === 'products').length,
    promotions: mediaList.filter((m) => m.category === 'promotions').length,
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
            Cloud Media Library & Assets
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Cloud-based media storage with automatic WebP compression, aspect-ratio preservation, and responsive CDN serving.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Media Asset</span>
        </button>
      </div>

      {/* Drag & Drop Upload Banner */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 bg-white ${
          isDragging
            ? 'border-amber-800 bg-amber-50/60 scale-[0.99]'
            : 'border-[#D9D1C3] hover:border-amber-800/80 hover:bg-amber-50/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(Array.from(e.target.files));
          }}
        />

        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h3 className="font-serif text-sm sm:text-base font-bold text-slate-900">
          Drag & Drop Images Here or <span className="text-amber-900 underline">Browse Files</span>
        </h3>
        <p className="text-xs text-stone-500">
          Upload logo (PNG/SVG, 400×120), hero banners (1920×700), or product photography (1000×1200). Auto-resized & optimized.
        </p>

        {isUploading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 mt-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-900" />
            <span>Optimizing and uploading assets...</span>
          </div>
        )}
      </div>

      {/* Folders and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E2DBD0] shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Category folder buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          {(['all', 'logos', 'hero', 'categories', 'products', 'promotions'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFolder(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedFolder === cat
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedFolder === cat ? 'bg-amber-950 text-amber-200' : 'bg-stone-200 text-stone-600'
              }`}>
                {folderCounts[cat]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search filenames or alt text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs bg-stone-50/50 focus:bg-white focus:outline-none focus:border-amber-800"
          />
        </div>
      </div>

      {/* Media Grid */}
      <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs">
        {filteredMedia.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-400">
            No media assets found. Drag & drop images above to upload into this folder.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMedia.map((m) => (
              <div
                key={m.id}
                className="group relative bg-[#FAF9F5] rounded-xl border border-[#E5DFD3] hover:border-amber-800 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-stone-100 overflow-hidden relative flex items-center justify-center">
                  <img
                    src={m.url}
                    alt={m.altText || m.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewItem(m)}
                      className="p-1.5 bg-white text-slate-800 rounded-lg shadow-sm hover:bg-stone-100"
                      title="Preview Full Asset"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopyUrl(m.url, m.id)}
                      className="p-1.5 bg-white text-slate-800 rounded-lg shadow-sm hover:bg-stone-100"
                      title="Copy Public URL"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, m.filename)}
                      className="p-1.5 bg-white text-rose-700 rounded-lg shadow-sm hover:bg-rose-50"
                      title="Delete from Cloud"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 text-[11px] flex-1 flex flex-col justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block truncate" title={m.filename}>
                      {m.filename}
                    </span>
                    <span className="text-[10px] text-stone-400 block truncate mt-0.5">
                      {m.publicId}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500">
                    <span className="uppercase font-mono font-semibold text-amber-900">
                      {m.format}
                    </span>
                    <span>{formatFileSize(m.fileSize)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Preview Lightbox */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl w-full p-5 space-y-4 cursor-default shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h4 className="font-serif text-sm font-bold text-slate-900">
                  {previewItem.filename}
                </h4>
                <p className="text-[11px] text-stone-400 font-mono">{previewItem.publicId}</p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65vh] bg-stone-100 rounded-xl overflow-hidden flex items-center justify-center p-2">
              <img
                src={previewItem.url}
                alt={previewItem.altText}
                className="max-h-[65vh] max-w-full object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-stone-600 border-t border-stone-100">
              <div className="flex items-center gap-4 text-[11px]">
                <span>Folder: <b className="capitalize text-slate-900">{previewItem.category}</b></span>
                <span>Size: <b className="text-slate-900">{formatFileSize(previewItem.fileSize)}</b></span>
                <span>Dimensions: <b className="text-slate-900">{previewItem.width || 'Auto'} × {previewItem.height || 'Auto'} px</b></span>
              </div>

              <button
                onClick={() => handleCopyUrl(previewItem.url, previewItem.id)}
                className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Cloud URL</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

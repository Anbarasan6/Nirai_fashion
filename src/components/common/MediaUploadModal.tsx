import React, { useState, useRef, useEffect } from 'react';
import { MediaItem } from '../../types';
import { StorageService } from '../../services/storage';
import {
  processAndUploadImage,
  MAX_UPLOAD_SIZES,
  RECOMMENDED_DIMENSIONS,
} from '../../services/mediaService';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  FolderOpen,
  Search,
  Check,
  AlertCircle,
  Trash2,
  Copy,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, mediaItem?: MediaItem) => void;
  category?: MediaItem['category'];
  title?: string;
  aspectRatioNote?: string;
  currentImageUrl?: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  result?: MediaItem;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  category = 'general',
  title = 'Select or Upload Media Asset',
  aspectRatioNote,
  currentImageUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'url'>('upload');
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => StorageService.getMediaItems());
  const [selectedFolder, setSelectedFolder] = useState<string>(category || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload Queue
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Direct URL Tab
  const [directUrl, setDirectUrl] = useState(currentImageUrl || '');
  const [directUrlError, setDirectUrlError] = useState(false);

  // Full Preview Modal
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMediaList(StorageService.getMediaItems());
      setSelectedFolder(category === 'general' ? 'all' : category);
      setDirectUrl(currentImageUrl || '');
    }
  }, [isOpen, category, currentImageUrl]);

  if (!isOpen) return null;

  const maxSizeBytes = MAX_UPLOAD_SIZES[category] || 5 * 1024 * 1024;
  const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newItems: UploadQueueItem[] = files.map((file) => ({
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }));

    setUploadQueue((prev) => [...newItems, ...prev]);

    // Process uploads
    newItems.forEach((item) => {
      uploadFile(item);
    });
  };

  const uploadFile = async (item: UploadQueueItem) => {
    setUploadQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 10 } : q))
    );

    try {
      const mediaItem = await processAndUploadImage(item.file, {
        category,
        onProgress: (p) => {
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: p } : q))
          );
        },
      });

      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'completed', progress: 100, result: mediaItem }
            : q
        )
      );

      // Refresh list
      setMediaList(StorageService.getMediaItems());
    } catch (err: any) {
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'error', progress: 0, errorMessage: err.message || 'Upload failed' }
            : q
        )
      );
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteMedia = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this asset from cloud storage?')) {
      StorageService.deleteMediaItem(id);
      setMediaList(StorageService.getMediaItems());
    }
  };

  const filteredMedia = mediaList.filter((m) => {
    const matchesCategory =
      selectedFolder === 'all' ? true : m.category === selectedFolder;
    const matchesSearch =
      searchQuery.trim() === ''
        ? true
        : m.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.altText && m.altText.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#FAF9F5] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-[#E2DBD0] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#2D1619] text-[#FAF6F0] p-4 sm:p-5 flex items-center justify-between border-b border-[#431F24] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-amber-300" />
              <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide">
                {title}
              </h3>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              {aspectRatioNote || `Cloud storage asset manager · Max upload size: ${maxMb} MB`}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="bg-[#F2ECE1] border-b border-[#E2DBD0] px-4 sm:px-6 flex items-center gap-2 sm:gap-4 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-amber-900 text-amber-950 font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload New Images</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'library'
                ? 'border-amber-900 text-amber-950 font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Cloud Media Library ({mediaList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'url'
                ? 'border-amber-900 text-amber-950 font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>External Image URL</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-amber-700 bg-amber-100/50 scale-[0.99]'
                    : 'border-[#D8CFBF] bg-white hover:border-amber-800/60 hover:bg-amber-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <div>
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    Drag & Drop Images Here
                  </h4>
                  <p className="text-xs text-stone-500 mt-1">
                    or <span className="text-amber-900 font-semibold underline">Browse Files</span> from your computer
                  </p>
                </div>

                <div className="text-[11px] text-stone-400 space-y-0.5">
                  <p>Supported Formats: PNG (with transparency), WebP, JPG, SVG</p>
                  <p>Max file size for this section: {maxMb} MB · Automatic client compression enabled</p>
                </div>
              </div>

              {/* Upload Queue List */}
              {uploadQueue.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                    <span>Recent Uploads ({uploadQueue.length})</span>
                    <button
                      onClick={() => setUploadQueue([])}
                      className="text-stone-400 hover:text-stone-600 text-[11px]"
                    >
                      Clear Queue
                    </button>
                  </div>

                  <div className="space-y-2">
                    {uploadQueue.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-3 rounded-xl border border-[#E2DBD0] flex items-center justify-between gap-4 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.previewUrl}
                            alt="preview"
                            className="w-12 h-12 object-cover rounded-lg border border-stone-200 bg-stone-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 block truncate">
                              {item.file.name}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {formatFileSize(item.file.size)}
                            </span>
                          </div>
                        </div>

                        {/* Progress and Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          {item.status === 'uploading' && (
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-stone-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-amber-800 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-stone-500">
                                {item.progress}%
                              </span>
                            </div>
                          )}

                          {item.status === 'completed' && item.result && (
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Optimized</span>
                              </span>
                              <button
                                onClick={() => {
                                  if (item.result) {
                                    onSelectImage(item.result.url, item.result);
                                    onClose();
                                  }
                                }}
                                className="px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                              >
                                Use This Image
                              </button>
                            </div>
                          )}

                          {item.status === 'error' && (
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>{item.errorMessage || 'Failed'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLOUD MEDIA LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2DBD0]">
                {/* Folder filter */}
                <div className="flex items-center gap-1 overflow-x-auto text-xs">
                  {['all', 'logos', 'hero', 'categories', 'products', 'promotions'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFolder(f)}
                      className={`px-2.5 py-1 rounded-lg font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                        selectedFolder === f
                          ? 'bg-amber-900 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-stone-50/50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Media Cards Grid */}
              {filteredMedia.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-[#E2DBD0] text-xs text-stone-500">
                  No images found in this folder. Upload new images above or search for another asset.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredMedia.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        onSelectImage(m.url, m);
                        onClose();
                      }}
                      className="group bg-white rounded-xl border border-[#E2DBD0] overflow-hidden hover:border-amber-800/80 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col relative"
                    >
                      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden flex items-center justify-center">
                        <img
                          src={m.url}
                          alt={m.altText || m.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewMedia(m);
                            }}
                            className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm"
                            title="Preview Full Size"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyUrl(m.url, m.id);
                            }}
                            className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm"
                            title="Copy Cloud URL"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMedia(m.id, e)}
                            className="p-1.5 bg-white/90 hover:bg-white text-rose-700 rounded-lg shadow-sm"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 text-[11px] flex-1 flex flex-col justify-between">
                        <span className="font-semibold text-slate-800 truncate block">
                          {m.filename}
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                          <span className="uppercase font-mono">{m.format}</span>
                          <span>{formatFileSize(m.fileSize)}</span>
                        </div>
                      </div>

                      <div className="p-2 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between">
                        <span className="text-[10px] text-amber-900 font-bold uppercase tracking-wider">
                          {m.category}
                        </span>
                        <span className="text-[11px] font-semibold text-amber-900 group-hover:underline flex items-center gap-0.5">
                          <span>Select</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXTERNAL URL */}
          {activeTab === 'url' && (
            <div className="space-y-4 max-w-xl mx-auto py-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Direct Image Web URL (HTTPS)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={directUrl}
                  onChange={(e) => {
                    setDirectUrl(e.target.value);
                    setDirectUrlError(false);
                  }}
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:border-amber-800 font-mono"
                />
              </div>

              {directUrl && (
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                  <span className="text-[11px] font-bold text-stone-600 block">Live URL Preview:</span>
                  <div className="max-h-60 rounded-lg overflow-hidden border border-stone-100 bg-stone-50 flex items-center justify-center">
                    <img
                      src={directUrl}
                      alt="URL preview"
                      onError={() => setDirectUrlError(true)}
                      className="max-h-60 max-w-full object-contain"
                    />
                  </div>
                  {directUrlError && (
                    <p className="text-[11px] text-rose-600">
                      Could not load image from this URL. Please verify that the image link is valid and publicly accessible.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={!directUrl.trim() || directUrlError}
                onClick={() => {
                  onSelectImage(directUrl.trim());
                  onClose();
                }}
                className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 disabled:bg-stone-300 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Apply Image URL
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#E2DBD0] flex items-center justify-between shrink-0 text-xs">
          <span className="text-stone-400">
            Nirai Cloud Media Management Engine · Instant responsive serving
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-stone-300 rounded-lg font-semibold text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Full Preview Modal Lightbox */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-4 space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 text-xs">
              <span className="font-semibold text-slate-800">{previewMedia.filename}</span>
              <button
                onClick={() => setPreviewMedia(null)}
                className="p-1 text-stone-400 hover:text-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-xl bg-stone-100 flex items-center justify-center">
              <img
                src={previewMedia.url}
                alt={previewMedia.altText}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
              <span>Category: {previewMedia.category}</span>
              <span>Dimensions: {previewMedia.width || 'Auto'} × {previewMedia.height || 'Auto'} px</span>
              <span>{formatFileSize(previewMedia.fileSize)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { MediaItem } from '../types';
import { StorageService } from './storage';
import { uploadToCloudinary } from './cloudinary';
import { compressImage, cldUrl } from '../utils/cloudinary';

export interface UploadOptions {
  category?: MediaItem['category'];
  altText?: string;
  onProgress?: (progress: number) => void;
}

export const MAX_UPLOAD_SIZES: Record<MediaItem['category'], number> = {
  logos: 2 * 1024 * 1024, // 2 MB
  hero: 8 * 1024 * 1024, // 8 MB
  promotions: 8 * 1024 * 1024, // 8 MB
  categories: 5 * 1024 * 1024, // 5 MB
  products: 5 * 1024 * 1024, // 5 MB
  general: 5 * 1024 * 1024, // 5 MB
};

export const RECOMMENDED_DIMENSIONS: Record<string, { width: number; height: number; ratio: string }> = {
  'logo-desktop': { width: 400, height: 120, ratio: '3:1' },
  'logo-mobile': { width: 160, height: 160, ratio: '1:1' },
  'hero-desktop': { width: 1920, height: 700, ratio: '2.74:1' },
  'hero-mobile': { width: 1080, height: 1350, ratio: '4:5 / 9:16' },
  'category-card': { width: 800, height: 1000, ratio: '4:5' },
  'product-card': { width: 1000, height: 1200, ratio: '5:6' },
  'promo-desktop': { width: 1600, height: 600, ratio: '2.67:1' },
  'promo-mobile': { width: 1080, height: 900, ratio: '6:5' },
};

/**
 * Optimizes, compresses and stores an image into Cloudinary CDN.
 * Performs client-side image downscaling and compression before upload.
 */
export async function processAndUploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<MediaItem> {
  const category = options.category || 'general';
  const maxSize = MAX_UPLOAD_SIZES[category] || 5 * 1024 * 1024;

  if (file.size > maxSize) {
    const mbLimit = (maxSize / (1024 * 1024)).toFixed(0);
    throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the ${mbLimit} MB limit for ${category}.`);
  }

  // Check valid MIME types
  const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!validMimes.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload JPG, PNG, WebP, or SVG.');
  }

  // Client-side image downscale / compress to ~1600px / 0.8 quality before network dispatch
  const optimizedFile = await compressImage(file, 1600, 1600, 0.8);

  try {
    const result = await uploadToCloudinary(optimizedFile, `nirai/${category}`, options.onProgress);
    const mediaItem: MediaItem = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: result.secureUrl || result.url,
      publicId: result.publicId,
      filename: file.name,
      fileSize: result.bytes || optimizedFile.size,
      width: result.width || 800,
      height: result.height || 1000,
      format: (result.format || file.type.split('/')[1] || 'webp') as any,
      category,
      altText: options.altText || file.name.replace(/\.[^/.]+$/, ''),
      createdAt: new Date().toISOString(),
    };

    StorageService.saveMediaItem(mediaItem);
    return mediaItem;
  } catch (error: any) {
    throw new Error(error.message || 'Image processing failed');
  }
}

/**
 * Responsive image utility: appends CDN size transformation or returns standard URL
 */
export function getOptimizedImageUrl(
  url: string | undefined,
  options?: { width?: number; height?: number; quality?: number }
): string {
  if (!url) return '';
  return cldUrl(url, {
    w: options?.width,
    h: options?.height,
    quality: options?.quality,
  });
}

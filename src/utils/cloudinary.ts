/**
 * Cloudinary Transformation & Responsive Image Utility
 * Injects f_auto, q_auto, width, height, and cropping transformations
 * Client-side image compression for uploads (max 1600px, 0.8 quality)
 */

export interface CldOptions {
  w?: number;
  h?: number;
  crop?: 'fill' | 'scale' | 'fit' | 'limit' | 'thumb';
  quality?: 'auto' | 'auto:eco' | 'auto:good' | 'auto:best' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
  gravity?: 'auto' | 'center' | 'face';
}

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';

export const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80';

/**
 * Inserts Cloudinary transformations into existing Cloudinary URLs.
 * Leaves non-Cloudinary URLs untouched (with basic Unsplash transformation fallback).
 */
export function cldUrl(url: string | undefined | null, options: CldOptions = {}): string {
  if (!url || typeof url !== 'string') return '';

  // Cloudinary image transformation
  if (url.includes('res.cloudinary.com')) {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const parts: string[] = ['f_auto', 'q_auto'];
    if (options.w) parts.push(`w_${options.w}`);
    if (options.h) parts.push(`h_${options.h}`);
    if (options.crop) parts.push(`c_${options.crop}`);
    else if (options.w && options.h) parts.push('c_fill');
    if (options.gravity) parts.push(`g_${options.gravity}`);

    const transformSegment = parts.join(',');

    const prefix = url.slice(0, uploadIndex + '/upload/'.length);
    const remainder = url.slice(uploadIndex + '/upload/'.length);

    // If already has this transform, avoid duplicate
    if (remainder.startsWith(transformSegment)) {
      return url;
    }

    return `${prefix}${transformSegment}/${remainder}`;
  }

  // Unsplash fallback transformation
  if (url.includes('images.unsplash.com')) {
    const base = url.split('?')[0];
    const params = new URLSearchParams();
    params.set('auto', 'format');
    params.set('fit', options.crop === 'scale' ? 'clip' : 'crop');
    if (options.w) params.set('w', String(options.w));
    if (options.h) params.set('h', String(options.h));
    params.set('q', typeof options.quality === 'number' ? String(options.quality) : '80');
    return `${base}?${params.toString()}`;
  }

  return url;
}

/**
 * Generate a responsive srcset attribute string for Cloudinary / Unsplash images
 */
export function getSrcSet(
  url: string | undefined | null,
  widths: number[] = [360, 480, 640, 768, 1024, 1280]
): string {
  if (!url) return '';
  return widths
    .map((w) => `${cldUrl(url, { w, crop: 'limit' })} ${w}w`)
    .join(', ');
}

/**
 * Client-side image compression and resizing before admin upload.
 * Restricts max dimension to 1600px and encodes as JPEG/WebP with 0.8 quality.
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1600,
  maxHeight: number = 1600,
  quality: number = 0.8
): Promise<File> {
  // SVG or very small files (< 150 KB) do not need downscaling
  if (file.type === 'image/svg+xml' || file.size < 150 * 1024) {
    return file;
  }

  // Ensure running in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Check if image is already within target bounds and reasonable size
      if (width <= maxWidth && height <= maxHeight && file.size < 800 * 1024) {
        resolve(file);
        return;
      }

      // Calculate constrained dimensions
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Fill neutral white background for transparent PNGs converted to JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      const outputExt = outputType === 'image/webp' ? '.webp' : '.jpg';
      const newFilename = file.name.replace(/\.[^/.]+$/, '') + outputExt;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          // Only use compressed if it actually reduced file size
          if (blob.size < file.size) {
            const compressedFile = new File([blob], newFilename, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Graceful fallback to original file
    };

    img.src = objectUrl;
  });
}

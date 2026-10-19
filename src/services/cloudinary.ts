/**
 * Cloudinary Direct Upload Service
 * Enforces strict client-side validation and Cloudinary CDN storage.
 * Base64 fallback removed in compliance with production standards.
 */

import { env } from '../config/env';

export const CLOUDINARY_CONFIG = {
  cloudName: env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: env.VITE_CLOUDINARY_UPLOAD_PRESET,
};

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  originalFilename: string;
}

// Client-side image validation constraints
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validate image file size and MIME type before network dispatch
 */
export function validateImageFile(file: File | Blob): { valid: boolean; error?: string } {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds the 10 MB limit (current: ${sizeMb} MB). Please choose a smaller image.`,
    };
  }

  if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported image format "${file.type}". Allowed formats are JPG, PNG, WebP, and SVG.`,
    };
  }

  return { valid: true };
}

/**
 * Upload an image file or blob directly to Cloudinary.
 * Throws a clear error if credentials are missing, validation fails, or upload fails.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: string = 'nirai/media',
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = CLOUDINARY_CONFIG;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary upload failed: Environment variables VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET are missing.'
    );
  }

  // 1. Client-side file validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Prepare upload payload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (folder) {
    formData.append('folder', folder);
  }

  const xhr = new XMLHttpRequest();
  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            url: res.url,
            secureUrl: res.secure_url || res.url,
            publicId: res.public_id,
            width: res.width,
            height: res.height,
            format: res.format,
            bytes: res.bytes,
            originalFilename: res.original_filename || 'image',
          });
        } catch (err: any) {
          reject(new Error(`Failed to parse Cloudinary response: ${err.message}`));
        }
      } else {
        let errorMsg = `Cloudinary upload failed with status ${xhr.status}`;
        try {
          const errJson = JSON.parse(xhr.responseText);
          if (errJson?.error?.message) {
            errorMsg = errJson.error.message;
          }
        } catch {}
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error uploading asset to Cloudinary. Please check your connection.'));
    };

    xhr.send(formData);
  });
}

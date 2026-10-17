/**
 * Cloudinary Direct Upload Service
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

/**
 * Upload an image file or blob to Cloudinary.
 * If Cloudinary preset is not configured or network error occurs,
 * gracefully falls back to local data URL without crashing.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: string = 'nirai/media',
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = CLOUDINARY_CONFIG;

  if (!cloudName || !uploadPreset) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({
          url: dataUrl,
          secureUrl: dataUrl,
          publicId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          width: 800,
          height: 1000,
          format: file.type.split('/')[1] || 'webp',
          bytes: file.size,
          originalFilename: (file as File).name || 'upload.webp',
        });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    if (folder) {
      formData.append('folder', folder);
    }

    const xhr = new XMLHttpRequest();
    const uploadPromise = new Promise<CloudinaryUploadResult>((resolve, reject) => {
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
          } catch (err) {
            reject(err);
          }
        } else {
          // Cloudinary returned an error (e.g. preset not found or disabled)
          let errorMsg = `Cloudinary upload failed (${xhr.status})`;
          try {
            const errJson = JSON.parse(xhr.responseText);
            if (errJson?.error?.message) {
              errorMsg = errJson.error.message;
            }
          } catch {}
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => reject(new Error('Network error uploading to Cloudinary'));
      xhr.send(formData);
    });

    return await uploadPromise;
  } catch (error: any) {
    console.warn('Cloudinary upload warning, using local fallback:', error?.message || error);
    // Graceful fallback to client-side data URL so user operations never fail
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({
          url: dataUrl,
          secureUrl: dataUrl,
          publicId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          width: 800,
          height: 1000,
          format: file.type.split('/')[1] || 'webp',
          bytes: file.size,
          originalFilename: (file as File).name || 'upload.webp',
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Cloudinary Media Upload Service
 * Handles direct unsigned image uploads to Cloudinary CDN
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dbuyygwtl';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'nirai_preset';

export const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn('Cloudinary upload returned non-200, falling back to data URL:', errData);
      return await fileToDataUrl(file);
    }

    const data = await response.json();
    return data.secure_url || data.url;
  } catch (error) {
    console.warn('Cloudinary upload network error, falling back to data URL:', error);
    return await fileToDataUrl(file);
  }
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Environment configuration and validation module.
 * Reads environment variables from import.meta.env and enforces required keys.
 * Throws a clear error if any required variables are missing.
 */

export interface AppEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_CLOUDINARY_CLOUD_NAME: string;
  VITE_CLOUDINARY_UPLOAD_PRESET: string;
  APP_URL?: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

function validateAndLoadEnv(): AppEnv {
  const raw = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    VITE_CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    APP_URL: import.meta.env.APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  };

  const missing: string[] = [];

  if (!raw.VITE_SUPABASE_URL || raw.VITE_SUPABASE_URL.trim() === '') {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!raw.VITE_SUPABASE_ANON_KEY || raw.VITE_SUPABASE_ANON_KEY.trim() === '') {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }
  if (!raw.VITE_CLOUDINARY_CLOUD_NAME || raw.VITE_CLOUDINARY_CLOUD_NAME.trim() === '') {
    missing.push('VITE_CLOUDINARY_CLOUD_NAME');
  }
  if (!raw.VITE_CLOUDINARY_UPLOAD_PRESET || raw.VITE_CLOUDINARY_UPLOAD_PRESET.trim() === '') {
    missing.push('VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  if (missing.length > 0) {
    throw new Error(
      `[Configuration Error] Missing required environment variable(s): ${missing.join(', ')}.\n` +
      `Please configure these variables in your .env file or hosting provider dashboard. Refer to .env.example.`
    );
  }

  return {
    VITE_SUPABASE_URL: raw.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: raw.VITE_SUPABASE_ANON_KEY,
    VITE_CLOUDINARY_CLOUD_NAME: raw.VITE_CLOUDINARY_CLOUD_NAME,
    VITE_CLOUDINARY_UPLOAD_PRESET: raw.VITE_CLOUDINARY_UPLOAD_PRESET,
    APP_URL: raw.APP_URL,
    isProduction: Boolean(import.meta.env.PROD),
    isDevelopment: Boolean(import.meta.env.DEV),
  };
}

export const env = validateAndLoadEnv();

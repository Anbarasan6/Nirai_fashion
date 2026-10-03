import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Valid URL check helper
const isValidUrl = (urlStr: string): boolean => {
  try {
    if (!urlStr || urlStr.includes('<') || urlStr.includes('your-project-ref')) return false;
    const u = new URL(urlStr);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const SUPABASE_URL = isValidUrl(rawUrl) ? rawUrl : 'https://nirai-dummy-project.supabase.co';
const SUPABASE_ANON_KEY = (rawKey && !rawKey.includes('<')) ? rawKey : 'sb_publishable_BJoamVgAsAzztyYx1daqVQ_wChxUTmc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

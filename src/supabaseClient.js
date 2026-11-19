import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://lkoknegbeowsiyoovgmz.supabase.co';
const DEFAULT_KEY = 'sb_publishable_bcNw1s7FwK3G5j2tTnVkGg_4gKdQZQG';

const storageUrl = typeof window !== 'undefined' ? localStorage.getItem('bb_sb_url') : '';
const storageKey = typeof window !== 'undefined' ? localStorage.getItem('bb_sb_key') : '';

const supabaseUrl = (
  storageUrl ||
  import.meta.env.VITE_SUPABASE_URL ||
  DEFAULT_URL
).trim();

const supabaseKey = (
  storageKey ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_KEY
).trim();

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = localStorage.getItem('bb_sb_url') || '';
const supabaseKey = localStorage.getItem('bb_sb_key') || '';

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl.trim(), supabaseKey.trim()) 
  : null;
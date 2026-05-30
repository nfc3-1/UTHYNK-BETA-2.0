import { createClient } from '@supabase/supabase-js';
import {
  hasSupabasePublicConfig,
  supabasePublishableKey,
  supabaseUrl,
} from '@/lib/supabaseConfig';

export function hasSupabaseEnv() {
  return hasSupabasePublicConfig();
}

export const supabase = hasSupabaseEnv()
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

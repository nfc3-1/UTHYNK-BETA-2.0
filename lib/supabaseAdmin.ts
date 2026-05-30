import { createClient } from '@supabase/supabase-js';
import {
  hasSupabaseAdminConfig,
  supabaseServiceRoleKey,
  supabaseUrl,
} from '@/lib/supabaseConfig';

export function hasSupabaseAdminEnv() {
  return hasSupabaseAdminConfig();
}

export const supabaseAdmin = hasSupabaseAdminEnv()
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

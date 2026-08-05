import { validateServerEnv } from '@/lib/serverEnv';

const serverEnv = typeof window === 'undefined' ? validateServerEnv() : null;

export const supabaseUrl =
  serverEnv?.supabaseUrl ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://oxgogjxrrpqpvtpkxevv.supabase.co';

export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_p-2i4etsV_L1zcIEWOsq1A_Ep7xWGEx';

export const supabaseServiceRoleKey = serverEnv?.supabaseServiceRoleKey || '';

export function hasSupabasePublicConfig() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function hasSupabaseAdminConfig() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

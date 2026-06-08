import { cookies } from 'next/headers';
import { parseSessionCookieValue } from '@/lib/authCookies';
import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';

export type SessionUser = {
  id: string;
  auth_user_id?: string | null;
  email?: string;
  username?: string;
};

export async function getServerSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('uthynk-session')?.value;

  if (sessionCookie) {
    return parseSessionCookieValue(sessionCookie) as SessionUser | null;
  }

  return null;
}

export async function requireServerSessionUser() {
  const user = await getServerSessionUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  return user;
}

export async function loadUserProfile(userId: string) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return null;
  }

  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return data;
}

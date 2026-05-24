import { cookies } from 'next/headers';
import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';

export type SessionUser = {
  id: string;
  email?: string;
  username?: string;
};

export async function getServerSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const profileCookie = cookieStore.get('uthynk-profile')?.value;

  if (profileCookie) {
    try {
      return JSON.parse(profileCookie) as SessionUser;
    } catch {
      return null;
    }
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

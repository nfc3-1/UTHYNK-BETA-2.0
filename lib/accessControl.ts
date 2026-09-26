import { getServerSessionUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type AccessRole = 'user' | 'teacher' | 'admin';
export type AccountAccess = { role: AccessRole; sections: string[]; userId: string | null };
export const deniedAccess: AccountAccess = { role: 'user', sections: [], userId: null };

export function permits(access: AccountAccess, section: string) {
  if (!access.userId) return false;
  if (access.role === 'admin') return true;
  if (section === 'admin') return false;
  return (section === 'teacher' && access.role === 'teacher') || access.sections.includes(section);
}

// Never cache authorization across requests: revocations take effect immediately.
export async function getAccountAccess(): Promise<AccountAccess> {
  const user = await getServerSessionUser();
  if (!user?.auth_user_id || !supabaseAdmin) return deniedAccess;
  const [identity, profile, permissions] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(user.auth_user_id),
    supabaseAdmin.from('user_profiles').select('id,auth_user_id').eq('id', user.id).maybeSingle(),
    supabaseAdmin.from('account_access').select('role,section_grants,auth_user_id').eq('profile_id', user.id).maybeSingle(),
  ]);
  if (identity.error || !identity.data.user || profile.error || permissions.error ||
      profile.data?.auth_user_id !== identity.data.user.id ||
      (identity.data.user.banned_until && Date.parse(identity.data.user.banned_until) > Date.now())) return deniedAccess;
  const row = permissions.data;
  if (row && row.auth_user_id !== identity.data.user.id) return deniedAccess;
  return {
    userId: user.id,
    role: row?.role === 'admin' || row?.role === 'teacher' ? row.role : 'user',
    sections: Object.keys(row?.section_grants || {}),
  };
}

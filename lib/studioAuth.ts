import { getAccountAccess, permits } from '@/lib/accessControl';
import { getServerSessionUser, type SessionUser } from '@/lib/auth';
type StudioAccessResult =
  | { allowed: true; user: SessionUser; source: 'profile' }
  | { allowed: false; reason: 'unauthenticated' | 'not_admin'; user?: SessionUser | null };
export async function getStudioAccess(): Promise<StudioAccessResult> {
  const access = await getAccountAccess();
  if (!permits(access, 'studio')) return { allowed: false, reason: access.userId ? 'not_admin' : 'unauthenticated' };
  const user = await getServerSessionUser();
  return user ? { allowed: true, user, source: 'profile' } : { allowed: false, reason: 'unauthenticated' };
}

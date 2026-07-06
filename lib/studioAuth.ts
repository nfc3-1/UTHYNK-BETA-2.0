import { getServerSessionUser, loadUserProfile, type SessionUser } from '@/lib/auth';

type StudioAccessResult =
  | { allowed: true; user: SessionUser; source: 'env' | 'profile' }
  | { allowed: false; reason: 'unauthenticated' | 'not_admin'; user?: SessionUser | null };

const DEFAULT_STUDIO_ADMIN_EMAILS = ['nick.catrambone@yahoo.com'];

function parseAllowlist(value?: string) {
  return (value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getStudioAdminEmails() {
  return Array.from(
    new Set([
      ...DEFAULT_STUDIO_ADMIN_EMAILS,
      ...parseAllowlist(process.env.STUDIO_ADMIN_EMAILS || process.env.UTHYNK_STUDIO_ADMIN_EMAILS),
    ])
  );
}

function getStudioAdminIds() {
  return parseAllowlist(process.env.STUDIO_ADMIN_USER_IDS || process.env.UTHYNK_STUDIO_ADMIN_USER_IDS);
}

function hasEnvAdminAccess(user: SessionUser) {
  const email = user.email?.toLowerCase();
  const adminEmails = getStudioAdminEmails();
  const adminIds = getStudioAdminIds();

  return Boolean(
    (email && adminEmails.includes(email)) ||
      adminIds.includes(user.id.toLowerCase()) ||
      (user.auth_user_id && adminIds.includes(user.auth_user_id.toLowerCase()))
  );
}

function hasProfileAdminAccess(profile: any) {
  return Boolean(
    profile?.is_studio_admin === true ||
      profile?.studio_role === 'owner' ||
      profile?.studio_role === 'admin'
  );
}

export async function getStudioAccess(): Promise<StudioAccessResult> {
  const user = await getServerSessionUser();

  if (!user) {
    return { allowed: false, reason: 'unauthenticated', user: null };
  }

  if (hasEnvAdminAccess(user)) {
    return { allowed: true, user, source: 'env' };
  }

  const profile = await loadUserProfile(user.id);

  if (hasProfileAdminAccess(profile)) {
    return { allowed: true, user, source: 'profile' };
  }

  return { allowed: false, reason: 'not_admin', user };
}

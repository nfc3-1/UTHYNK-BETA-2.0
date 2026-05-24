export type EnterpriseRole =
  | 'super_admin'
  | 'org_admin'
  | 'coach'
  | 'analyst'
  | 'member';

export function canAccessEnterpriseDashboard(role?: EnterpriseRole) {
  return role === 'super_admin' || role === 'org_admin';
}

export function canViewCohortAnalytics(role?: EnterpriseRole) {
  return (
    role === 'super_admin' ||
    role === 'org_admin' ||
    role === 'coach'
  );
}

export function canManageMembers(role?: EnterpriseRole) {
  return role === 'super_admin' || role === 'org_admin';
}

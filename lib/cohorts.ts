export type CohortRole = 'owner' | 'admin' | 'coach' | 'member';

export type CohortMember = {
  userId: string;
  role: CohortRole;
  joinedAt: string;
};

export type Cohort = {
  id: string;
  name: string;
  organizationId: string;
  members: CohortMember[];
};

export function canManageCohort(role?: CohortRole) {
  return role === 'owner' || role === 'admin' || role === 'coach';
}

export function calculateCohortReasoningAverage(scores: number[]) {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function calculateEngagementRate(activeMembers: number, totalMembers: number) {
  if (!totalMembers) return 0;
  return Math.round((activeMembers / totalMembers) * 100);
}

export type SubscriptionTier =
  | 'free'
  | 'pro'
  | 'enterprise';

export const subscriptionFeatures = {
  free: [
    'Daily reasoning challenges',
    'Basic progression tracking',
  ],
  pro: [
    'Adaptive coaching',
    'Advanced analytics',
    'Debate simulator',
    'Long-term memory',
  ],
  enterprise: [
    'Cohort intelligence',
    'Team analytics',
    'Admin dashboards',
    'Organizational reporting',
  ],
};

export function hasFeatureAccess(
  tier: SubscriptionTier,
  feature: string
) {
  return subscriptionFeatures[tier]?.includes(feature);
}

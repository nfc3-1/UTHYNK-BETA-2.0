export type BillingPlan = {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
};

export const billingPlans: BillingPlan[] = [
  {
    id: 'pro',
    name: 'UThynk Pro',
    monthlyPrice: 19,
    annualPrice: 190,
    features: [
      'Adaptive coaching',
      'Advanced analytics',
      'Debate simulator',
    ],
  },
  {
    id: 'enterprise',
    name: 'UThynk Enterprise',
    monthlyPrice: 199,
    annualPrice: 1990,
    features: [
      'Cohort intelligence',
      'Enterprise analytics',
      'Admin dashboards',
    ],
  },
];

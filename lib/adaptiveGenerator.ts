export type AdaptiveProfile = {
  reasoningScore: number;
  primaryTrait?: string;
  onboardingGoal?: string;
  onboardingStyle?: string;
};

export function generateAdaptiveChallenge(profile: AdaptiveProfile) {
  const score = profile.reasoningScore || 70;

  if (score >= 85) {
    return {
      pressure: 'high',
      prompt:
        'You discover that two intelligent people reached opposite conclusions using the same evidence. How do you determine which reasoning process is stronger?',
    };
  }

  if (score <= 60) {
    return {
      pressure: 'low',
      prompt:
        'Someone strongly disagrees with you. How do you slow down emotionally and evaluate whether they may be partially correct?',
    };
  }

  return {
    pressure: 'moderate',
    prompt:
      'You must make a difficult decision with incomplete information. How do you balance speed, risk, and long-term consequences?',
  };
}

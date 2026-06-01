import { challenges, Challenge } from '@/lib/challenges';

export type AdaptiveProfile = {
  primary_trait?: string;
  reasoning_score?: number;
  streak?: number;
};

function traitMatchesChallenge(trait: string, challenge: Challenge) {
  const lower = trait.toLowerCase();

  return (
    challenge.trait.toLowerCase().includes(lower) ||
    challenge.category.toLowerCase().includes(lower)
  );
}

export function getAdaptiveChallenges(profile?: AdaptiveProfile) {
  if (!profile) {
    return challenges.slice(0, 3);
  }

  const primaryTrait = profile.primary_trait || '';
  const reasoningScore = profile.reasoning_score || 70;

  let filtered = challenges.filter((challenge) =>
    traitMatchesChallenge(primaryTrait, challenge)
  );

  if (!filtered.length) {
    filtered = [...challenges];
  }

  if (reasoningScore >= 80) {
    filtered = filtered.filter(
      (challenge) => challenge.difficulty !== 'everyday'
    );
  }

  if (!filtered.length) {
    filtered = [...challenges];
  }

  return filtered.slice(0, 5);
}

export function getCoachingIntensity(streak = 0, reasoningScore = 70) {
  if (reasoningScore >= 85 && streak >= 10) {
    return 'high-intensity';
  }

  if (reasoningScore >= 75 || streak >= 5) {
    return 'balanced';
  }

  return 'supportive';
}

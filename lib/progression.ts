export type Rank = 'Observer' | 'Analyst' | 'Strategist' | 'Architect' | 'Philosopher' | 'Master of Thought';

export function getRankFromXp(xp: number): Rank {
  if (xp >= 10000) return 'Master of Thought';
  if (xp >= 6000) return 'Philosopher';
  if (xp >= 3500) return 'Architect';
  if (xp >= 1500) return 'Strategist';
  if (xp >= 500) return 'Analyst';
  return 'Observer';
}

export function calculateReasoningScore(previousScore: number, latestScore: number) {
  const weighted = Math.round(previousScore * 0.82 + latestScore * 0.18);
  return Math.max(0, Math.min(100, weighted));
}

export function isSameUtcDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function isYesterdayUtc(previous: Date, current: Date) {
  const yesterday = new Date(current);
  yesterday.setUTCDate(current.getUTCDate() - 1);
  return isSameUtcDay(previous, yesterday);
}

export function calculateNextStreak(lastCompletedAt: string | null, currentStreak: number) {
  if (!lastCompletedAt) return 1;

  const last = new Date(lastCompletedAt);
  const now = new Date();

  if (isSameUtcDay(last, now)) return currentStreak;
  if (isYesterdayUtc(last, now)) return currentStreak + 1;

  return 1;
}

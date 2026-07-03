import { challenges } from '@/lib/challenges';

export function getTodayChallengeId(): string {
  // Simple deterministic rotation by date (UTC)
  const d = new Date();
  const key = `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`;
  let hash = 0;
  for (let i=0;i<key.length;i++) hash = (hash*31 + key.charCodeAt(i)) >>> 0;
  const idx = hash % challenges.length;
  return challenges[idx].id;
}

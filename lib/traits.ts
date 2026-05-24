export type CognitiveTrait = {
  name: string;
  description: string;
  growthSignal: string;
};

export const cognitiveTraits: CognitiveTrait[] = [
  {
    name: 'Strategic Thinking',
    description: 'Long-term reasoning and incentive awareness.',
    growthSignal: 'Improves through planning and tradeoff analysis.',
  },
  {
    name: 'Bias Detection',
    description: 'Ability to detect manipulation and weak assumptions.',
    growthSignal: 'Improves through media and logic challenges.',
  },
  {
    name: 'Emotional Control',
    description: 'Maintaining discipline under pressure.',
    growthSignal: 'Improves through conflict and stress scenarios.',
  },
  {
    name: 'Decision Discipline',
    description: 'Ability to act rationally despite emotion or noise.',
    growthSignal: 'Improves through repetition and reflection.',
  },
];

export function evolveTraitScore(currentScore = 50, reasoningScore = 70) {
  const growth = Math.max(1, Math.round((reasoningScore - 50) / 10));
  return Math.min(100, currentScore + growth);
}

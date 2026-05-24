export type Challenge = {
  id: string;
  category: string;
  title: string;
  prompt: string;
  difficulty: "starter" | "intermediate" | "advanced";
  trait: string;
};

export const challenges: Challenge[] = [
  {
    id: "work-credit",
    category: "Workplace Strategy",
    title: "Credit Taken",
    prompt:
      "A coworker takes credit for your work in front of leadership. What do you do next?",
    difficulty: "starter",
    trait: "Tactical Thinking",
  },
  {
    id: "luxury-car",
    category: "Financial Judgment",
    title: "Luxury Purchase",
    prompt:
      "You want to finance a luxury car because it feels like a reward for your hard work. What reasoning should guide the decision?",
    difficulty: "starter",
    trait: "Opportunity Cost",
  },
  {
    id: "viral-headline",
    category: "Media Manipulation",
    title: "Emotional Headline",
    prompt:
      "A viral headline makes you angry before you read the article. How do you evaluate whether you are being manipulated?",
    difficulty: "starter",
    trait: "Bias Detection",
  },
  {
    id: "friend-conflict",
    category: "Social Intelligence",
    title: "Conflict Control",
    prompt:
      "A friend publicly disrespects you. How do you respond without losing self-control or status?",
    difficulty: "starter",
    trait: "Emotional Control",
  },
  {
    id: "business-risk",
    category: "Strategic Thinking",
    title: "Risk Tradeoff",
    prompt:
      "You have a chance to make a risky career move with higher upside but less security. What factors should drive the decision?",
    difficulty: "intermediate",
    trait: "Strategic Judgment",
  },
];

export function getDailyChallenge(date = new Date()): Challenge {
  const daySeed = Math.floor(date.getTime() / 86_400_000);
  return challenges[daySeed % challenges.length];
}

export function getChallengeById(id?: string | null): Challenge {
  return challenges.find((challenge) => challenge.id === id) ?? getDailyChallenge();
}

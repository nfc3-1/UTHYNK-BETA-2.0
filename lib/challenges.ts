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
    id: "logic-pressure",
    category: "Logic Under Pressure",
    title: "Fast Decision Trap",
    prompt:
      "You are pressured to make a fast decision with incomplete information. How do you slow down your thinking without missing the opportunity?",
    difficulty: "starter",
    trait: "Decision Discipline",
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
  {
    id: "history-narrative",
    category: "Philosophy of History",
    title: "Competing Narratives",
    prompt:
      "Two people explain the same historical event in completely different ways. How do you evaluate which narrative is stronger?",
    difficulty: "intermediate",
    trait: "Historical Reasoning",
  },
  {
    id: "worldview-disagreement",
    category: "Worldview & Cultures",
    title: "Intelligent Disagreement",
    prompt:
      "Someone from a different culture reaches a conclusion you strongly disagree with. How do you test whether your own assumptions are limiting your judgment?",
    difficulty: "intermediate",
    trait: "Perspective Taking",
  },
  {
    id: "applied-ethics-tradeoff",
    category: "Applied Ethics",
    title: "Hard Tradeoff",
    prompt:
      "A decision helps one group but hurts another. How do you reason through the tradeoff without relying only on emotion?",
    difficulty: "intermediate",
    trait: "Moral Reasoning",
  },
  {
    id: "creative-reframe",
    category: "Creative Thinking",
    title: "Problem Reframe",
    prompt:
      "You are stuck on a problem and every obvious solution has failed. How do you reframe the problem to find a better path?",
    difficulty: "starter",
    trait: "Reframing",
  },
  {
    id: "street-incentives",
    category: "Street Lessons",
    title: "Hidden Incentives",
    prompt:
      "Someone gives you advice that sounds helpful but may benefit them more than you. How do you evaluate their incentives?",
    difficulty: "starter",
    trait: "Incentive Awareness",
  },
  {
    id: "literature-character",
    category: "Literature & Wisdom",
    title: "Character Judgment",
    prompt:
      "A character makes a destructive choice while believing they are right. How do you analyze the flaw in their reasoning?",
    difficulty: "starter",
    trait: "Wisdom Pattern Recognition",
  },
];

export function getDailyChallenge(date = new Date()): Challenge {
  const daySeed = Math.floor(date.getTime() / 86_400_000);
  return challenges[daySeed % challenges.length];
}

export function getChallengeById(id?: string | null): Challenge {
  return challenges.find((challenge) => challenge.id === id) ?? getDailyChallenge();
}

import { getCategories, getQuestionsForCategory, slugifyCategory } from "@/lib/questionBank";

export type Challenge = {
  id: string;
  category: string;
  title: string;
  prompt: string;
  difficulty: "everyday" | "practical" | "critical" | "strategic";
  trait: string;
};

const traitByCategory: Record<string, string> = {
  "Logic & Critical Thinking": "Argument Mapping",
  "Epistemology": "Evidence Discipline",
  "Ethics & Moral Reasoning": "Moral Reasoning",
  "Strategic Thinking": "Strategic Judgment",
  "Street Lessons": "Practical Judgment",
  "Financial Judgment": "Opportunity Cost",
  "Leadership & Influence": "Social Calibration",
  "Media & Information Literacy": "Bias Detection",
  "Science & Evidence": "Evidence Discipline",
  "History & Civilization": "Historical Reasoning",
  "Technology & AI": "Systems Awareness",
  "Creativity & Innovation": "Creative Reframing",
  "Work, Purpose & Ambition": "Tactical Thinking",
  "Identity & Human Behavior": "Self-Reflection",
  "Literature & Timeless Wisdom": "Wisdom Pattern Recognition",
};

function difficultyForIndex(index: number): Challenge["difficulty"] {
  if (index < 8) return "everyday";
  if (index < 16) return "practical";
  if (index < 24) return "critical";

  return "strategic";
}

function titleForPrompt(prompt: string, index: number) {
  const firstClause = prompt
    .split("?")[0]
    .replace(/^(A|An|The|In)\s+/i, "")
    .trim();

  if (!firstClause) return `Scenario ${index + 1}`;

  return firstClause.length > 44 ? `${firstClause.slice(0, 41)}...` : firstClause;
}

export const challenges: Challenge[] = getCategories().flatMap((category) =>
  getQuestionsForCategory(category).map((prompt, index) => ({
    id: `${slugifyCategory(category)}-${String(index + 1).padStart(2, "0")}`,
    category,
    title: titleForPrompt(prompt, index),
    prompt,
    difficulty: difficultyForIndex(index),
    trait: traitByCategory[category] || "Reasoning Discipline",
  }))
);

export function getDailyChallenge(date = new Date()): Challenge {
  const daySeed = Math.floor(date.getTime() / 86_400_000);

  return challenges[daySeed % challenges.length];
}

export function getChallengeById(id?: string | null): Challenge {
  return challenges.find((challenge) => challenge.id === id) ?? getDailyChallenge();
}

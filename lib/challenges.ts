import { getCategories, getQuestionsForCategory, slugifyCategory } from "@/lib/questionBank";

export type Challenge = {
  id: string;
  category: string;
  title: string;
  prompt: string;
  difficulty: "starter" | "intermediate" | "advanced";
  trait: string;
};

const traitByCategory: Record<string, string> = {
  "Work & Ambition": "Tactical Thinking",
  "Financial Judgment": "Opportunity Cost",
  "Media Literacy": "Bias Detection",
  "Logic & Debate": "Argument Mapping",
  "People & Leadership": "Social Calibration",
  "Strategic Thinking": "Strategic Judgment",
  "Philosophy of History": "Historical Reasoning",
  "Worldview & Cultures": "Perspective Taking",
  "Ethics & Values": "Moral Reasoning",
  "Creative Thinking": "Creative Reframing",
  "Literature & Wisdom": "Wisdom Pattern Recognition",
  "Science & Evidence": "Evidence Discipline",
  "Technology & AI": "Systems Awareness",
  "Health & Habits": "Habit Reasoning",
  "Civic Thinking": "Civic Reasoning",
  "Personal Identity": "Self-Reflection",
  Epistemology: "Evidence Discipline",
};

function difficultyForIndex(index: number): Challenge["difficulty"] {
  if (index < 10) return "starter";
  if (index < 20) return "intermediate";

  return "advanced";
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

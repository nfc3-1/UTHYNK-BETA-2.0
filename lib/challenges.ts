export type Challenge = {
  id: string;
  category: string;
  title: string;
  prompt: string;
  difficulty: "starter" | "intermediate" | "advanced";
  trait: string;
};

const challengeDomains = [
  ["Workplace Strategy", "credit, timing, reputation, and leverage at work", "Tactical Thinking"],
  ["Financial Judgment", "risk, incentives, debt, upside, and opportunity cost", "Opportunity Cost"],
  ["Media Manipulation", "headlines, outrage, framing, and emotional triggers", "Bias Detection"],
  ["Logic Under Pressure", "fast decisions, uncertainty, and clean argument structure", "Decision Discipline"],
  ["Social Intelligence", "status, tone, trust, conflict, and emotional control", "Social Calibration"],
  ["Strategic Thinking", "tradeoffs, second-order effects, and long-term positioning", "Strategic Judgment"],
  ["Philosophy of History", "timelines, causality, narratives, and historical bias", "Historical Reasoning"],
  ["Worldview & Cultures", "intelligent disagreement, culture, values, and assumptions", "Perspective Taking"],
  ["Applied Ethics", "stakeholders, harm, fairness, and competing principles", "Moral Reasoning"],
  ["Creative Thinking", "constraints, reframing, invention, and useful originality", "Creative Reframing"],
  ["Street Lessons", "hidden incentives, pressure, risk, and human behavior", "Incentive Awareness"],
  ["Literature & Wisdom", "character, motive, tragedy, pride, and timeless patterns", "Wisdom Pattern Recognition"],
  ["Debate & Argument", "claims, evidence, warrants, counterarguments, and steelmanning", "Argument Mapping"],
  ["Science & Evidence", "measurement, uncertainty, base rates, and causal claims", "Evidence Discipline"],
  ["Technology & AI", "automation, privacy, dependency, and unintended consequences", "Systems Awareness"],
  ["Health & Habits", "discipline, comfort, identity, incentives, and self-deception", "Habit Reasoning"],
  ["Leadership", "responsibility, standards, incentives, and group trust", "Leadership Judgment"],
  ["Relationships", "boundaries, repair, loyalty, honesty, and emotional timing", "Relational Judgment"],
  ["Civic Thinking", "policy tradeoffs, rights, duties, and public incentives", "Civic Reasoning"],
  ["Personal Identity", "ego, self-image, fear, ambition, and changing your mind", "Self-Reflection"],
] as const;

const promptFrames = [
  ["Assumption Audit", "What assumption are most people likely to make about {focus}, and how would you test it before acting?"],
  ["Evidence Check", "Someone makes a confident claim about {focus}. What evidence would actually move your confidence up or down?"],
  ["Incentive Map", "Who benefits if you accept the obvious interpretation of {focus}, and what incentive might they be hiding?"],
  ["Second-Order Move", "If your first solution to {focus} works, what second problem might it create?"],
  ["Opposing Case", "What is the strongest opposing view on {focus}, and what part of it deserves respect?"],
  ["Emotional Control", "A situation involving {focus} makes you angry. How do you separate the signal from the emotional noise?"],
  ["Tradeoff Decision", "You must choose between speed and accuracy in {focus}. What tradeoff would guide your decision?"],
  ["Status Pressure", "People around you reward the popular answer about {focus}. How do you reason independently without becoming reckless?"],
  ["Long-Term Lens", "What decision about {focus} looks good today but may weaken your position later?"],
  ["Hidden Variable", "What missing variable would most change your judgment about {focus}?"],
  ["Principle Test", "What principle would you use to judge {focus}, and where might that principle break down?"],
  ["Probability Shift", "What would make your current view of {focus} 30%, 60%, or 90% likely?"],
  ["Narrative Trap", "What story do people tell about {focus}, and what facts might the story leave out?"],
  ["Action Threshold", "At what point would you stop analyzing {focus} and take action?"],
  ["Risk Reversal", "What risk in {focus} are you overestimating, and what risk are you underestimating?"],
  ["Stakeholder Scan", "Who is affected by a decision about {focus}, and whose perspective is easiest to ignore?"],
  ["Character Read", "What does a person's choice around {focus} reveal about their priorities?"],
  ["Growth Reflection", "How would a more disciplined version of you reason through {focus}?"],
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function difficultyForIndex(index: number): Challenge["difficulty"] {
  if (index < 6) return "starter";
  if (index < 12) return "intermediate";

  return "advanced";
}

export const challenges: Challenge[] = challengeDomains.flatMap(
  ([category, focus, trait], domainIndex) =>
    promptFrames.map(([title, prompt], promptIndex) => ({
      id: `${slugify(category)}-${String(promptIndex + 1).padStart(2, "0")}`,
      category,
      title,
      prompt: prompt.replace("{focus}", focus),
      difficulty: difficultyForIndex(promptIndex),
      trait,
    }))
);

export function getDailyChallenge(date = new Date()): Challenge {
  const daySeed = Math.floor(date.getTime() / 86_400_000);

  return challenges[daySeed % challenges.length];
}

export function getChallengeById(id?: string | null): Challenge {
  return challenges.find((challenge) => challenge.id === id) ?? getDailyChallenge();
}

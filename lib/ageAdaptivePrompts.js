const categoryContexts = {
  "Logic & Critical Thinking": {
    child: "checking reasons, examples, and weak claims",
    teen: "claims, assumptions, evidence, fallacies, and counterarguments",
  },
  Epistemology: {
    child: "checking how you know something is true",
    teen: "sources, certainty, proof, trust, and changing your mind",
  },
  "Ethics & Moral Reasoning": {
    child: "fairness, promises, rules, and helping people",
    teen: "fairness, loyalty, harm, duties, and hard choices",
  },
  "Strategic Thinking": {
    child: "thinking one step ahead",
    teen: "tradeoffs, second-order effects, and long-term choices",
  },
  "Street Lessons": {
    child: "pressure, promises, risk, respect, and smart boundaries",
    teen: "trust, incentives, reputation, pressure, risk, and consequences",
  },
  "Financial Judgment": {
    child: "spending, saving, trading, and waiting",
    teen: "money choices, risk, upside, and opportunity cost",
  },
  "Leadership & Influence": {
    child: "being trusted by a team or class",
    teen: "responsibility, standards, communication, and group trust",
  },
  "Media & Information Literacy": {
    child: "videos, headlines, posts, creators, and rumors",
    teen: "social feeds, creators, algorithms, framing, and viral claims",
  },
  "Science & Evidence": {
    child: "testing an idea and checking clues",
    teen: "evidence, uncertainty, sample size, and cause-and-effect claims",
  },
  "History & Civilization": {
    child: "past events, leaders, and choices that changed groups",
    teen: "historical context, institutions, leaders, conflict, and consequences",
  },
  "Technology & AI": {
    child: "apps, games, screens, and smart tools",
    teen: "automation, privacy, dependency, algorithms, and unintended effects",
  },
  "Creativity & Innovation": {
    child: "solving a problem in a new way",
    teen: "constraints, originality, useful ideas, and testing experiments",
  },
  "Work, Purpose & Ambition": {
    child: "school projects, effort, practice, teams, and credit",
    teen: "school, first jobs, effort, reputation, ambition, and leverage",
  },
  "Identity & Human Behavior": {
    child: "who you are, feelings, habits, and changing your mind",
    teen: "identity, ego, confidence, emotions, habits, and behavior patterns",
  },
  "Literature & Timeless Wisdom": {
    child: "a character making a choice in a story",
    teen: "character, motive, pride, wisdom, and consequences",
  },
};

const titleFrameMap = {
  "Action Threshold": "action",
  "Assumption Audit": "assumption",
  "Character Read": "character",
  "Emotional Control": "emotion",
  "Evidence Check": "evidence",
  "Growth Reflection": "growth",
  "Hidden Variable": "hidden",
  "Incentive Map": "incentive",
  "Long-Term Lens": "longTerm",
  "Narrative Trap": "narrative",
  "Opposing Case": "opposing",
  "Principle Test": "principle",
  "Probability Shift": "probability",
  "Risk Reversal": "risk",
  "Second-Order Move": "secondOrder",
  "Stakeholder Scan": "stakeholder",
  "Status Pressure": "status",
  "Tradeoff Decision": "tradeoff",
};

function contextFor(category, ageBand) {
  const context = categoryContexts[category];

  if (!context) {
    return ageBand === "under_13" ? "real-life choices" : "school, online life, and real choices";
  }

  return ageBand === "under_13" ? context.child : context.teen;
}

export function normalizeAgeBand(value) {
  if (value === "under_13" || value === "13_17") {
    return value;
  }

  return "18_plus";
}

export function ageBandLabel(ageBand) {
  if (ageBand === "under_13") return "Youth mode";
  if (ageBand === "13_17") return "Teen mode";

  return "Adult mode";
}

function inferFrame(question, index = 0) {
  const lower = question.toLowerCase();

  if (lower.includes("assumption") || lower.includes("hidden")) return "assumption";
  if (lower.includes("evidence") || lower.includes("verify") || lower.includes("check")) return "evidence";
  if (lower.includes("benefit") || lower.includes("incentive")) return "incentive";
  if (lower.includes("second") || lower.includes("consequence")) return "secondOrder";
  if (lower.includes("opposing") || lower.includes("against") || lower.includes("counter")) return "opposing";
  if (lower.includes("emotion") || lower.includes("angry") || lower.includes("pressure")) return "emotion";
  if (lower.includes("tradeoff") || lower.includes("cost")) return "tradeoff";
  if (lower.includes("status") || lower.includes("popular")) return "status";
  if (lower.includes("long") || lower.includes("future")) return "longTerm";
  if (lower.includes("principle") || lower.includes("fair")) return "principle";
  if (lower.includes("risk")) return "risk";
  if (lower.includes("who is affected") || lower.includes("perspective")) return "stakeholder";
  if (lower.includes("character") || lower.includes("person")) return "character";
  if (lower.includes("change your mind") || lower.includes("growth")) return "growth";

  const fallbackFrames = [
    "evidence",
    "incentive",
    "assumption",
    "opposing",
    "emotion",
    "secondOrder",
  ];

  return fallbackFrames[index % fallbackFrames.length];
}

function promptForFrame(frame, category, ageBand) {
  const context = contextFor(category, ageBand);

  if (ageBand === "under_13") {
    const prompts = {
      action: `In ${context}, what would tell you it is time to stop guessing and make a choice?`,
      assumption: `In ${context}, what might you be assuming before you know enough?`,
      character: `In ${context}, what does someone's choice show about what matters to them?`,
      emotion: `In ${context}, what feeling could make thinking harder, and how could you slow down?`,
      evidence: `Someone says something about ${context}. What clue would help you know if it is true?`,
      growth: `In ${context}, how would a calmer, smarter version of you think this through?`,
      hidden: `In ${context}, what important clue might be missing?`,
      incentive: `In ${context}, what might someone want you to believe, and why?`,
      longTerm: `In ${context}, what choice feels good now but could cause a problem later?`,
      narrative: `In ${context}, what part of the story might be left out?`,
      opposing: `In ${context}, what would someone who disagrees with you say that might be fair?`,
      principle: `In ${context}, what rule would be fair if everyone had to follow it?`,
      probability: `In ${context}, what would make you a little sure, pretty sure, or very sure?`,
      risk: `In ${context}, what danger might you be missing or making too big?`,
      secondOrder: `If your first idea about ${context} works, what new problem could it create?`,
      stakeholder: `In ${context}, who else is affected and easy to forget?`,
      status: `In ${context}, how could wanting to fit in make someone think less clearly?`,
      tradeoff: `In ${context}, what do you gain and what do you give up?`,
    };

    return prompts[frame];
  }

  const prompts = {
    action: `In ${context}, when would you stop analyzing and take action?`,
    assumption: `In ${context}, what assumption could be shaping your first reaction?`,
    character: `In ${context}, what does someone's choice reveal about their priorities?`,
    emotion: `In ${context}, what emotion could distort your judgment, and how would you separate signal from noise?`,
    evidence: `Someone makes a confident claim about ${context}. What would you check before believing or sharing it?`,
    growth: `In ${context}, how would a more disciplined version of you reason through this?`,
    hidden: `In ${context}, what missing variable would most change your judgment?`,
    incentive: `In ${context}, who benefits if people accept the obvious story too quickly?`,
    longTerm: `In ${context}, what looks good now but could weaken your position later?`,
    narrative: `In ${context}, what story are people telling, and what facts might it leave out?`,
    opposing: `In ${context}, what is the strongest opposing view, and what part deserves respect?`,
    principle: `In ${context}, what principle would you use, and where might it break down?`,
    probability: `In ${context}, what would make your view 30%, 60%, or 90% likely?`,
    risk: `In ${context}, what risk are you overestimating, and what risk are you underestimating?`,
    secondOrder: `If your first solution in ${context} works, what second problem might it create?`,
    stakeholder: `In ${context}, who is affected, and whose perspective is easiest to ignore?`,
    status: `In ${context}, how could peer pressure or status rewards distort the answer?`,
    tradeoff: `In ${context}, what tradeoff would guide the decision?`,
  };

  return prompts[frame];
}

export function adaptQuestionForAge(question, category, ageBandValue, index = 0) {
  const ageBand = normalizeAgeBand(ageBandValue);

  if (ageBand === "18_plus") {
    return question;
  }

  return promptForFrame(inferFrame(question, index), category, ageBand);
}

export function adaptChallengeForAge(challenge, ageBandValue) {
  const ageBand = normalizeAgeBand(ageBandValue);

  if (ageBand === "18_plus") {
    return challenge;
  }

  return {
    ...challenge,
    prompt: promptForFrame(titleFrameMap[challenge.title] || inferFrame(challenge.prompt), challenge.category, ageBand),
  };
}

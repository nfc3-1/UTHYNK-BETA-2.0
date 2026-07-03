import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import {
  persistCanonicalConversation,
  updateCanonicalUserProgress,
  upsertCanonicalTrait,
} from "@/lib/canonicalPersistence";
import { getReasoningMemory } from "@/lib/memory";
import {
  calculateNextStreak,
  calculateReasoningScore,
  getRankFromXp,
} from "@/lib/progression";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";
import { evolveTraitScore } from "@/lib/traits";

type ReasoningRequest = {
  ageBand?: "under_13" | "13_17" | "18_plus";
  challenge?: string;
  challengeId?: string;
  category?: string;
  conversationId?: string;
  language?: "en" | "es" | "fr";
  phase?: "follow_up" | "synthesis";
  question?: string;
  response?: string;
  section?: string;
  sessionId?: string;
  stream?: boolean;
  thinkingLens?: string;
  userId?: string;
};

type ReasoningCategory =
  | "logic-critical-thinking"
  | "epistemology"
  | "ethics-moral-reasoning"
  | "strategic-thinking"
  | "street-lessons"
  | "financial-judgment"
  | "leadership-influence"
  | "media-information-literacy"
  | "science-evidence"
  | "history-civilization"
  | "technology-ai"
  | "creativity-innovation"
  | "work-purpose-ambition"
  | "identity-human-behavior"
  | "literature-timeless-wisdom";

type BehavioralScores = {
  evidence: number;
  adaptability: number;
  emotionalControl: number;
  incentives: number;
};

type VerifierResult = {
  score: number;
  behavioral: BehavioralScores;
  signals: Record<string, boolean>;
  missingMoves: string[];
};

type ReasoningFeedback = {
  analysis: string;
  behavioral: BehavioralScores;
  contrarian: string;
  followUp: string;
  score: number;
  strengths: string[];
  trait: string;
  weaknesses: string[];
  xp: number;
  verifier: VerifierResult;
};

type CategoryPrompt = {
  category: ReasoningCategory;
  evaluatorRole: string;
  reasoningLens: string[];
  followUpDirective: string;
  traitOptions: string[];
  temperature: number;
};

const categoryPromptMap: Record<ReasoningCategory, CategoryPrompt> = {
  "logic-critical-thinking": {
    category: "logic-critical-thinking",
    evaluatorRole: "argument quality verifier",
    reasoningLens: ["claim precision", "evidence", "warrant strength", "counterargument handling"],
    followUpDirective:
      "Challenge the weakest claim, hidden assumption, contradiction, fallacy, or missing evidence in plain language.",
    traitOptions: ["Evidence Discipline", "Intellectual Flexibility", "Argument Mapping"],
    temperature: 0.58,
  },
  epistemology: {
    category: "epistemology",
    evaluatorRole: "truth and evidence verifier",
    reasoningLens: ["source quality", "certainty", "belief versus knowledge", "trust", "what would change the user's mind"],
    followUpDirective:
      "Ask what evidence, source quality, or uncertainty should change the user's confidence.",
    traitOptions: ["Evidence Discipline", "Intellectual Humility", "Source Calibration"],
    temperature: 0.48,
  },
  "ethics-moral-reasoning": {
    category: "ethics-moral-reasoning",
    evaluatorRole: "moral reasoning verifier",
    reasoningLens: ["fairness", "responsibility", "harm", "duty", "competing values", "consequences"],
    followUpDirective:
      "Test the user's answer against who is helped, who is harmed, and which principle should hold under pressure.",
    traitOptions: ["Moral Reasoning", "Perspective Taking", "Principled Judgment"],
    temperature: 0.52,
  },
  "strategic-thinking": {
    category: "strategic-thinking",
    evaluatorRole: "decision strategy verifier",
    reasoningLens: ["tradeoffs", "incentives", "reversibility", "second-order effects"],
    followUpDirective:
      "Push the user to think several moves ahead: what happens next, who adapts, and what problem appears later.",
    traitOptions: ["Strategic Restraint", "Risk Calibration", "Incentive Awareness"],
    temperature: 0.46,
  },
  "street-lessons": {
    category: "street-lessons",
    evaluatorRole: "practical consequence verifier",
    reasoningLens: ["trust", "leverage", "motives", "pressure", "reputation", "risk", "consequences"],
    followUpDirective:
      "Sound like an experienced mentor who has seen expensive mistakes. Focus on the price of getting this wrong without glorifying cynicism, crime, violence, or manipulation.",
    traitOptions: ["Practical Judgment", "Boundary Awareness", "Incentive Awareness"],
    temperature: 0.5,
  },
  "financial-judgment": {
    category: "financial-judgment",
    evaluatorRole: "financial judgment verifier",
    reasoningLens: ["risk", "return", "cash flow", "debt", "liquidity", "opportunity cost", "time horizon"],
    followUpDirective:
      "Challenge the user to consider opportunity cost, downside risk, incentives, cash flow, and time horizon.",
    traitOptions: ["Opportunity Cost", "Risk Calibration", "Long-Term Discipline"],
    temperature: 0.44,
  },
  "leadership-influence": {
    category: "leadership-influence",
    evaluatorRole: "leadership and influence verifier",
    reasoningLens: ["trust", "accountability", "motivation", "conflict", "communication", "team consequences"],
    followUpDirective:
      "Ask how the user's response affects trust, clarity, accountability, morale, and the team's future behavior.",
    traitOptions: ["Social Calibration", "Accountability", "Trust Building"],
    temperature: 0.52,
  },
  "media-information-literacy": {
    category: "media-information-literacy",
    evaluatorRole: "media literacy verifier",
    reasoningLens: ["framing", "missing context", "source incentives", "bias", "fact versus opinion", "persuasion"],
    followUpDirective:
      "Push the user to check framing, missing context, source incentives, and whether emotion is outrunning evidence.",
    traitOptions: ["Bias Detection", "Source Calibration", "Independent Verification"],
    temperature: 0.5,
  },
  "science-evidence": {
    category: "science-evidence",
    evaluatorRole: "scientific evidence verifier",
    reasoningLens: ["study design", "controls", "correlation", "causation", "sample size", "uncertainty"],
    followUpDirective:
      "Challenge the user on causation, controls, sample size, uncertainty, and what evidence would actually prove the claim.",
    traitOptions: ["Scientific Reasoning", "Evidence Discipline", "Uncertainty Calibration"],
    temperature: 0.42,
  },
  "history-civilization": {
    category: "history-civilization",
    evaluatorRole: "historical pattern verifier",
    reasoningLens: ["historical context", "institutions", "leaders", "wars", "reforms", "patterns", "consequences"],
    followUpDirective:
      "Ask what historical context, institutional pressure, or repeating pattern the user may be missing.",
    traitOptions: ["Historical Reasoning", "Pattern Recognition", "Context Awareness"],
    temperature: 0.5,
  },
  "technology-ai": {
    category: "technology-ai",
    evaluatorRole: "technology impact verifier",
    reasoningLens: ["AI", "privacy", "automation", "algorithms", "tradeoffs", "human behavior", "future consequences"],
    followUpDirective:
      "Challenge the user to weigh technology's benefits against incentives, privacy, dependency, and human behavior changes.",
    traitOptions: ["Systems Awareness", "Future Consequence Mapping", "Tradeoff Thinking"],
    temperature: 0.5,
  },
  "creativity-innovation": {
    category: "creativity-innovation",
    evaluatorRole: "creative reasoning verifier",
    reasoningLens: ["constraints", "invention", "reframing", "experiments", "alternatives", "practical creativity"],
    followUpDirective:
      "Change the frame, constraint, or experiment so the user generates a more practical alternative.",
    traitOptions: ["Creative Reframing", "Adaptive Thinking", "Constraint Fluency"],
    temperature: 0.72,
  },
  "work-purpose-ambition": {
    category: "work-purpose-ambition",
    evaluatorRole: "career and ambition verifier",
    reasoningLens: ["career choices", "discipline", "sacrifice", "purpose", "productivity", "tradeoffs", "timing"],
    followUpDirective:
      "Ask what the user is trading for ambition, what timing matters, and what discipline or risk the situation requires.",
    traitOptions: ["Tactical Thinking", "Long-Term Discipline", "Ambition Calibration"],
    temperature: 0.5,
  },
  "identity-human-behavior": {
    category: "identity-human-behavior",
    evaluatorRole: "self-awareness verifier",
    reasoningLens: ["emotions", "habits", "bias", "defensiveness", "self-image", "behavior patterns"],
    followUpDirective:
      "Ask what emotion, habit, self-image, or hidden payoff may be shaping the behavior.",
    traitOptions: ["Self-Reflection", "Emotional Awareness", "Behavior Pattern Recognition"],
    temperature: 0.54,
  },
  "literature-timeless-wisdom": {
    category: "literature-timeless-wisdom",
    evaluatorRole: "wisdom pattern verifier",
    reasoningLens: ["stories", "characters", "proverbs", "classic books", "human nature", "practical application"],
    followUpDirective:
      "Connect the user's answer to a timeless pattern in character, desire, pride, patience, or consequence.",
    traitOptions: ["Wisdom Pattern Recognition", "Practical Wisdom", "Character Reading"],
    temperature: 0.58,
  },
};

const randomizedResponseModes = [
  "diagnostic",
  "counterfactual",
  "decision checkpoint",
  "assumption audit",
  "pressure test",
  "steelman reversal",
];

function normalizeCategory(category?: string, challenge?: string): ReasoningCategory {
  const source = `${category || ""} ${challenge || ""}`.toLowerCase();

  if (/logic-critical-thinking|logic|critical|debate|argument|fallacy|claim|contradiction/.test(source)) return "logic-critical-thinking";
  if (/epistemology|source|truth|know|certainty|belief|trust|proof/.test(source)) return "epistemology";
  if (/ethics-moral|ethic|moral|fair|harm|duty|responsibility|principle/.test(source)) return "ethics-moral-reasoning";
  if (/strategic-thinking|strategy|second-order|long-term|tradeoff|leverage|timing/.test(source)) return "strategic-thinking";
  if (/street-lessons|street|reputation|respect|loyalty|boundary|walk away|pressure/.test(source)) return "street-lessons";
  if (/financial|money|debt|invest|cash|budget|mortgage|retire|bonus/.test(source)) return "financial-judgment";
  if (/leadership|influence|leader|manager|team|accountability|morale/.test(source)) return "leadership-influence";
  if (/media|information|headline|viral|outlet|framing|misinformation|algorithm/.test(source)) return "media-information-literacy";
  if (/science|evidence|study|trial|sample|causation|correlation|experiment/.test(source)) return "science-evidence";
  if (/history|civilization|rome|war|crisis|revolution|empire|industrial/.test(source)) return "history-civilization";
  if (/technology|ai|automation|privacy|deepfake|app|chatbot|driverless/.test(source)) return "technology-ai";
  if (/creativity|innovation|creative|invent|reframe|experiment|idea|prototype/.test(source)) return "creativity-innovation";
  if (/work|purpose|ambition|career|job|raise|promotion|discipline|success/.test(source)) return "work-purpose-ambition";
  if (/identity|human behavior|emotion|habit|defensive|self-image|procrastinat/.test(source)) return "identity-human-behavior";
  if (/literature|wisdom|story|gatsby|aesop|odyssey|shakespeare|proverb|book/.test(source)) return "literature-timeless-wisdom";

  return "logic-critical-thinking";
}

function hashText(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function stableModeSeed(input: {
  category: ReasoningCategory;
  challenge: string;
  conversationId: string;
  response: string;
  sessionId: string;
  memory: any;
}) {
  return hashText(
    [
      input.category,
      input.sessionId,
      input.conversationId,
      input.challenge,
      input.response,
      input.memory?.recentPatterns?.length || 0,
      input.memory?.recentFollowUps?.join("|") || "",
    ].join(":")
  );
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function verifierEngine(response: string, category: ReasoningCategory): VerifierResult {
  const lower = response.toLowerCase();
  const words = response.trim() ? response.trim().split(/\s+/).length : 0;
  const signals = {
    evidence: /\b(because|evidence|data|example|for instance|shows|proof|observed)\b/.test(lower),
    alternatives: /\b(alternative|option|instead|another|otherwise|could)\b/.test(lower),
    tradeoff: /\b(tradeoff|risk|cost|benefit|downside|upside|however|although|but)\b/.test(lower),
    action: /\b(next|then|first|step|would|will|should|test|measure)\b/.test(lower),
    perspective: /\b(they|their|someone|stakeholder|opponent|other side|audience)\b/.test(lower),
    emotionalControl: /\b(calm|pause|listen|avoid|de-escalate|wait|tone|restraint)\b/.test(lower),
    incentives: /\b(incentive|motivation|leverage|reward|pressure|reputation|cost)\b/.test(lower),
  };

  const behavioral = {
    evidence: clamp((signals.evidence ? 72 : 42) + Math.min(18, words)),
    adaptability: clamp((signals.alternatives ? 68 : 40) + (signals.tradeoff ? 12 : 0) + Math.min(12, words / 2)),
    emotionalControl: clamp((signals.emotionalControl ? 74 : 44) + (signals.perspective ? 10 : 0)),
    incentives: clamp((signals.incentives ? 74 : 42) + (signals.tradeoff ? 10 : 0)),
  };
  const categoryWeights: Record<ReasoningCategory, (keyof BehavioralScores)[]> = {
    "logic-critical-thinking": ["evidence", "adaptability"],
    epistemology: ["evidence", "adaptability"],
    "ethics-moral-reasoning": ["emotionalControl", "adaptability"],
    "strategic-thinking": ["incentives", "adaptability"],
    "street-lessons": ["incentives", "emotionalControl"],
    "financial-judgment": ["incentives", "adaptability"],
    "leadership-influence": ["emotionalControl", "incentives"],
    "media-information-literacy": ["evidence", "adaptability"],
    "science-evidence": ["evidence", "adaptability"],
    "history-civilization": ["adaptability", "evidence"],
    "technology-ai": ["adaptability", "incentives"],
    "creativity-innovation": ["adaptability", "evidence"],
    "work-purpose-ambition": ["incentives", "adaptability"],
    "identity-human-behavior": ["emotionalControl", "adaptability"],
    "literature-timeless-wisdom": ["adaptability", "emotionalControl"],
  };
  const weightedKeys = categoryWeights[category];
  const weighted = weightedKeys.reduce((sum, key) => sum + behavioral[key], 0) / weightedKeys.length;
  const base = Math.min(28, words * 1.1);
  const score = clamp(35 + base + weighted * 0.45);
  const missingMoves = Object.entries(signals)
    .filter(([, present]) => !present)
    .map(([name]) => name)
    .slice(0, 4);

  return {
    score,
    behavioral,
    signals,
    missingMoves,
  };
}

function ensureString(value: unknown, fallback: string) {
  const text = String(value || "").trim();

  return text || fallback;
}

function ensureList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.map((item) => String(item || "").trim()).filter(Boolean);

  return Array.from(new Set(items)).slice(0, 4);
}

function sanitizeFeedback(
  parsed: any,
  verifier: VerifierResult,
  categoryPrompt: CategoryPrompt
): ReasoningFeedback {
  const aiScore = Number(parsed?.score);
  const score = clamp(
    Number.isFinite(aiScore) ? aiScore * 0.72 + verifier.score * 0.28 : verifier.score
  );
  const trait = ensureString(parsed?.trait, categoryPrompt.traitOptions[0]);

  return {
    analysis: ensureString(
      parsed?.analysis,
      "The model returned incomplete analysis. Try again with a more specific response."
    ),
    behavioral: {
      evidence: clamp(Number(parsed?.behavioral?.evidence) || verifier.behavioral.evidence),
      adaptability: clamp(
        Number(parsed?.behavioral?.adaptability) || verifier.behavioral.adaptability
      ),
      emotionalControl: clamp(
        Number(parsed?.behavioral?.emotionalControl) || verifier.behavioral.emotionalControl
      ),
      incentives: clamp(Number(parsed?.behavioral?.incentives) || verifier.behavioral.incentives),
    },
    contrarian: ensureString(
      parsed?.contrarian,
      "Have you considered that the strongest opposing view may explain the same facts with fewer assumptions?"
    ),
    followUp: ensureString(
      parsed?.followUp,
      "What is the next test that would most quickly expose whether your reasoning is sound?"
    ),
    score,
    strengths: ensureList(parsed?.strengths, categoryPrompt.reasoningLens.slice(0, 2)),
    trait,
    weaknesses: ensureList(parsed?.weaknesses, verifier.missingMoves),
    xp: clamp(Number(parsed?.xp) || (score >= 85 ? 70 : score >= 70 ? 52 : 35), 20, 95),
    verifier,
  };
}

function buildAdaptiveSystemPrompt({
  categoryPrompt,
  conversationId,
  language,
  memory,
  mode,
  phase,
  profile,
  sessionId,
  verifier,
}: {
  categoryPrompt: CategoryPrompt;
  conversationId: string;
  language: "en" | "es" | "fr";
  memory?: any;
  mode: string;
  phase?: "follow_up" | "synthesis";
  profile?: any;
  sessionId: string;
  verifier: VerifierResult;
}) {
  const ageBand = profile?.age_band || "18_plus";
  const style = profile?.onboarding_style || "balanced";
  const ageDirective =
    ageBand === "under_13"
      ? "Use short, concrete language for a younger user. Prefer school, friends, games, family, online posts, fairness, and simple choices. Avoid workplace, finance, politics, dating, and adult-risk examples unless the user raises them. Be curious, not intimidating."
      : ageBand === "13_17"
        ? "Use teen-relevant examples: school, first jobs, friends, social media, reputation, peer pressure, identity, money habits, and online information. Keep the reasoning rigorous but approachable."
        : "Use adult-level reasoning, including work, finance, leadership, relationships, civic tradeoffs, and long-term strategy where relevant.";
  const recentFollowUps = memory?.recentFollowUps?.filter(Boolean).slice(0, 8) || [];
  const responseLanguage =
    language === "es" ? "Spanish" : language === "fr" ? "French" : "English";

  return [
    "You are UThynk, an adaptive reasoning coach. You must produce specific, non-repetitive feedback.",
    `Write every user-facing response field in ${responseLanguage}. Keep JSON keys in English.`,
    `Session identity: sessionId=${sessionId}, conversationId=${conversationId}.`,
    `Category: ${categoryPrompt.category}. Role: ${categoryPrompt.evaluatorRole}.`,
    `Response mode: ${mode}. Do not reuse the same opening, cadence, or follow-up shape from prior turns.`,
    `Reasoning lens: ${categoryPrompt.reasoningLens.join(", ")}.`,
    `Follow-up directive: ${categoryPrompt.followUpDirective}`,
    `Available trait labels: ${categoryPrompt.traitOptions.join(", ")}.`,
    "Category discipline: respond through this selected category lens. Do not drift into a generic coach response.",
    "Tone: use plain everyday language. Sound like a smart mentor, not a professor, therapist, worksheet, or motivational speaker.",
    categoryPrompt.category === "street-lessons"
      ? "Street Lessons tone: practical, direct, consequence-focused, and grounded in trust, pressure, incentives, reputation, and risk. Never glorify crime, violence, manipulation, or cynicism. The user should feel the price of getting the situation wrong."
      : "",
    `User age band: ${ageBand}. Coaching style: ${style}.`,
    `Age adaptation rule: ${ageDirective}`,
    `Persistent memory: ${JSON.stringify(memory || null)}.`,
    `Verifier engine result: ${JSON.stringify(verifier)}.`,
    `Do not repeat these follow-ups: ${JSON.stringify(recentFollowUps)}.`,
    phase === "synthesis"
      ? "Current workout phase: synthesis. The user has answered the original prompt and your follow-up. The analysis field must be an overarching response to both answers together: name the through-line, what improved, what is still missing, and one plain-language perspective they should carry forward. The followUp field should be a short optional next thought, not a required extra step."
      : "Current workout phase: follow_up. The user has answered the original prompt. Give one perspective they may not have considered and one conversational follow-up question. Do not treat the workout as complete yet.",
    "Product success test: the user should regularly think, 'I had not considered that.' Your main job is to introduce one meaningful new perspective, not to merely ask them to elaborate.",
    "The contrarian field must be a concrete perspective the user may have missed. Start from their actual response and introduce an alternate explanation, hidden tradeoff, strongest opposing case, incentive, evidence problem, or second-order effect.",
    "The analysis field should use common language: name what is promising, then name the missing perspective in plain terms. Avoid academic phrasing.",
    "The followUp field must be one practical, conversational question tied to that new perspective. It should sound like a sharp person talking to the user, not a worksheet or essay prompt.",
    "Prefer plain phrasing such as 'Have you thought about...', 'Could someone...', 'What if...', or 'What would change if...'. Avoid abstract academic wording like 'How might the emotional appeal of...' when a simpler sentence works.",
    "Do not use generic prompts like 'explain further', 'give another example', or 'clarify your reasoning'.",
    "Score by blending your judgment with the verifier result. Penalize generic, unsupported, or evasive reasoning.",
    "Return only valid JSON with keys: score number, xp number, trait string, analysis string, contrarian string, followUp string, strengths string[], weaknesses string[], behavioral object with evidence/adaptability/emotionalControl/incentives numbers.",
  ].join(" ");
}

async function loadProfile(userId?: string) {
  if (!userId || !hasSupabaseAdminEnv() || !supabaseAdmin) {
    return null;
  }

  const { data } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data;
}

async function updateTrait(userId: string, traitName: string, reasoningScore: number) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !traitName) {
    return null;
  }

  const { data: existing } = await supabaseAdmin
    .from("cognitive_traits")
    .select("id, trait_score")
    .eq("user_id", userId)
    .eq("trait_name", traitName)
    .single();

  const nextScore = evolveTraitScore(existing?.trait_score || 50, reasoningScore);

  if (existing?.id) {
    await supabaseAdmin
      .from("cognitive_traits")
      .update({
        trait_score: nextScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("cognitive_traits").insert({
      user_id: userId,
      trait_name: traitName,
      trait_score: nextScore,
    });
  }

  await upsertCanonicalTrait({
    evidence: `Reasoning score ${reasoningScore}`,
    profileId: userId,
    traitName,
    traitScore: nextScore,
  });

  return { traitName, traitScore: nextScore };
}

async function updateReasoningProfile(userId: string, feedback: ReasoningFeedback) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return null;
  }

  const { data: existing } = await supabaseAdmin
    .from("reasoning_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  const blend = (current: number | null | undefined, next: number) =>
    clamp((Number(current) || 50) * 0.75 + next * 0.25);

  const nextProfile = {
    user_id: userId,
    evidence_score: blend(existing?.evidence_score, feedback.behavioral.evidence),
    adaptability_score: blend(existing?.adaptability_score, feedback.behavioral.adaptability),
    emotional_control_score: blend(
      existing?.emotional_control_score,
      feedback.behavioral.emotionalControl
    ),
    incentives_score: blend(existing?.incentives_score, feedback.behavioral.incentives),
    dominant_trait: feedback.trait,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { data } = await supabaseAdmin
      .from("reasoning_profiles")
      .update(nextProfile)
      .eq("id", existing.id)
      .select("*")
      .single();

    return data;
  }

  const { data } = await supabaseAdmin
    .from("reasoning_profiles")
    .insert(nextProfile)
    .select("*")
    .single();

  return data;
}

async function updateUserProgress(userId: string, feedback: ReasoningFeedback) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return null;
  }

  const { data: existing } = await supabaseAdmin
    .from("user_profiles")
    .select("xp, reasoning_score, streak, primary_trait, updated_at")
    .eq("id", userId)
    .single();

  if (!existing) {
    return null;
  }

  const nextXp = (existing.xp || 0) + feedback.xp;
  const nextScore = calculateReasoningScore(existing.reasoning_score || 70, feedback.score);
  const nextStreak = calculateNextStreak(existing.updated_at || null, existing.streak || 0);
  const nextRank = getRankFromXp(nextXp);
  const evolvedTrait = await updateTrait(userId, feedback.trait, feedback.score);
  const reasoningProfile = await updateReasoningProfile(userId, feedback);

  await supabaseAdmin
    .from("user_profiles")
    .update({
      xp: nextXp,
      reasoning_score: nextScore,
      streak: nextStreak,
      rank: nextRank,
      primary_trait: feedback.trait || existing.primary_trait,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await updateCanonicalUserProgress({
    primaryTrait: feedback.trait || existing.primary_trait,
    profileId: userId,
    rank: nextRank,
    reasoningScore: nextScore,
    streak: nextStreak,
    xp: nextXp,
  });

  return {
    evolvedTrait,
    reasoningProfile,
    rank: nextRank,
    reasoningScore: nextScore,
    streak: nextStreak,
    xp: nextXp,
  };
}

async function persistSession({
  categoryPrompt,
  challenge,
  challengeId,
  conversationId,
  feedback,
  memory,
  mode,
  response,
  sessionId,
  thinkingLens,
  userId,
}: {
  categoryPrompt: CategoryPrompt;
  challenge: string;
  challengeId?: string;
  conversationId: string;
  feedback: ReasoningFeedback;
  memory?: any;
  mode: string;
  response: string;
  sessionId: string;
  thinkingLens?: string;
  userId?: string;
}) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !userId) {
    return null;
  }

  await supabaseAdmin.from("reasoning_sessions").insert({
    user_id: userId,
    session_id: sessionId,
    conversation_id: conversationId,
    challenge_id: challengeId || "daily",
    challenge_category: categoryPrompt.category,
    prompt: challenge,
    response,
    ai_analysis: feedback.analysis,
    contrarian_response: feedback.contrarian,
    follow_up: feedback.followUp,
    reasoning_score: feedback.score,
    xp_awarded: feedback.xp,
    trait_detected: feedback.trait,
    strengths: feedback.strengths,
    weaknesses: feedback.weaknesses,
    verifier_score: feedback.verifier.score,
    orchestration_category: categoryPrompt.category,
    cadence_key: mode,
    memory_snapshot: memory || null,
  });

  await supabaseAdmin.from("reasoning_followups").insert({
    user_id: userId,
    session_id: sessionId,
    conversation_id: conversationId,
    challenge_id: challengeId || "daily",
    challenge_category: categoryPrompt.category,
    follow_up: feedback.followUp,
    cadence_key: mode,
  });

  await supabaseAdmin.from("reasoning_verifier_scores").insert({
    user_id: userId,
    session_id: sessionId,
    conversation_id: conversationId,
    challenge_id: challengeId || "daily",
    challenge_category: categoryPrompt.category,
    ai_score: feedback.score,
    verifier_score: feedback.verifier.score,
    blended_score: feedback.score,
    rubric: categoryPrompt.reasoningLens.join(", "),
    signals: feedback.verifier,
  });

  await persistCanonicalConversation({
    category: categoryPrompt.category,
    challenge,
    challengeId,
    claim: response,
    conversationId,
    feedback,
    memory,
    sessionId,
    thinkingLens,
    userId,
  });

  return updateUserProgress(userId, feedback);
}

function jsonStreamEvent(type: string, payload: unknown) {
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function readGuestFreePassUsed(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("uthynk-free-pass-used="))
    ?.replace("uthynk-free-pass-used=", "");

  return Number(cookie || "0") || 0;
}

async function callOpenAi({
  apiKey,
  categoryPrompt,
  challenge,
  conversationId,
  language,
  memory,
  mode,
  phase,
  profile,
  question,
  response,
  section,
  sessionId,
  stream,
  thinkingLens,
  verifier,
}: {
  apiKey: string;
  categoryPrompt: CategoryPrompt;
  challenge: string;
  conversationId: string;
  language: "en" | "es" | "fr";
  memory?: any;
  mode: string;
  phase?: "follow_up" | "synthesis";
  profile?: any;
  question?: string;
  response: string;
  section?: string;
  sessionId: string;
  stream: boolean;
  thinkingLens?: string;
  verifier: VerifierResult;
}) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: categoryPrompt.temperature,
      stream,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildAdaptiveSystemPrompt({
            categoryPrompt,
            conversationId,
            language,
            memory,
            mode,
            phase,
            profile,
            sessionId,
            verifier,
          }),
        },
        {
          role: "user",
          content: JSON.stringify({
            ageBand: profile?.age_band || "18_plus",
            challenge,
            priorSessions: memory?.recentPatterns || [],
            phase,
            question,
            response,
            section,
            thinkingLens,
          }),
        },
      ],
    }),
  });
}

async function nonStreamingFeedback(args: Parameters<typeof callOpenAi>[0]) {
  const aiResponse = await callOpenAi({ ...args, stream: false });

  if (!aiResponse.ok) {
    throw new Error("OpenAI reasoning request failed.");
  }

  const data = await aiResponse.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty reasoning response.");
  }

  return JSON.parse(content);
}

function streamingFeedback(args: {
  apiKey: string;
  categoryPrompt: CategoryPrompt;
  challenge: string;
  challengeId?: string;
  conversationId: string;
  language: "en" | "es" | "fr";
  memory?: any;
  mode: string;
  phase?: "follow_up" | "synthesis";
  profile?: any;
  response: string;
  sessionId: string;
  thinkingLens?: string;
  userId?: string;
  verifier: VerifierResult;
}) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            jsonStreamEvent("orchestration", {
              category: args.categoryPrompt.category,
              conversationId: args.conversationId,
              mode: args.mode,
              sessionId: args.sessionId,
              verifier: args.verifier,
            })
          )
        );

        const aiResponse = await callOpenAi({ ...args, stream: true });

        if (!aiResponse.ok || !aiResponse.body) {
          throw new Error("OpenAI streaming request failed.");
        }

        const reader = aiResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let content = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed.startsWith("data:")) continue;

            const data = trimmed.slice(5).trim();

            if (data === "[DONE]") continue;

            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content || "";

            if (delta) {
              content += delta;
              controller.enqueue(encoder.encode(jsonStreamEvent("token", { token: delta })));
            }
          }
        }

        const parsed = JSON.parse(content);
        const feedback = sanitizeFeedback(parsed, args.verifier, args.categoryPrompt);
        const progression =
          args.phase === "follow_up" ? null : await persistSession({ ...args, feedback });

        controller.enqueue(
          encoder.encode(
            jsonStreamEvent("final", {
              source: "openai",
              memory: args.memory,
              mode: args.mode,
              onboardingProfile: args.profile,
              progression,
              ...feedback,
            })
          )
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            jsonStreamEvent("error", {
              error:
                error instanceof Error
                  ? error.message
                  : "Reasoning stream failed before completion.",
            })
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReasoningRequest;
    const sessionUser = await getServerSessionUser();
    const userId = sessionUser?.id;
    const sessionId = body.sessionId || crypto.randomUUID();
    const conversationId = body.conversationId || body.challengeId || sessionId;
    const challenge = body.challenge?.trim() || "Daily reasoning challenge";
    const language: "en" | "es" | "fr" =
      body.language === "es" || body.language === "fr" ? body.language : "en";
    const response = body.response?.trim() || "";

    if (!response) {
      return NextResponse.json(
        { error: "A response is required before reasoning can be analyzed." },
        { status: 400 }
      );
    }

    if (!userId && readGuestFreePassUsed(request) >= 3) {
      return NextResponse.json(
        {
          code: "auth_required",
          error: "Create a free UThynk profile to continue after 3 guest challenges.",
        },
        { status: 401 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is required for adaptive reasoning. Static fallback is disabled." },
        { status: 503 }
      );
    }

    const category = normalizeCategory(body.category, challenge);
    const categoryPrompt = categoryPromptMap[category];
    const memory = await getReasoningMemory(userId);
    const profile =
      (await loadProfile(userId)) ||
      (body.ageBand
        ? {
            age_band:
              body.ageBand === "under_13" || body.ageBand === "13_17"
                ? body.ageBand
                : "18_plus",
          }
        : null);
    const verifier = verifierEngine(response, category);
    const modeSeed = stableModeSeed({
      category,
      challenge,
      conversationId,
      memory,
      response,
      sessionId,
    });
    const mode = randomizedResponseModes[modeSeed % randomizedResponseModes.length];
    const wantsStream =
      body.stream === true || request.headers.get("accept")?.includes("text/event-stream");

    const openAiArgs = {
      apiKey,
      categoryPrompt,
      challenge,
      conversationId,
      language,
      memory,
      mode,
      phase: body.phase || "synthesis",
      profile,
      question: body.question,
      response,
      section: body.section,
      sessionId,
      stream: false,
      thinkingLens: body.thinkingLens,
      verifier,
    };

    if (wantsStream) {
      return streamingFeedback({
        ...openAiArgs,
        challengeId: body.challengeId,
        thinkingLens: body.thinkingLens,
        userId,
      });
    }

    const parsed = await nonStreamingFeedback(openAiArgs);
    const feedback = sanitizeFeedback(parsed, verifier, categoryPrompt);
    const progression =
      body.phase === "follow_up"
        ? null
        : await persistSession({
            categoryPrompt,
            challenge,
            challengeId: body.challengeId,
            conversationId,
            feedback,
            memory,
            mode,
            response,
            sessionId,
            thinkingLens: body.thinkingLens,
            userId,
          });

    return NextResponse.json({
      source: "openai",
      memory,
      mode,
      onboardingProfile: profile,
      progression,
      ...feedback,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Reasoning analysis failed. Try again with a clearer response.",
      },
      { status: 500 }
    );
  }
}

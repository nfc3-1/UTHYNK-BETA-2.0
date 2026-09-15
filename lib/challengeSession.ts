export type Language = "en" | "es" | "fr";

export type ChallengeStep = "main_question" | "secondary_question" | "final_synthesis";

export type ChallengeSessionKeyInput = {
  ageBand: string;
  category: string;
  language: Language;
  questionId?: string;
  questionIndex: number;
  userId?: string | null;
};

export type ChallengeSession = ChallengeSessionKeyInput & {
  version: 2;
  activeAnswerDraft: string;
  completed: boolean;
  conversationId: string;
  finalSynthesis: string;
  firstResponse: string;
  growthIndicators: string[];
  originalQuestion: string;
  perspectiveExpansion: string;
  secondResponse: string;
  secondaryQuestion: string;
  sessionId: string;
  step: ChallengeStep;
  updatedAt: string;
};

export type ReasoningFeedbackSnapshot = {
  analysis?: string;
  contrarian?: string;
  finalSynthesis?: string;
  followUp?: string;
  perspectiveExpansion?: string;
  score?: number;
  secondaryQuestion?: string;
  strengths?: string[];
  trait?: string;
  weaknesses?: string[];
  xp?: number;
};

function cleanPart(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "unknown";
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

export function challengeSessionKey(input: ChallengeSessionKeyInput) {
  return [
    "uthynk-challenge",
    "v2",
    cleanPart(input.userId || "guest"),
    cleanPart(input.category),
    cleanPart(input.questionId || String(input.questionIndex)),
    cleanPart(input.language),
    cleanPart(input.ageBand),
  ].join(":");
}

export function createChallengeSession(input: Omit<ChallengeSession, "activeAnswerDraft" | "completed" | "finalSynthesis" | "firstResponse" | "growthIndicators" | "perspectiveExpansion" | "secondResponse" | "secondaryQuestion" | "step" | "updatedAt" | "version">): ChallengeSession {
  return {
    version: 2,
    ...input,
    activeAnswerDraft: "",
    completed: false,
    finalSynthesis: "",
    firstResponse: "",
    growthIndicators: [],
    perspectiveExpansion: "",
    secondResponse: "",
    secondaryQuestion: "",
    step: "main_question",
    updatedAt: new Date().toISOString(),
  };
}

export function isChallengeSession(value: unknown): value is ChallengeSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<ChallengeSession>;

  return (
    session.version === 2 &&
    typeof session.category === "string" &&
    typeof session.originalQuestion === "string" &&
    typeof session.sessionId === "string" &&
    typeof session.conversationId === "string" &&
    typeof session.language === "string" &&
    typeof session.ageBand === "string" &&
    Array.isArray(session.growthIndicators) &&
    ["main_question", "secondary_question", "final_synthesis"].includes(String(session.step))
  );
}

export function restoreChallengeSession(value: unknown): ChallengeSession | null {
  if (!isChallengeSession(value)) return null;
  if (value.completed || value.step === "final_synthesis") {
    return {
      ...value,
      activeAnswerDraft: "",
      completed: true,
      step: "final_synthesis",
    };
  }

  return value;
}

export function captureAnswerDraft(session: ChallengeSession | null, draft: string) {
  return session ? { ...session, activeAnswerDraft: draft, updatedAt: new Date().toISOString() } : null;
}

function mergeGrowthIndicators(feedback: ReasoningFeedbackSnapshot, existing: string[] = []) {
  return Array.from(
    new Set(
      [
        ...existing,
        feedback.trait,
        ...(feedback.strengths || []),
        ...(feedback.weaknesses || []),
        typeof feedback.score === "number" ? `Score ${Math.round(feedback.score)}` : "",
        typeof feedback.xp === "number" ? `XP +${Math.round(feedback.xp)}` : "",
      ].filter(Boolean) as string[]
    )
  ).slice(0, 8);
}

export function applyPerspectiveExpansion(
  session: ChallengeSession,
  firstResponse: string,
  feedback: ReasoningFeedbackSnapshot
): ChallengeSession {
  const perspectiveExpansion = cleanText(
    feedback.perspectiveExpansion || feedback.contrarian || feedback.analysis
  );
  const secondaryQuestion = cleanText(feedback.secondaryQuestion || feedback.followUp);

  if (!perspectiveExpansion || !secondaryQuestion) {
    throw new Error("Perspective expansion and one secondary question are required.");
  }

  return {
    ...session,
    activeAnswerDraft: "",
    firstResponse: cleanText(firstResponse),
    growthIndicators: mergeGrowthIndicators(feedback, session.growthIndicators),
    perspectiveExpansion,
    secondaryQuestion,
    step: "secondary_question",
    updatedAt: new Date().toISOString(),
  };
}

export function applyFinalSynthesis(
  session: ChallengeSession,
  secondResponse: string,
  feedback: ReasoningFeedbackSnapshot
): ChallengeSession {
  const finalSynthesis = cleanText(feedback.finalSynthesis || feedback.analysis);

  if (!finalSynthesis || finalSynthesis === session.perspectiveExpansion) {
    throw new Error("Final synthesis must be distinct from the perspective expansion.");
  }

  return {
    ...session,
    activeAnswerDraft: "",
    completed: true,
    finalSynthesis,
    growthIndicators: mergeGrowthIndicators(feedback, session.growthIndicators),
    secondResponse: cleanText(secondResponse),
    step: "final_synthesis",
    updatedAt: new Date().toISOString(),
  };
}

export function canSubmitChallengeAnswer(session: ChallengeSession | null, answer: string, loading: boolean) {
  return !loading && (!session || !session.completed) && Boolean(cleanText(answer));
}

export function shouldRenderAnswerInput(session: ChallengeSession | null) {
  return !session?.completed && session?.step !== "final_synthesis";
}

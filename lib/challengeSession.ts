import type { Language } from "@/lib/reasoningI18n";

export type ChallengeStep = "main_question" | "perspective_expansion" | "secondary_question" | "final_synthesis";

export type ChallengeSession = {
  version: 1;
  category: string;
  questionIndex: number;
  language: Language;
  ageBand: string;
  originalQuestion: string;
  firstResponse: string;
  perspectiveExpansion: string;
  secondaryQuestion: string;
  secondResponse: string;
  finalSynthesis: string;
  completed: boolean;
  growthIndicators: string[];
  sessionId: string;
  conversationId: string;
  step: ChallengeStep;
};

export function challengeSessionKey(category: string, questionIndex: number, language: Language) {
  return `uthynk-challenge:v1:${category}:${questionIndex}:${language}`;
}

export function createChallengeSession(input: Pick<ChallengeSession, "category" | "questionIndex" | "language" | "ageBand" | "originalQuestion" | "sessionId" | "conversationId">): ChallengeSession {
  return {
    version: 1,
    ...input,
    firstResponse: "",
    perspectiveExpansion: "",
    secondaryQuestion: "",
    secondResponse: "",
    finalSynthesis: "",
    completed: false,
    growthIndicators: [],
    step: "main_question",
  };
}

export function isChallengeSession(value: unknown): value is ChallengeSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<ChallengeSession>;
  return session.version === 1 && typeof session.originalQuestion === "string" &&
    typeof session.sessionId === "string" && typeof session.conversationId === "string" &&
    ["main_question", "perspective_expansion", "secondary_question", "final_synthesis"].includes(String(session.step));
}

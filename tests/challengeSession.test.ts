import { describe, expect, it } from "vitest";
import {
  applyFinalSynthesis,
  applyPerspectiveExpansion,
  canSubmitChallengeAnswer,
  captureAnswerDraft,
  challengeSessionKey,
  createChallengeSession,
  restoreChallengeSession,
  shouldRenderAnswerInput,
} from "../lib/challengeSession";
import { localizeQuestion } from "../lib/reasoningI18n";

function baseSession() {
  return createChallengeSession({
    ageBand: "13_17",
    category: "Science & Evidence",
    conversationId: "conversation-1",
    language: "en",
    originalQuestion: "Does correlation prove causation?",
    questionId: "science-evidence-01",
    questionIndex: 0,
    sessionId: "session-1",
    userId: "user-1",
  });
}

describe("finite challenge session", () => {
  it("uses the exact state transitions through completion", () => {
    const first = applyPerspectiveExpansion(baseSession(), "It suggests a link.", {
      contrarian: "Have you considered sample size, controls, and incentives?",
      followUp: "What evidence would separate correlation from causation?",
      score: 74,
      strengths: ["Evidence"],
      xp: 52,
    });
    const complete = applyFinalSynthesis(first, "A controlled study would help.", {
      analysis:
        "Your thinking developed from spotting a link to naming a better test. Your strongest reasoning was asking for controls. A remaining blind spot is who collected the data. The practical takeaway is to test causation before acting.",
      followUp: "",
      score: 82,
      xp: 60,
    });

    expect(first.step).toBe("secondary_question");
    expect(first.perspectiveExpansion).toContain("Have you considered");
    expect(first.secondaryQuestion).toContain("?");
    expect(complete.step).toBe("final_synthesis");
    expect(complete.completed).toBe(true);
    expect(shouldRenderAnswerInput(complete)).toBe(false);
  });

  it("advances after a first submission with canonical API fields and no final synthesis", () => {
    const firstAnswer =
      "I would look at whether the new role builds skills, pays enough, and gives me a better long-term path.";
    const first = applyPerspectiveExpansion(baseSession(), firstAnswer, {
      finalSynthesis: "",
      perspectiveExpansion:
        "Have you considered the switching cost, the incentives behind the offer, and whether the current frustration is temporary? Another angle is whether the new path compounds into better options or only feels like escape.",
      score: 76,
      secondaryQuestion:
        "What evidence would show that changing careers is a strategic move rather than just a reaction to frustration?",
      strengths: ["Tradeoff Thinking"],
      xp: 52,
    });

    expect(first.step).toBe("secondary_question");
    expect(first.firstResponse).toBe(firstAnswer);
    expect(first.activeAnswerDraft).toBe("");
    expect(first.perspectiveExpansion).toContain("Have you considered");
    expect(first.secondaryQuestion).toContain("changing careers");
    expect(first.finalSynthesis).toBe("");
    expect(shouldRenderAnswerInput(first)).toBe(true);
  });

  it("restores completed sessions without reopening a fifth question", () => {
    const complete = applyFinalSynthesis(
      applyPerspectiveExpansion(baseSession(), "First answer", {
        contrarian: "Another angle is who benefits.",
        followUp: "What would change your mind?",
      }),
      "Second answer",
      {
        analysis:
          "Your second answer improved the first by naming the decision test. The blind spot is timing. The takeaway is to decide what evidence matters before pressure rises.",
      }
    );

    expect(restoreChallengeSession(JSON.parse(JSON.stringify(complete)))?.step).toBe("final_synthesis");
    expect(restoreChallengeSession(JSON.parse(JSON.stringify(complete)))?.activeAnswerDraft).toBe("");
    expect(shouldRenderAnswerInput(complete)).toBe(false);
  });

  it("isolates saved sessions by category, question, language, age band, and user", () => {
    const base = {
      ageBand: "13_17",
      category: "Science & Evidence",
      language: "fr" as const,
      questionId: "science-evidence-01",
      questionIndex: 0,
      userId: "user-1",
    };

    expect(challengeSessionKey(base) === challengeSessionKey({ ...base, language: "en" })).toBe(false);
    expect(challengeSessionKey(base) === challengeSessionKey({ ...base, ageBand: "18_plus" })).toBe(false);
    expect(challengeSessionKey(base) === challengeSessionKey({ ...base, userId: "user-2" })).toBe(false);
    expect(
      challengeSessionKey(base) ===
        challengeSessionKey({ ...base, questionId: "science-evidence-02", questionIndex: 1 })
    ).toBe(false);
  });

  it("preserves voice or typed answer drafts across request failure", () => {
    const withDraft = captureAnswerDraft(baseSession(), "voice transcript answer");

    expect(withDraft?.activeAnswerDraft).toBe("voice transcript answer");
    expect(canSubmitChallengeAnswer(withDraft, withDraft?.activeAnswerDraft || "", false)).toBe(true);
  });

  it("prevents duplicate submissions while a request is running", () => {
    expect(canSubmitChallengeAnswer(baseSession(), "ready", true)).toBe(false);
    expect(canSubmitChallengeAnswer(baseSession(), "", false)).toBe(false);
  });

  it("does not reuse perspective text as final synthesis", () => {
    const first = applyPerspectiveExpansion(baseSession(), "First answer", {
      contrarian: "Have you considered incentives?",
      followUp: "What evidence would change your mind?",
    });

    expect(() =>
      applyFinalSynthesis(first, "Second answer", {
        finalSynthesis: "Have you considered incentives?",
      })
    ).toThrow(/distinct/);
  });

  it("preserves distinct untranslated question content", () => {
    expect(localizeQuestion("Epistemology", 0, "How do you know the source is reliable?", "es")).toBe(
      "How do you know the source is reliable?"
    );
    expect(localizeQuestion("Epistemology", 1, "What evidence would change your mind?", "es")).toBe(
      "What evidence would change your mind?"
    );
  });
});

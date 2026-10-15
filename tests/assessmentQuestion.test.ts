import { describe, expect, it } from "vitest";
import { assessmentQuestion } from "../lib/assessmentQuestion";
import { challenges } from "../lib/challenges";
import { lessonQuestions } from "../lib/lessonQuestions";
import { adaptChallengeForAge } from "../lib/ageAdaptivePrompts";
describe("canonical assessment question", () => {
  it("scores the same daily task despite a translated display question", () => {
    const task = challenges[0];
    for (const challenge of [
      "English display",
      "Pregunta en español",
      "Question en français",
    ])
      expect(
        assessmentQuestion({ challengeId: task.id, challenge }, "13_17"),
      ).toBe(adaptChallengeForAge(task, "13_17").prompt);
  });
  it("uses the stable original lesson instead of its display translation", () => {
    const q = lessonQuestions[0];
    expect(
      assessmentQuestion(
        { questionId: q.id, challenge: "Translated display" },
        "18_plus",
      ),
    ).toBe(q.source);
  });
});

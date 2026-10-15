import { challenges } from "@/lib/challenges";
import { getLessonQuestionById } from "@/lib/lessonQuestions";
import { adaptChallengeForAge } from "@/lib/ageAdaptivePrompts";
export function assessmentQuestion(
  input: {
    questionId?: string;
    challengeId?: string;
    originalQuestion?: string;
    challenge?: string;
  },
  ageBand: string,
) {
  const lesson = input.questionId
    ? getLessonQuestionById(input.questionId)
    : undefined;
  if (lesson) return lesson.source;
  const daily = challenges.find((c) => c.id === input.challengeId);
  return daily
    ? adaptChallengeForAge(daily, ageBand).prompt
    : input.originalQuestion || input.challenge || "Daily reasoning challenge";
}

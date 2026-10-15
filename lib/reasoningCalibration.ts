import fixture from "@/data/reasoningCalibration.json";
import { assessReasoning } from "@/lib/assessReasoning";
import { criterionIds, type PointAssessment } from "@/lib/pointRubric";
const languages = ["en", "es", "fr"] as const;
export type CalibrationResult = {
  language: string;
  phase: string;
  assessment?: PointAssessment;
  error?: string;
};
export function calibrationParity(results: CalibrationResult[]) {
  return ["first", "final"].every((phase) => {
    const rows = languages.map((language) =>
      results.find((r) => r.language === language && r.phase === phase),
    );
    if (rows.some((r) => !r?.assessment || r.error)) return false;
    return criterionIds.every((id) => {
      const points = rows.map(
        (r) => r!.assessment!.criteria.find((c) => c.id === id)?.points,
      );
      return points.every((p) => p !== undefined && p === points[0]);
    });
  });
}
export async function runReasoningCalibration(apiKey: string) {
  const results = await Promise.all(
    languages.flatMap((language) =>
      ["first", "final"].map(async (phase) => {
        try {
          const assessment = await assessReasoning({
            question: fixture.question,
            answers: fixture.answers[language].slice(
              0,
              phase === "first" ? 1 : 2,
            ),
            apiKey,
            freshCalibration: true,
          });
          return { language, phase, assessment };
        } catch (e) {
          return {
            language,
            phase,
            error: e instanceof Error ? e.message : "Evaluation failed.",
          };
        }
      }),
    ),
  );
  return {
    fixtureId: fixture.id,
    checkedAt: new Date().toISOString(),
    passed: calibrationParity(results),
    results,
    limitation:
      "Matched-fixture parity only; this does not establish universal language fairness or educational validity.",
  };
}

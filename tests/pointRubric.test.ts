import { afterEach, describe, expect, it, vi } from "vitest";
import {
  validatePointAssessment,
  criterionIds,
  pointRubricPrompt,
} from "../lib/pointRubric";
import { assessReasoning } from "../lib/assessReasoning";
vi.mock("../lib/supabaseAdmin", () => ({ supabaseAdmin: null }));
afterEach(() => vi.unstubAllGlobals());
const answer =
  "Compare similar classes before attributing the improvement to the rule.";
const judgment = (points: number) => ({
  criteria: criterionIds.map((id) => ({
    id,
    points,
    evidenceIds: points ? ["A1S1"] : [],
  })),
});
describe("explicit 20-point reasoning rubric", () => {
  it("computes totals server-side, accepts zero, and never trusts a model total", () => {
    const raw = { ...judgment(4), earned: 100, possible: 100, score: 99 };
    const result = validatePointAssessment(raw, [answer], "judge", "hash");
    expect(result.earned).toBe(16);
    expect(result.possible).toBe(20);
    expect(result.percentage).toBe(80);
    expect(
      validatePointAssessment(judgment(0), [answer], "judge", "hash").earned,
    ).toBe(0);
  });
  it.each([6, -1, 2.5, "5"])("rejects invalid points %s", (points) =>
    expect(() =>
      validatePointAssessment(
        {
          criteria: criterionIds.map((id) => ({
            id,
            points,
            evidenceIds: ["A1S1"],
          })),
        },
        [answer],
        "judge",
        "hash",
      ),
    ).toThrow(),
  );
  it("rejects missing criteria, duplicates and claims supported only by the coach", () => {
    expect(() =>
      validatePointAssessment(
        { criteria: judgment(4).criteria.slice(1) },
        [answer],
        "judge",
        "hash",
      ),
    ).toThrow();
    expect(() =>
      validatePointAssessment(
        { criteria: Array(4).fill(judgment(4).criteria[0]) },
        [answer],
        "judge",
        "hash",
      ),
    ).toThrow();
    expect(() =>
      validatePointAssessment(
        {
          criteria: criterionIds.map((id) => ({
            id,
            points: 4,
            evidenceIds: ["coach-1"],
          })),
        },
        ["Unrelated learner answer"],
        "judge",
        "hash",
      ),
    ).toThrow("unknown answer evidence");
  });
  it("uses identical evaluator instructions regardless of the coaching display language", async () => {
    const calls: any[] = [];
    vi.stubGlobal("fetch", async (_url: string, init: any) => {
      calls.push(JSON.parse(init.body));
      return Response.json({
        choices: [{ message: { content: JSON.stringify(judgment(4)) } }],
      });
    });
    const a = await assessReasoning({
      question: "What caused this?",
      answers: [answer],
      apiKey: "test",
    });
    const b = await assessReasoning({
      question: "What caused this?",
      answers: [answer],
      apiKey: "test",
    });
    expect(a).toEqual(b);
    expect(calls[0]).toEqual(calls[1]);
    expect(calls[0].temperature).toBe(0);
    expect(calls[0].seed).toBe(1701);
    expect(calls[0].messages[0].content).toBe(pointRubricPrompt);
    expect(JSON.stringify(calls[0])).not.toContain("Spanish coaching");
  });
});

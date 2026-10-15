import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  calibrationParity,
  runReasoningCalibration,
  type CalibrationResult,
} from "../lib/reasoningCalibration";
import { POST } from "../app/api/admin/calibration/route";
import { criterionIds, type PointAssessment } from "../lib/pointRubric";
const state = vi.hoisted(() => ({
  role: "admin",
  userId: "admin",
  grade: vi.fn(),
  insert: vi.fn(),
}));
vi.mock("../lib/assessReasoning", () => ({
  assessReasoning: (...a: unknown[]) => state.grade(...a),
}));
vi.mock("../lib/accessControl", () => ({
  getAccountAccess: async () => ({ role: state.role, userId: state.userId }),
  permits: (a: any, section: string) => a.userId && a.role === section,
}));
vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({
      insert: (value: unknown) => {
        state.insert(value);
        return {
          select: () => ({
            single: async () => ({ data: { id: "run-id" }, error: null }),
          }),
        };
      },
    }),
  },
}));
function grade(points = [3, 4, 3, 4]): PointAssessment {
  const earned = points.reduce((a, b) => a + b, 0);
  return {
    status: "provisional",
    rubricVersion: "reasoning-20-v1",
    scoreSource: "rubric",
    earned,
    possible: 20,
    percentage: earned * 5,
    model: "test-model",
    fingerprint: "fixture",
    criteria: criterionIds.map((id, i) => ({
      id,
      points: points[i],
      possible: 5,
      evidence: ["Actual fixture evidence"],
    })),
  };
}
function rows(): CalibrationResult[] {
  return ["en", "es", "fr"].flatMap((language) =>
    ["first", "final"].map((phase) => ({
      language,
      phase,
      assessment: grade(),
    })),
  );
}
beforeEach(() => {
  state.role = "admin";
  state.userId = "admin";
  state.grade.mockReset().mockResolvedValue(grade());
  state.insert.mockClear();
  process.env.OPENAI_API_KEY = "test-only";
});
describe("multilingual calibration release gate", () => {
  it("detects point differences even when total percentages are identical", () => {
    const r = rows();
    r[2].assessment = grade([4, 3, 3, 4]);
    expect(r[2].assessment!.earned).toBe(r[0].assessment!.earned);
    expect(calibrationParity(r)).toBe(false);
  });
  it("fails incomplete or errored evaluations and requires parity in both phases", () => {
    expect(calibrationParity(rows())).toBe(true);
    expect(calibrationParity(rows().slice(1))).toBe(false);
    const r = rows();
    r[5] = { language: "fr", phase: "final", error: "Provider unavailable" };
    expect(calibrationParity(r)).toBe(false);
  });
  it("runs six fresh authored-fixture evaluations, without learner identities or progression", async () => {
    const report = await runReasoningCalibration("test-only");
    expect(report.passed).toBe(true);
    expect(state.grade).toHaveBeenCalledTimes(6);
    expect(
      state.grade.mock.calls.every(
        ([input]) => input.freshCalibration && !input.userId,
      ),
    ).toBe(true);
    expect(state.grade.mock.calls.map(([i]) => i.answers.length)).toEqual([
      1, 2, 1, 2, 1, 2,
    ]);
    state.grade.mockRejectedValueOnce(new Error("Unavailable"));
    expect((await runReasoningCalibration("test-only")).passed).toBe(false);
  });
  it("requires same-origin platform authorization, never school or district roles", async () => {
    const req = (origin = "http://localhost") =>
      new Request("http://localhost/api/admin/calibration", {
        method: "POST",
        headers: { origin },
      });
    expect((await POST(req("https://other.example"))).status).toBe(403);
    state.role = "teacher";
    expect((await POST(req())).status).toBe(403);
    state.userId = "";
    expect((await POST(req())).status).toBe(401);
    expect(state.grade).not.toHaveBeenCalled();
    state.role = "admin";
    state.userId = "admin";
    expect((await POST(req())).status).toBe(200);
    expect(state.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: "admin",
        report: expect.objectContaining({ passed: true }),
      }),
    );
    expect((await POST(req())).status).toBe(429);
  });
});

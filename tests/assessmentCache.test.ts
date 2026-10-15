import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assessReasoning } from "../lib/assessReasoning";
const cache = vi.hoisted(() => new Map<string, any>());
vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from() {
      let key = "";
      return {
        select() {
          return this;
        },
        eq(_k: string, value: string) {
          key = value;
          return this;
        },
        maybeSingle: async () => ({
          data: cache.get(key) || null,
          error: null,
        }),
        single: async () => ({ data: cache.get(key), error: null }),
        upsert: async (value: any) => {
          if (!cache.has(value.fingerprint))
            cache.set(value.fingerprint, { assessment: value.assessment });
          return { error: null };
        },
      };
    },
  },
}));
beforeEach(() => cache.clear());
afterEach(() => vi.unstubAllGlobals());
describe("saved assessment identity", () => {
  it("reuses the saved points for the same answers regardless of display language, and isolates learners", async () => {
    const answer = "Compare similar classes over the same period.";
    const fetch = vi.fn(async () =>
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                criteria: [
                  "claim",
                  "evidence",
                  "alternatives",
                  "conclusion",
                ].map((id) => ({ id, points: 3, evidenceIds: ["A1S1"] })),
              }),
            },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetch);
    const request = {
      question: "What changed attendance?",
      answers: [answer],
      apiKey: "test",
      userId: "learner-a",
    };
    const english = await assessReasoning({
      ...request,
      displayLanguage: "en",
    } as any);
    const french = await assessReasoning({
      ...request,
      displayLanguage: "fr",
    } as any);
    expect(english).toEqual(french);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(english.earned).toBe(12);
    await assessReasoning({ ...request, userId: "learner-b" });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(cache.size).toBe(2);
  });
});

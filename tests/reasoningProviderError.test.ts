import { describe, expect, it, vi } from "vitest";
import { reasoningProviderError } from "../lib/reasoningProviderError";

describe("reasoning provider failures", () => {
  it("logs only allowlisted diagnostics and redacts secrets and user text", async () => {
    const previous = console.error;
    let captured = "";
    console.error = (value: string) => { captured = value; };
    vi.stubEnv("OPENAI_API_KEY", "test-private-credential");
    try {
      const result = await reasoningProviderError(Response.json({
        error: {
          type: "tokens", code: "rate_limit_exceeded",
          message: "Limit reached: test-private-credential sk-proj-example user@example.com org-private My private answer",
          privateField: "must-not-log",
        },
        request: "must-not-log",
      }, { status: 429, headers: {
        "x-request-id": "req-test-123",
        "x-ratelimit-limit-tokens": "10000",
        "x-ratelimit-remaining-tokens": "0",
        "x-ratelimit-reset-tokens": "2s",
        authorization: "Bearer must-not-log",
        "set-cookie": "must-not-log",
      } }), "synthesis", ["My private answer"]);
      expect(result.message).toContain("retry shortly");
      expect(JSON.parse(captured)).toMatchObject({
        status: 429, phase: "synthesis", "x-request-id": "req-test-123",
        error: { type: "tokens", code: "rate_limit_exceeded" },
        rateLimitHeaders: { "x-ratelimit-limit-tokens": "10000", "x-ratelimit-remaining-tokens": "0", "x-ratelimit-reset-tokens": "2s" },
      });
      expect(Object.keys(JSON.parse(captured)).sort().join(",")).toBe("error,phase,rateLimitHeaders,status,x-request-id");
      for (const secret of ["test-private-credential", "sk-proj-example", "user@example.com", "org-private", "My private answer", "must-not-log"]) {
        expect(captured.includes(secret)).toBe(false);
      }
    } finally { console.error = previous; vi.unstubAllEnvs(); }
  });
  it("handles non-JSON provider errors without logging response bodies", async () => {
    const previous = console.error;
    let captured = "";
    console.error = (value: string) => { captured = value; };
    try {
      await reasoningProviderError(new Response("private proxy response", { status: 502 }), "follow_up");
      expect(JSON.parse(captured)).toMatchObject({ status: 502, phase: "follow_up", error: { type: null, code: null, message: null }, "x-request-id": null, rateLimitHeaders: {} });
      expect(captured.includes("private proxy response")).toBe(false);
    } finally { console.error = previous; }
  });
  it("distinguishes exhausted quota from recoverable rate limits", async () => {
    const quota = await reasoningProviderError(Response.json({ error: { code: "insufficient_quota" } }, { status: 429 }));
    const busy = await reasoningProviderError(Response.json({ error: { code: "rate_limit_exceeded" } }, { status: 429 }));
    expect(quota.message).toContain("exhausted its AI quota");
    expect(busy.message).toContain("retry shortly");
  });
  it("reports rejected credentials without forwarding sensitive provider details", async () => {
    const error = await reasoningProviderError(Response.json({ error: { message: "API key: secret-value" } }, { status: 401 }));
    expect(error.message.includes("secret-value")).toBe(false);
    expect(error.message).toContain("API key was rejected");
  });
});

import { describe, expect, it } from "vitest";
import { reasoningProviderError } from "../lib/reasoningProviderError";

describe("reasoning provider failures", () => {
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

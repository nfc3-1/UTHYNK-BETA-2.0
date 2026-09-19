// Do not forward provider messages: they can include credentials or request data.
export async function reasoningProviderError(
  response: Response,
  phase: "follow_up" | "synthesis" = "follow_up",
  sensitiveValues: string[] = []
) {
  const payload = await response.json().catch(() => ({}));
  const code = payload?.error?.code;
  // Temporary incident diagnostics. Never log the payload, request, or headers wholesale.
  const redact = (value: unknown) => {
    if (typeof value !== "string") return null;
    let safe = value;
    for (const secret of [process.env.OPENAI_API_KEY, ...sensitiveValues].filter(Boolean) as string[]) {
      safe = safe.split(secret).join("[REDACTED]");
    }
    return safe
      .replace(/\bsk-[\w*-]+/gi, "[REDACTED_KEY]")
      .replace(/\bBearer\s+\S+/gi, "Bearer [REDACTED]")
      .replace(/\b(api[_ -]?key|authorization|password|secret)\s*[:=]\s*\S+/gi, "$1: [REDACTED]")
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
      .replace(/\b(?:org|proj)[-_][\w-]+/gi, "[REDACTED_ACCOUNT]")
      .slice(0, 2000);
  };
  const rateLimitHeaders: Record<string, string | null> = {};
  for (const name of [
    "x-ratelimit-limit-requests", "x-ratelimit-limit-tokens",
    "x-ratelimit-remaining-requests", "x-ratelimit-remaining-tokens",
    "x-ratelimit-reset-requests", "x-ratelimit-reset-tokens",
  ]) {
    if (response.headers.has(name)) rateLimitHeaders[name] = redact(response.headers.get(name));
  }
  console.error(JSON.stringify({
    status: response.status,
    error: { type: redact(payload?.error?.type), code: redact(code), message: redact(payload?.error?.message) },
    "x-request-id": redact(response.headers.get("x-request-id")),
    rateLimitHeaders,
    phase,
  }));
  if (response.status === 401) return new Error("Reasoning is unavailable because the service API key was rejected. Please contact UThynk support; your answer is saved.");
  if (code === "insufficient_quota") return new Error("Reasoning is unavailable because the service has exhausted its AI quota. Please contact UThynk support; your answer is saved.");
  if (response.status === 429) return new Error("Reasoning is temporarily busy. Your answer is saved; please retry shortly.");
  if (code === "model_not_found" || response.status === 403) return new Error("The configured reasoning model is unavailable to the service. Please contact UThynk support; your answer is saved.");
  return new Error(`The reasoning provider could not complete the request (HTTP ${response.status}). Your answer is saved; please try again.`);
}

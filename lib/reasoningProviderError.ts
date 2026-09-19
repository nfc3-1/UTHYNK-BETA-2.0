// Do not forward provider messages: they can include credentials or request data.
export async function reasoningProviderError(response: Response) {
  const payload = await response.json().catch(() => ({}));
  const code = payload?.error?.code;
  if (response.status === 401) return new Error("Reasoning is unavailable because the service API key was rejected. Please contact UThynk support; your answer is saved.");
  if (code === "insufficient_quota") return new Error("Reasoning is unavailable because the service has exhausted its AI quota. Please contact UThynk support; your answer is saved.");
  if (response.status === 429) return new Error("Reasoning is temporarily busy. Your answer is saved; please retry shortly.");
  if (code === "model_not_found" || response.status === 403) return new Error("The configured reasoning model is unavailable to the service. Please contact UThynk support; your answer is saved.");
  return new Error(`The reasoning provider could not complete the request (HTTP ${response.status}). Your answer is saved; please try again.`);
}

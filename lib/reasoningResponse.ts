import type { ReasoningFeedbackSnapshot } from "./challengeSession";

export function normalizeReasoningFeedback(value: ReasoningFeedbackSnapshot, phase: "follow_up" | "synthesis") {
  const perspective = value.perspectiveExpansion || value.contrarian || value.analysis || "";
  const question = value.secondaryQuestion || value.followUp || "";
  const synthesis = value.finalSynthesis || value.analysis || "";
  if (phase === "follow_up" ? !perspective.trim() || !question.trim() : !synthesis.trim()) {
    throw new Error("The response was incomplete. Your answer is saved; please try again.");
  }
  return {
    ...value,
    analysis: phase === "synthesis" ? synthesis : value.analysis || perspective,
    contrarian: perspective,
    followUp: phase === "synthesis" ? "" : question,
    strengths: value.strengths || [],
    weaknesses: value.weaknesses || [],
  };
}

// JSON and SSE are both valid API transports. A final event is a transport
// envelope, not a requirement for final synthesis on the first turn.
export async function readReasoningResponse(response: Response, onToken: (text: string) => void) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Unable to connect. Your answer is saved; please try again.");
  }
  if (!response.headers.get("content-type")?.includes("text/event-stream")) return response.json();
  if (!response.body) throw new Error("No response received. Your answer is saved; please try again.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: any = null;
  let failure = "";
  const consume = (event: string) => {
    const lines = event.split("\n");
    const type = lines.find(line => line.startsWith("event:"))?.slice(6).trim();
    const data = lines.filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("\n");
    if (!data || data === "[DONE]") return;
    const payload = JSON.parse(data);
    if (type === "error") failure = payload.error || "Reasoning request failed. Please try again.";
    else if (type === "token") onToken(payload.token || "");
    else if (type === "final" || payload.perspectiveExpansion || payload.secondaryQuestion || payload.finalSynthesis || payload.followUp) result = { ...result, ...payload };
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      buffer = buffer.replace(/\r\n/g, "\n");
      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        consume(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
      }
      if (done) break;
    }
    if (buffer.trim()) consume(buffer);
  } finally { reader.releaseLock(); }
  if (failure) throw new Error(failure);
  if (!result) throw new Error("The connection ended before a response arrived. Your answer is saved; please try again.");
  return result;
}

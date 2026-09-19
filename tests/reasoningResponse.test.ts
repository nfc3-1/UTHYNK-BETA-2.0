import { describe, expect, it } from "vitest";
import { normalizeReasoningFeedback, readReasoningResponse } from "../lib/reasoningResponse";

describe("reasoning transport", () => {
  it("accepts canonical first-turn JSON without synthesis", async () => {
    const payload = { perspectiveExpansion: "Consider incentives.", secondaryQuestion: "Who benefits?" };
    const data = await readReasoningResponse(Response.json(payload), () => {});
    expect(normalizeReasoningFeedback(data, "follow_up").followUp).toBe("Who benefits?");
  });
  it("reads CRLF, split chunks and an unterminated final event", async () => {
    const text = 'event: token\r\ndata: {"token":"Hello"}\r\n\r\nevent: final\r\ndata: {"finalSynthesis":"Takeaway."}';
    const stream = new ReadableStream({ start(controller) {
      for (const character of text) controller.enqueue(new TextEncoder().encode(character));
      controller.close();
    } });
    let tokens = "";
    const data = await readReasoningResponse(new Response(stream, { headers: { "content-type": "text/event-stream" } }), value => { tokens += value; });
    expect(tokens).toBe("Hello");
    expect(normalizeReasoningFeedback(data, "synthesis").analysis).toBe("Takeaway.");
  });
  it("preserves stream errors instead of replacing them with missing final feedback", async () => {
    let message = "";
    try { await readReasoningResponse(new Response('event: error\ndata: {"error":"Service unavailable"}\n\n', { headers: { "content-type": "text/event-stream" } }), () => {}); }
    catch (error) { message = (error as Error).message; }
    expect(message).toBe("Service unavailable");
  });
  it("normalizes legacy fields and excludes another question from synthesis", () => {
    expect(normalizeReasoningFeedback({ contrarian: "Perspective", followUp: "Question?" }, "follow_up").followUp).toBe("Question?");
    expect(normalizeReasoningFeedback({ analysis: "Closing feedback.", followUp: "Fifth question?" }, "synthesis").followUp).toBe("");
  });
});

export function mockThinkingFeedback(userText: string, prompt: string) {
  const trimmed = (userText || '').trim();
  const summary = trimmed
    ? `Here’s how I understand your thinking: you’re saying "${trimmed.slice(0, 140)}${trimmed.length > 140 ? '…' : ''}"`
    : `Here’s how I understand your thinking: you haven’t written much yet, so I’ll respond to the prompt itself.`;

  return {
    understanding: summary,
    assumption: "One assumption worth examining: the feeling of certainty is the same as having good evidence.",
    reframe: "Another way to frame this: separate (1) what you observed, (2) what you inferred, and (3) what you value.",
    question: "What would change your mind—specifically—and how would you notice it happened?"
  };
}

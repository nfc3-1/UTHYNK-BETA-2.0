export type StreamChunk = {
  id: string;
  content: string;
  createdAt: string;
};

export async function* streamReasoning(
  messages: string[]
): AsyncGenerator<StreamChunk> {
  for (const message of messages) {
    await new Promise((resolve) => setTimeout(resolve, 50));

    yield {
      id: crypto.randomUUID(),
      content: message,
      createdAt: new Date().toISOString(),
    };
  }
}

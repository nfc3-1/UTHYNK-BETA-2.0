export type ConversationMessage = {
  role: 'user' | 'coach';
  content: string;
  createdAt: string;
};

const memory: Record<string, ConversationMessage[]> = {};

export function getConversationHistory(userId: string) {
  return memory[userId] || [];
}

export function saveConversationMessage(
  userId: string,
  message: ConversationMessage
) {
  const existing = memory[userId] || [];

  memory[userId] = [...existing, message].slice(-30);

  return memory[userId];
}

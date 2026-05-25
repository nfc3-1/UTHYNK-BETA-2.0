export type ConversationTurn = {
  id: string;
  role: 'user' | 'coach';
  content: string;
  createdAt: string;
};

export function getNextDifficulty(
  current: 'starter' | 'intermediate' | 'advanced',
  score: number
) {
  if (score >= 85 && current === 'starter') return 'intermediate';
  if (score >= 85 && current === 'intermediate') return 'advanced';
  if (score < 60 && current === 'advanced') return 'intermediate';
  if (score < 55 && current === 'intermediate') return 'starter';
  return current;
}

export function buildFollowUpPrompt(followUp: string, previousPrompt: string) {
  return followUp?.trim() || previousPrompt;
}

export function createConversationTurn(
  role: 'user' | 'coach',
  content: string
): ConversationTurn {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

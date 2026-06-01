export type ConversationTurn = {
  id: string;
  role: 'user' | 'coach';
  content: string;
  createdAt: string;
};

export function getNextDifficulty(
  current: 'everyday' | 'practical' | 'critical' | 'strategic',
  score: number
) {
  if (score >= 88 && current === 'critical') return 'strategic';
  if (score >= 76 && current === 'practical') return 'critical';
  if (score >= 62 && current === 'everyday') return 'practical';
  if (score < 55 && current === 'strategic') return 'critical';
  if (score < 50 && current === 'critical') return 'practical';
  if (score < 45 && current === 'practical') return 'everyday';
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

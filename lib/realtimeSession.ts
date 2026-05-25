export type LiveSessionState = {
  userId: string;
  activeChallengeId: string;
  reasoningScore: number;
  evolvingTrait: string;
  updatedAt: string;
};

const realtimeState = new Map<string, LiveSessionState>();

export function updateRealtimeSession(state: LiveSessionState) {
  realtimeState.set(state.userId, state);
  return state;
}

export function getRealtimeSession(userId: string) {
  return realtimeState.get(userId);
}

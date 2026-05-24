export type CollaborationEvent = {
  cohortId: string;
  userId: string;
  type: 'joined' | 'message' | 'reasoning_update';
  payload: Record<string, unknown>;
  createdAt: string;
};

type Listener = (event: CollaborationEvent) => void;

const listeners: Listener[] = [];

export function subscribe(listener: Listener) {
  listeners.push(listener);

  return () => {
    const index = listeners.indexOf(listener);

    if (index >= 0) {
      listeners.splice(index, 1);
    }
  };
}

export function broadcast(event: CollaborationEvent) {
  listeners.forEach((listener) => listener(event));
}

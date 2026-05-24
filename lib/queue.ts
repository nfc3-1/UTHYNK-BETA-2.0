export type AIQueueJob = {
  id: string;
  type: 'reasoning' | 'memory-index' | 'telemetry';
  payload: Record<string, unknown>;
  createdAt: string;
};

const inMemoryQueue: AIQueueJob[] = [];

export function enqueueJob(job: AIQueueJob) {
  inMemoryQueue.push(job);
  return job.id;
}

export function dequeueJob() {
  return inMemoryQueue.shift() || null;
}

export function queueSize() {
  return inMemoryQueue.length;
}

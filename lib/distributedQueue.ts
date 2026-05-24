export type DistributedJob = {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export interface DistributedQueueProvider {
  publish(job: DistributedJob): Promise<void>;
  consume(topic: string): Promise<DistributedJob | null>;
}

class LocalQueueProvider implements DistributedQueueProvider {
  private jobs: DistributedJob[] = [];

  async publish(job: DistributedJob) {
    this.jobs.push(job);
  }

  async consume(topic: string) {
    const index = this.jobs.findIndex((job) => job.topic === topic);

    if (index < 0) {
      return null;
    }

    const [job] = this.jobs.splice(index, 1);
    return job;
  }
}

export const distributedQueue: DistributedQueueProvider =
  new LocalQueueProvider();

import type { StudioStatus } from '@/features/studio/types/studio';

type TransitionContext = {
  approved: boolean;
};

const allowedTransitions: Record<StudioStatus, StudioStatus[]> = {
  draft: ['review'],
  review: ['approved', 'draft'],
  approved: ['scheduled', 'review'],
  scheduled: ['publishing', 'approved'],
  publishing: ['published', 'failed'],
  published: [],
  failed: ['retrying', 'review'],
  retrying: ['publishing', 'failed'],
};

export function assertStudioStatusTransition(
  currentStatus: StudioStatus,
  nextStatus: StudioStatus,
  context: TransitionContext
) {
  if (nextStatus === 'scheduled' && !context.approved) {
    throw new Error('Cannot schedule content before approval.');
  }

  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw new Error(`Invalid Studio status transition: ${currentStatus} -> ${nextStatus}`);
  }

  return nextStatus;
}

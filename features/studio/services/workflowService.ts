import type { StudioStatus } from '@/features/studio/types/studio';

type TransitionContext = {
  approved: boolean;
  hasRequiredMedia?: boolean;
};

const allowedTransitions: Record<StudioStatus, StudioStatus[]> = {
  draft: ['generated', 'review', 'archived'],
  generated: ['review', 'draft', 'archived'],
  review: ['approved', 'changes_requested', 'rejected', 'draft'],
  approved: ['scheduled', 'review', 'archived'],
  scheduled: ['ready_to_publish', 'approved', 'missed'],
  ready_to_publish: ['published', 'missed', 'scheduled'],
  publishing: ['published', 'failed'],
  published: [],
  changes_requested: ['review', 'draft', 'archived'],
  rejected: ['review', 'archived'],
  missed: ['ready_to_publish', 'scheduled', 'archived'],
  archived: [],
  failed: ['retrying', 'review'],
  retrying: ['publishing', 'failed'],
};

export function platformRequiresMedia(platform: string) {
  return platform === 'instagram';
}

export function hasApprovedMediaForPost(postId: string, assets: Array<{ postId?: string; status: string; fileUrl?: string; storagePath?: string; graphicSettings?: unknown }>) {
  return assets.some((asset) => (
    asset.postId === postId &&
    asset.status === 'approved' &&
    Boolean(asset.fileUrl || asset.storagePath || asset.graphicSettings)
  ));
}

export function assertStudioStatusTransition(
  currentStatus: StudioStatus,
  nextStatus: StudioStatus,
  context: TransitionContext
) {
  if (nextStatus === 'scheduled' && !context.approved) {
    throw new Error('Cannot schedule content before approval.');
  }

  if ((nextStatus === 'ready_to_publish' || nextStatus === 'published') && !context.approved) {
    throw new Error('Cannot publish content before approval.');
  }

  if ((nextStatus === 'scheduled' || nextStatus === 'ready_to_publish' || nextStatus === 'published') && context.hasRequiredMedia === false) {
    throw new Error('Cannot schedule or publish content until required media is selected and approved.');
  }

  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw new Error(`Invalid Studio status transition: ${currentStatus} -> ${nextStatus}`);
  }

  return nextStatus;
}

export const studioChannelIds = ['linkedin', 'facebook', 'instagram', 'threads', 'x'];
export const studioStatuses = [
  'draft',
  'generated',
  'review',
  'approved',
  'scheduled',
  'ready_to_publish',
  'published',
  'changes_requested',
  'rejected',
  'missed',
  'archived',
  'publishing',
  'failed',
  'retrying',
];

export function isStudioChannelId(value) {
  return studioChannelIds.includes(String(value || '').trim().toLowerCase());
}

export function normalizePlatformCore(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (isStudioChannelId(normalized)) return normalized;
  if (normalized.includes('facebook')) return 'facebook';
  if (normalized.includes('instagram')) return 'instagram';
  if (normalized.includes('thread')) return 'threads';
  if (normalized === 'x' || normalized.includes('twitter')) return 'x';
  return 'linkedin';
}

export function normalizeStatusCore(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'idea') return 'draft';
  if (normalized === 'ready to publish' || normalized === 'ready') return 'ready_to_publish';
  if (normalized === 'needs revision' || normalized === 'revision') return 'changes_requested';
  if (normalized === 'approval') return 'review';
  return studioStatuses.includes(normalized) ? normalized : 'draft';
}

export function normalizeScheduledDateCore(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.slice(0, 10);
}

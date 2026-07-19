import type { StudioCampaign, StudioChannel, StudioChannelId, StudioMediaAsset, StudioPost } from '@/features/studio/types/studio';
import { activeChannelIds, channelIds, channelRegistry } from '@/features/studio/data/channelRegistry';

export const channelLabels: Record<StudioChannelId, string> = channelIds.reduce(
  (labels, id) => ({ ...labels, [id]: channelRegistry[id].label }),
  {} as Record<StudioChannelId, string>
);

export const platformTone: Record<StudioChannelId, string> = channelIds.reduce(
  (tones, id) => ({ ...tones, [id]: channelRegistry[id].tone }),
  {} as Record<StudioChannelId, string>
);

export const defaultChannels: StudioChannel[] = channelIds.map((id) => ({
  id,
  label: channelRegistry[id].label,
  enabled: channelRegistry[id].enabled,
  cadence: channelRegistry[id].cadence,
  note: channelRegistry[id].note,
  connectionStatus: 'not_connected',
}));

export const starterCampaigns: StudioCampaign[] = [
  {
    id: 'campaign-soft-launch',
    name: 'Soft Launch Perspective Campaign',
    objective: 'Make people understand that UThynk helps them see the perspective they missed.',
    audience: 'Curious adults, parents, students, and professionals who want sharper judgment.',
    offer: 'Try three free reasoning challenges.',
    coreMessage: 'Better thinking starts when you notice what you had not considered.',
    brandPillar: 'Perspective expansion',
    campaignType: 'Founder-led beta launch',
    landingPage: 'https://uthynk.com',
    startDate: '',
    endDate: '',
    enabledChannels: activeChannelIds,
    status: 'draft',
    createdAt: new Date().toISOString(),
  },
];

export const starterPosts: StudioPost[] = [
  {
    id: 'post-founder-note',
    campaignId: 'campaign-soft-launch',
    platform: 'linkedin',
    hook: 'Most people do not need another answer. They need a better way to notice what they missed.',
    body: 'UThynk is built around a simple loop: answer a real question, face a useful new perspective, then reflect on whether your thinking changed.',
    cta: 'Try a free UThynk reasoning challenge.',
    hashtags: ['#BetterThinking', '#CriticalThinking', '#UThynk'],
    caption: 'Founder note for soft launch.',
    assetPrompt: 'Premium dark-mode UThynk graphic showing a question transforming into a new perspective, with subtle gold and teal accents.',
    graphicFormat: 'landscape',
    status: 'draft',
    scheduledFor: '',
    scheduledTime: '8:00 AM',
    scheduledTimezone: 'America/Chicago',
    approvalDecision: 'needs_review',
    approvalNote: '',
    createdAt: new Date().toISOString(),
  },
];

export const starterAssets: StudioMediaAsset[] = [
  {
    id: 'asset-beta-snapshot',
    campaignId: 'campaign-soft-launch',
    title: 'Perspective Shift Snapshot',
    assetType: 'graphic',
    prompt: 'Create a premium UThynk social graphic: question, answer, perspective you may not have considered, and +20 insight XP.',
    format: 'square',
    status: 'prompt_ready',
    altText: 'UThynk campaign graphic showing a question becoming a new perspective.',
    version: 1,
    createdAt: new Date().toISOString(),
  },
];

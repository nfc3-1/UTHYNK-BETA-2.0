import type { StudioChannelId } from '@/features/studio/types/studio';

export type StudioChannelCapability = 'text' | 'image' | 'video' | 'carousel' | 'reel';

export type StudioChannelRegistryEntry = {
  id: StudioChannelId;
  label: string;
  enabled: boolean;
  cadence: string;
  note: string;
  capabilities: StudioChannelCapability[];
  tone: string;
};

export const channelRegistry: Record<StudioChannelId, StudioChannelRegistryEntry> = {
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    enabled: true,
    cadence: 'Founder insight + beta proof',
    note: 'Best for founder narrative, investor credibility, and thoughtful product updates.',
    capabilities: ['text', 'image'],
    tone: 'professional and founder-led',
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    enabled: true,
    cadence: 'Practical explanation + community question',
    note: 'Best for approachable everyday reasoning examples and local/community shares.',
    capabilities: ['text', 'image', 'video'],
    tone: 'plain-spoken and community-centered',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    enabled: true,
    cadence: 'Carousel, quote graphic, or reel prompt',
    note: 'Best for visual snapshots, simple before/after thinking moments, and short clips.',
    capabilities: ['image', 'carousel', 'reel'],
    tone: 'visual, concise, and emotionally clear',
  },
  threads: {
    id: 'threads',
    label: 'Threads',
    enabled: true,
    cadence: 'Short thought + question loop',
    note: 'Best for quick hooks, debate prompts, and lightweight conversation starters.',
    capabilities: ['text', 'image'],
    tone: 'short, conversational, and discussion-ready',
  },
  x: {
    id: 'x',
    label: 'X',
    enabled: false,
    cadence: 'Short hook + proof point',
    note: 'Reserved for later distribution once the launch channels are stable.',
    capabilities: ['text', 'image'],
    tone: 'sharp, concise, and evidence-led',
  },
};

export const channelIds = Object.keys(channelRegistry) as StudioChannelId[];
export const activeChannelIds = channelIds.filter((id) => channelRegistry[id].enabled);

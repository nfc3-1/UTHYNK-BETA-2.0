import type { StudioCampaign, StudioChannel, StudioMediaAsset, StudioPost, StudioState } from '@/features/studio/types/studio';
import { validateStudioState } from '@/features/studio/validation/studioSchemas';

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Studio request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function loadStudioState(): Promise<StudioState> {
  const data = await jsonRequest<Partial<StudioState>>('/api/studio/state');
  return validateStudioState(data);
}

export async function saveStudioState(state: StudioState): Promise<StudioState> {
  const data = await jsonRequest<Partial<StudioState>>('/api/studio/state', {
    method: 'PUT',
    body: JSON.stringify(state),
  });

  return validateStudioState(data);
}

export function upsertCampaign(campaigns: StudioCampaign[], campaign: StudioCampaign) {
  return [campaign, ...campaigns.filter((item) => item.id !== campaign.id)];
}

export function upsertPosts(posts: StudioPost[], nextPosts: StudioPost[]) {
  const ids = new Set(nextPosts.map((post) => post.id));
  return [...nextPosts, ...posts.filter((post) => !ids.has(post.id))];
}

export function upsertAssets(assets: StudioMediaAsset[], nextAssets: StudioMediaAsset[]) {
  const ids = new Set(nextAssets.map((asset) => asset.id));
  return [...nextAssets, ...assets.filter((asset) => !ids.has(asset.id))];
}

export function updateChannels(channels: StudioChannel[], id: StudioChannel['id']) {
  return channels.map((channel) => (channel.id === id ? { ...channel, enabled: !channel.enabled } : channel));
}

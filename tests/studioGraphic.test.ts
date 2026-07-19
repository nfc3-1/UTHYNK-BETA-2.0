import { describe, expect, it } from 'vitest';
import { createGraphicAsset, defaultGraphicSettings, platformGraphicDimensions, renderStudioGraphicSvg } from '../features/studio/services/graphicService';
import type { StudioPost } from '../features/studio/types/studio';

const post: StudioPost = {
  id: 'post-1',
  campaignId: 'campaign-1',
  platform: 'instagram',
  hook: 'What question are you not asking?',
  body: 'A better answer starts when you test the assumption you skipped.',
  cta: 'Try a free UThynk challenge.',
  hashtags: ['#UThynk'],
  caption: 'Question prompt',
  assetPrompt: 'Local graphic',
  graphicFormat: 'square',
  status: 'review',
  scheduledFor: '2026-07-21',
  scheduledTime: '8:00 AM',
  scheduledTimezone: 'America/Chicago',
  approvalDecision: 'needs_review',
  approvalNote: '',
  createdAt: '2026-07-19T00:00:00.000Z',
};

describe('Studio graphic generator', () => {
  it('uses platform-specific dimensions', () => {
    expect(platformGraphicDimensions.instagram).toMatchObject({ width: 1080, height: 1080 });
    expect(platformGraphicDimensions.linkedin).toMatchObject({ width: 1200, height: 627 });
    expect(platformGraphicDimensions.facebook).toMatchObject({ width: 1200, height: 630 });
  });

  it('renders branded editable SVG without external providers', () => {
    const svg = renderStudioGraphicSvg('instagram', defaultGraphicSettings(post));
    expect(svg).toContain('UThynk');
    expect(svg).toContain('Better questions. Better judgment.');
    expect(svg).toContain('What question are you not asking?');
  });

  it('creates a local template asset for persistence', () => {
    const asset = createGraphicAsset(post, defaultGraphicSettings(post), 'asset-1', '2026-07-19T00:00:00.000Z');
    expect(asset.provider).toBe('local_template');
    expect(asset.postId).toBe(post.id);
    expect(asset.fileUrl).toContain('data:image/svg+xml');
    expect(asset.graphicSettings?.headline).toBe(post.hook);
  });
});

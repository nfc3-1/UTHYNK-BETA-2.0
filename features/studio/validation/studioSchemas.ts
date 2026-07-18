import { defaultChannels, starterAssets, starterCampaigns, starterPosts } from '@/features/studio/data/studioDefaults';
import { activeChannelIds } from '@/features/studio/data/channelRegistry';
import { isStudioChannelId as isStudioChannelIdCore, normalizePlatformCore, normalizeScheduledDateCore, normalizeStatusCore } from '@/features/studio/validation/studioCore.mjs';
import type {
  ApprovalDecision,
  StudioAssetStatus,
  StudioAssetType,
  StudioCampaign,
  StudioChannel,
  StudioChannelId,
  StudioGeneratedPackage,
  StudioGenerateRequest,
  StudioGraphicFormat,
  StudioMediaAsset,
  StudioMetric,
  StudioPost,
  StudioState,
  StudioStatus,
} from '@/features/studio/types/studio';

const decisions = ['needs_review', 'approved', 'revision'] as const;
const assetStatuses = ['needed', 'prompt_ready', 'in_progress', 'ready', 'approved'] as const;
const assetTypes = ['graphic', 'video', 'screenshot', 'template'] as const;
const formats = ['square', 'portrait', 'landscape'] as const;

function oneOf<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  const normalized = String(value || '').trim().toLowerCase();
  return (allowed as readonly string[]).includes(normalized) ? (normalized as T[number]) : fallback;
}

function text(value: unknown, fallback = '') {
  const next = String(value ?? '').trim();
  return next || fallback;
}

function iso(value: unknown) {
  const next = text(value);
  return Number.isNaN(Date.parse(next)) ? new Date().toISOString() : next;
}

function optionalDate(value: unknown) {
  return normalizeScheduledDateCore(value);
}

function numberValue(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function isStudioChannelId(value: unknown): value is StudioChannelId {
  return isStudioChannelIdCore(value);
}

export function normalizePlatform(value: unknown): StudioChannelId {
  return normalizePlatformCore(value) as StudioChannelId;
}

export function normalizeStatus(value: unknown): StudioStatus {
  return normalizeStatusCore(value) as StudioStatus;
}

export function normalizeHashtags(value: unknown): string[] {
  if (Array.isArray(value)) {
    const tags = value.map((item) => text(item)).filter(Boolean);
    return tags.length ? tags : ['#UThynk'];
  }

  const raw = text(value);
  return raw ? raw.split(/\s+/).filter(Boolean) : ['#UThynk'];
}

export function validateCampaign(value: any, index = 0): StudioCampaign {
  const fallback = starterCampaigns[0];
  const brief = value?.campaign_brief || {};

  return {
    id: text(value?.id, `campaign-${index}`),
    name: text(value?.name, fallback.name),
    objective: text(value?.objective, fallback.objective),
    audience: text(value?.audience, fallback.audience),
    offer: text(value?.offer, brief.offer || fallback.offer),
    coreMessage: text(value?.coreMessage, value?.core_message || brief.coreMessage || fallback.coreMessage),
    brandPillar: text(value?.brandPillar, value?.brand_pillar || brief.brandPillar || fallback.brandPillar),
    campaignType: text(value?.campaignType, value?.campaign_type || brief.campaignType || fallback.campaignType),
    landingPage: text(value?.landingPage, value?.landing_page_url || brief.landingPage || fallback.landingPage),
    startDate: optionalDate(value?.startDate || value?.start_date),
    endDate: optionalDate(value?.endDate || value?.end_date),
    enabledChannels: Array.isArray(value?.enabledChannels || value?.enabled_platforms)
      ? (value.enabledChannels || value.enabled_platforms).map(normalizePlatform)
      : fallback.enabledChannels.length ? fallback.enabledChannels : activeChannelIds,
    status: normalizeStatus(value?.status),
    createdAt: iso(value?.createdAt || value?.created_at),
  };
}

export function validatePost(value: any, index = 0, fallbackCampaignId = starterCampaigns[0].id): StudioPost {
  const platform = normalizePlatform(value?.platform);

  return {
    id: text(value?.id, `post-${index}`),
    campaignId: text(value?.campaignId, value?.campaign_id || fallbackCampaignId),
    platform,
    hook: text(value?.hook, starterPosts[0].hook),
    body: text(value?.body, 'UThynk helps people see the perspective they had not considered.'),
    cta: text(value?.cta, 'Try a free UThynk reasoning challenge.'),
    hashtags: normalizeHashtags(value?.hashtags),
    caption: text(value?.caption, `${platform} campaign draft.`),
    assetPrompt: text(value?.assetPrompt, value?.asset_prompt || 'Create a premium UThynk social graphic.'),
    graphicFormat: oneOf(value?.graphicFormat || value?.graphic_format, formats, platform === 'instagram' ? 'portrait' : 'square') as StudioGraphicFormat,
    status: normalizeStatus(value?.status),
    scheduledFor: optionalDate(value?.scheduledFor || value?.scheduled_for),
    scheduledTime: text(value?.scheduledTime || value?.content_package?.scheduledTime, '8:00 AM'),
    scheduledTimezone: text(value?.scheduledTimezone || value?.scheduled_timezone, 'America/Chicago'),
    approvalDecision: oneOf(value?.approvalDecision || value?.approval_decision, decisions, 'needs_review') as ApprovalDecision,
    approvalNote: text(value?.approvalNote || value?.approval_notes),
    publishingError: text(value?.publishingError || value?.publishing_error),
    publishedAt: text(value?.publishedAt || value?.published_at),
    createdAt: iso(value?.createdAt || value?.created_at),
  };
}

export function validateAsset(value: any, index = 0, fallbackCampaignId = starterCampaigns[0].id): StudioMediaAsset {
  const metadata = value?.metadata || {};

  return {
    id: text(value?.id, `asset-${index}`),
    campaignId: text(value?.campaignId, value?.campaign_id || fallbackCampaignId),
    postId: text(value?.postId || value?.post_id),
    title: text(value?.title, starterAssets[0].title),
    assetType: oneOf(value?.assetType || value?.asset_type, assetTypes, 'graphic') as StudioAssetType,
    prompt: text(value?.prompt, value?.generation_prompt || starterAssets[0].prompt),
    format: oneOf(value?.format, formats, 'square') as StudioGraphicFormat,
    status: oneOf(value?.status, assetStatuses, 'prompt_ready') as StudioAssetStatus,
    fileUrl: text(value?.fileUrl || value?.file_url || metadata.fileUrl),
    thumbnailUrl: text(value?.thumbnailUrl || value?.thumbnail_url || metadata.thumbnailUrl),
    storagePath: text(value?.storagePath || value?.storage_path),
    altText: text(value?.altText || value?.alt_text || metadata.altText),
    width: metadata.width ? numberValue(metadata.width) : undefined,
    height: metadata.height ? numberValue(metadata.height) : undefined,
    fileSize: metadata.fileSize ? numberValue(metadata.fileSize) : undefined,
    mimeType: text(metadata.mimeType),
    version: numberValue(metadata.version, 1),
    createdAt: iso(value?.createdAt || value?.created_at),
  };
}

export function validateChannel(value: any): StudioChannel {
  const id = normalizePlatform(value?.id || value?.platform || value?.label);
  const fallback = defaultChannels.find((channel) => channel.id === id) || defaultChannels[0];

  return {
    ...fallback,
    enabled: typeof value?.enabled === 'boolean' ? value.enabled : fallback.enabled,
    cadence: text(value?.cadence, fallback.cadence),
    note: text(value?.note || value?.notes, fallback.note),
    connectionStatus: text(value?.connectionStatus || value?.connection_status, fallback.connectionStatus) as StudioChannel['connectionStatus'],
    accountLabel: text(value?.accountLabel || value?.account_label),
  };
}

export function validateMetric(value: any, index = 0): StudioMetric {
  return {
    id: text(value?.id, `metric-${index}`),
    campaignId: text(value?.campaignId || value?.campaign_id),
    postId: text(value?.postId || value?.post_id),
    platform: value?.platform ? normalizePlatform(value.platform) : undefined,
    metricType: text(value?.metricType || value?.metric_type || value?.event_type, 'engagement'),
    metricValue: numberValue(value?.metricValue || value?.metric_value || value?.event_value),
    occurredAt: iso(value?.occurredAt || value?.occurred_at),
  };
}

export function validateStudioState(value: Partial<StudioState> | any): StudioState {
  const campaigns = Array.isArray(value?.campaigns) && value.campaigns.length
    ? value.campaigns.map(validateCampaign)
    : starterCampaigns;
  const fallbackCampaignId = campaigns[0]?.id || starterCampaigns[0].id;

  return {
    campaigns,
    posts: Array.isArray(value?.posts) && value.posts.length
      ? value.posts.map((post: any, index: number) => validatePost(post, index, fallbackCampaignId))
      : starterPosts,
    assets: Array.isArray(value?.assets) && value.assets.length
      ? value.assets.map((asset: any, index: number) => validateAsset(asset, index, fallbackCampaignId))
      : starterAssets,
    channels: Array.isArray(value?.channels) && value.channels.length
      ? value.channels.map(validateChannel)
      : defaultChannels,
    metrics: Array.isArray(value?.metrics) ? value.metrics.map(validateMetric) : [],
  };
}

export function validateGenerateRequest(value: any): StudioGenerateRequest {
  const channels = Array.isArray(value?.enabledChannels || value?.channels)
    ? (value.enabledChannels || value.channels).map(normalizePlatform)
    : ['linkedin'];

  return {
    objective: text(value?.objective || value?.goal, 'Promote UThynk reasoning challenges'),
    audience: text(value?.audience, 'curious thinkers'),
    sourceQuestion: text(value?.sourceQuestion || value?.source, 'a real UThynk question'),
    enabledChannels: channels.length ? channels : ['linkedin'],
    cadence: text(value?.cadence || value?.duration, 'one week'),
    previousApprovedContent: Array.isArray(value?.previousApprovedContent) ? value.previousApprovedContent.map(validatePost) : [],
    brandRules: Array.isArray(value?.brandRules) ? value.brandRules.map((rule: unknown) => text(rule)).filter(Boolean) : [],
    recentPerformanceSignals: Array.isArray(value?.recentPerformanceSignals) ? value.recentPerformanceSignals.map(validateMetric) : [],
    campaignName: text(value?.campaignName),
    offer: text(value?.offer),
  };
}

export function validateGeneratedPackage(value: any, source: 'openai' | 'fallback'): StudioGeneratedPackage {
  const posts = Array.isArray(value?.posts) ? value.posts.map((post: any) => ({
    platform: normalizePlatform(post?.platform),
    hook: text(post?.hook, 'A better answer starts with a better question.'),
    body: text(post?.body, 'UThynk helps people see the perspective they had not considered.'),
    cta: text(post?.cta, 'Try a free UThynk reasoning challenge.'),
    hashtags: normalizeHashtags(post?.hashtags),
    caption: text(post?.caption, 'UThynk campaign draft.'),
    assetPrompt: text(post?.assetPrompt || post?.asset_prompt, 'Create a premium UThynk visual for this post.'),
    suggestedDay: text(post?.suggestedDay),
    suggestedTime: text(post?.suggestedTime, '8:00 AM'),
  })) : [];

  const assets = Array.isArray(value?.assets) ? value.assets.map((asset: any) => ({
    title: text(asset?.title, 'Campaign asset'),
    assetType: oneOf(asset?.assetType || asset?.asset_type, assetTypes, 'graphic') as StudioAssetType,
    prompt: text(asset?.prompt, 'Create a premium UThynk campaign visual.'),
    format: oneOf(asset?.format, formats, 'square') as StudioGraphicFormat,
  })) : [];

  return {
    source,
    campaign: value?.campaign,
    posts,
    assets,
  };
}

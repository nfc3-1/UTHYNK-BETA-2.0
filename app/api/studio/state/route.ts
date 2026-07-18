import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { defaultChannels } from '@/features/studio/data/studioDefaults';
import type { StudioCampaign, StudioChannel, StudioMediaAsset, StudioPost, StudioState } from '@/features/studio/types/studio';
import { validateStudioState } from '@/features/studio/validation/studioSchemas';
import { getStudioAccess } from '@/lib/studioAuth';
import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';
import { trackServerEvent } from '@/lib/telemetry';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function unauthorized(reason: 'unauthenticated' | 'not_admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: reason === 'unauthenticated' ? 401 : 403 });
}

function ensureUuid(value: string | undefined, remaps: Map<string, string>) {
  if (value && uuidPattern.test(value)) return value;
  const key = value || randomUUID();
  const existing = remaps.get(key);
  if (existing) return existing;
  const next = randomUUID();
  remaps.set(key, next);
  return next;
}

function mapCampaignRow(row: any): StudioCampaign {
  return {
    id: row.id,
    name: row.name,
    objective: row.objective,
    audience: row.audience || '',
    offer: row.offer || row.campaign_brief?.offer || '',
    coreMessage: row.core_message || row.campaign_brief?.coreMessage || '',
    brandPillar: row.brand_pillar || row.campaign_brief?.brandPillar || '',
    campaignType: row.campaign_type || row.campaign_brief?.campaignType || '',
    landingPage: row.landing_page_url || row.campaign_brief?.landingPage || '',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    enabledChannels: row.enabled_platforms || ['linkedin', 'facebook', 'instagram', 'threads'],
    status: row.status || 'draft',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapPostRow(row: any): StudioPost {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    platform: row.platform,
    hook: row.hook,
    body: row.body || '',
    cta: row.cta || '',
    hashtags: row.hashtags || [],
    caption: row.caption || '',
    assetPrompt: row.asset_prompt || '',
    graphicFormat: row.graphic_format || 'square',
    status: row.status || 'draft',
    scheduledFor: row.scheduled_for ? String(row.scheduled_for).slice(0, 10) : '',
    scheduledTime: row.content_package?.scheduledTime || '8:00 AM',
    scheduledTimezone: row.scheduled_timezone || 'America/Chicago',
    approvalDecision: row.approval_decision || 'needs_review',
    approvalNote: row.approval_notes || '',
    publishingError: row.publishing_error || '',
    publishedAt: row.published_at || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapAssetRow(row: any): StudioMediaAsset {
  const metadata = row.metadata || {};

  return {
    id: row.id,
    campaignId: row.campaign_id || '',
    postId: row.post_id || '',
    title: row.title,
    assetType: row.asset_type,
    prompt: row.generation_prompt || '',
    format: metadata.format || 'square',
    status: row.status || 'prompt_ready',
    fileUrl: metadata.fileUrl || '',
    thumbnailUrl: metadata.thumbnailUrl || '',
    storagePath: row.storage_path || '',
    altText: metadata.altText || '',
    width: metadata.width,
    height: metadata.height,
    fileSize: metadata.fileSize,
    mimeType: metadata.mimeType,
    version: metadata.version || 1,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

async function loadAssets() {
  if (!supabaseAdmin) return [];

  const preferred = await supabaseAdmin.from('studio_assets').select('*').order('created_at', { ascending: false });
  if (!preferred.error) return preferred.data || [];

  const fallback = await supabaseAdmin.from('studio_media_assets').select('*').order('created_at', { ascending: false });
  return fallback.data || [];
}

export async function GET() {
  const access = await getStudioAccess();

  if (access.allowed !== true) {
    return unauthorized(access.reason);
  }

  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return NextResponse.json(validateStudioState({ channels: defaultChannels }));
  }

  const [campaignsResult, postsResult, channelsResult, metricsResult, assetsRows] = await Promise.all([
    supabaseAdmin.from('studio_campaigns').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('studio_posts').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('studio_channels').select('*').order('platform', { ascending: true }),
    supabaseAdmin.from('studio_metrics').select('*').order('occurred_at', { ascending: false }),
    loadAssets(),
  ]);

  const state = validateStudioState({
    campaigns: campaignsResult.data?.map(mapCampaignRow),
    posts: postsResult.data?.map(mapPostRow),
    assets: assetsRows.map(mapAssetRow),
    channels: channelsResult.data?.map((row: any) => ({
      id: row.platform,
      platform: row.platform,
      label: row.label,
      enabled: row.enabled,
      cadence: row.cadence,
      notes: row.notes,
      connection_status: row.connection_status || row.metadata?.connectionStatus,
      account_label: row.account_label || row.metadata?.accountLabel,
    })),
    metrics: metricsResult.data,
  });

  return NextResponse.json(state);
}

export async function PUT(request: Request) {
  const access = await getStudioAccess();

  if (access.allowed !== true) {
    return unauthorized(access.reason);
  }

  const incoming = validateStudioState(await request.json().catch(() => ({})));

  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return NextResponse.json(incoming);
  }

  const campaignIds = new Map<string, string>();
  const postIds = new Map<string, string>();
  const assetIds = new Map<string, string>();

  const campaigns = incoming.campaigns.map((campaign) => ({
    id: ensureUuid(campaign.id, campaignIds),
    created_by: access.user.id,
    name: campaign.name,
    objective: campaign.objective,
    audience: campaign.audience,
    status: campaign.status,
    offer: campaign.offer,
    core_message: campaign.coreMessage,
    brand_pillar: campaign.brandPillar,
    campaign_type: campaign.campaignType,
    landing_page_url: campaign.landingPage,
    start_date: campaign.startDate || null,
    end_date: campaign.endDate || null,
    enabled_platforms: campaign.enabledChannels,
    campaign_brief: {
      offer: campaign.offer,
      coreMessage: campaign.coreMessage,
      brandPillar: campaign.brandPillar,
      campaignType: campaign.campaignType,
      landingPage: campaign.landingPage,
    },
    updated_at: new Date().toISOString(),
  }));

  const posts = incoming.posts.map((post) => ({
    id: ensureUuid(post.id, postIds),
    campaign_id: ensureUuid(post.campaignId, campaignIds),
    created_by: access.user.id,
    platform: post.platform,
    hook: post.hook,
    body: post.body,
    cta: post.cta,
    caption: post.caption,
    hashtags: post.hashtags,
    asset_prompt: post.assetPrompt,
    status: post.status,
    scheduled_for: post.scheduledFor ? `${post.scheduledFor} ${post.scheduledTime || '08:00'}` : null,
    scheduled_timezone: post.scheduledTimezone || 'America/Chicago',
    approval_decision: post.approvalDecision,
    approval_notes: post.approvalNote,
    graphic_format: post.graphicFormat,
    content_package: { scheduledTime: post.scheduledTime || '8:00 AM' },
    updated_at: new Date().toISOString(),
  }));

  const assets = incoming.assets.map((asset) => ({
    id: ensureUuid(asset.id, assetIds),
    campaign_id: ensureUuid(asset.campaignId, campaignIds),
    post_id: asset.postId ? ensureUuid(asset.postId, postIds) : null,
    created_by: access.user.id,
    asset_type: asset.assetType,
    title: asset.title,
    storage_path: asset.storagePath || null,
    generation_prompt: asset.prompt,
    status: asset.status,
    metadata: {
      format: asset.format,
      fileUrl: asset.fileUrl,
      thumbnailUrl: asset.thumbnailUrl,
      altText: asset.altText,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType,
      version: asset.version || 1,
    },
  }));

  const channels = incoming.channels.map((channel: StudioChannel) => ({
    platform: channel.id,
    label: channel.label,
    created_by: access.user.id,
    enabled: channel.enabled,
    cadence: channel.cadence,
    notes: channel.note,
    connection_status: channel.connectionStatus || 'not_connected',
    account_label: channel.accountLabel || null,
    metadata: {
      connectionStatus: channel.connectionStatus,
      accountLabel: channel.accountLabel,
    },
    updated_at: new Date().toISOString(),
  }));

  const [campaignResult, postResult, channelResult, assetResult] = await Promise.all([
    supabaseAdmin.from('studio_campaigns').upsert(campaigns),
    supabaseAdmin.from('studio_posts').upsert(posts),
    supabaseAdmin.from('studio_channels').upsert(channels, { onConflict: 'platform' }),
    supabaseAdmin.from('studio_assets').upsert(assets),
  ]);

  const persistenceError = campaignResult.error || postResult.error || channelResult.error || assetResult.error;

  if (persistenceError) {
    await trackServerEvent('database_failure', access.user.id, {
      route: '/api/studio/state',
      message: persistenceError.message,
    });

    return NextResponse.json({ error: 'Studio persistence failed.' }, { status: 500 });
  }

  await supabaseAdmin.from('studio_audit_log').insert({
    actor_id: access.user.id,
    action: 'studio_state_saved',
    entity_type: 'studio_state',
    metadata: {
      campaigns: campaigns.length,
      posts: posts.length,
      assets: assets.length,
      channels: channels.length,
    },
  });

  await trackServerEvent('studio_state_saved', access.user.id, {
    campaigns: campaigns.length,
    posts: posts.length,
    assets: assets.length,
    channels: channels.length,
  });

  return GET();
}

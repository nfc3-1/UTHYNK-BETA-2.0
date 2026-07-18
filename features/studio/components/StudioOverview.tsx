'use client';

import { useMemo, useState } from 'react';
import AnalyticsPanel from '@/features/studio/components/AnalyticsPanel';
import ApprovalQueue from '@/features/studio/components/ApprovalQueue';
import AssetLibrary from '@/features/studio/components/AssetLibrary';
import CampaignWizard from '@/features/studio/components/CampaignWizard';
import ConnectionsPanel from '@/features/studio/components/ConnectionsPanel';
import ContentCalendar from '@/features/studio/components/ContentCalendar';
import ContentQueue from '@/features/studio/components/ContentQueue';
import styles from '@/features/studio/components/StudioDashboard.module.css';
import { channelLabels, defaultChannels, platformTone, starterCampaigns } from '@/features/studio/data/studioDefaults';
import { useStudioCampaigns } from '@/features/studio/hooks/useStudioCampaigns';
import { useStudioPosts } from '@/features/studio/hooks/useStudioPosts';
import { generateStudioPackage } from '@/features/studio/services/generationService';
import { summarizeStudioMetrics } from '@/features/studio/services/analyticsService';
import type { StudioCampaign, StudioChannelId, StudioMediaAsset, StudioPost, StudioState, StudioStatus } from '@/features/studio/types/studio';
import { normalizePlatform } from '@/features/studio/validation/studioSchemas';

type StudioModule = 'brief' | 'content' | 'media' | 'calendar' | 'approval' | 'analytics' | 'connections';

function makeId() {
  return crypto.randomUUID();
}

function todayOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildPost(campaign: StudioCampaign, platform: StudioChannelId, index: number): StudioPost {
  const label = channelLabels[platform];
  const tone = platformTone[platform];
  const hookOptions = [
    'The strongest answer is usually hiding one question you did not ask.',
    'What if better thinking is less about being right and more about noticing what you missed?',
    'A good reasoning challenge should make you pause, not perform.',
    'Before you defend your answer, UThynk asks you to test the angle you skipped.',
  ];

  return {
    id: makeId(),
    campaignId: campaign.id,
    platform,
    hook: hookOptions[index % hookOptions.length],
    body: `${campaign.coreMessage}\n\nFor ${label}, keep the message ${tone}. Start with a real-life decision, show the missing perspective, then invite the audience to try one challenge.\n\nCampaign objective: ${campaign.objective}`,
    cta: campaign.offer || 'Try a free UThynk reasoning challenge.',
    hashtags: platform === 'threads' ? ['#UThynk'] : ['#UThynk', '#BetterThinking', '#Reasoning'],
    caption: `${label} variant for ${campaign.name}`,
    assetPrompt: `Create a ${platform === 'instagram' ? 'portrait carousel cover' : 'premium social graphic'} for UThynk. Theme: ${campaign.brandPillar}. Show a simple question, a missed perspective, and a small growth signal.`,
    graphicFormat: platform === 'instagram' ? 'portrait' : platform === 'linkedin' ? 'landscape' : 'square',
    status: 'draft',
    scheduledFor: todayOffset(index + 1),
    scheduledTime: ['8:00 AM', '11:30 AM', '5:00 PM', '7:30 PM'][index % 4],
    scheduledTimezone: 'America/Chicago',
    approvalDecision: 'needs_review',
    approvalNote: '',
    createdAt: new Date().toISOString(),
  };
}

function buildVideoAsset(campaign: StudioCampaign): StudioMediaAsset {
  return {
    id: makeId(),
    campaignId: campaign.id,
    title: '30-second beta explainer storyboard',
    assetType: 'video',
    prompt: `Brand video plan for ${campaign.name}: show someone answering a real question, reveal the missed perspective, then invite users to try UThynk.`,
    format: 'portrait',
    status: 'prompt_ready',
    altText: 'Storyboard concept for a UThynk beta explainer video.',
    version: 1,
    createdAt: new Date().toISOString(),
  };
}

export default function StudioOverview() {
  const {
    campaigns,
    posts,
    assets,
    channels,
    metrics,
    setState,
    hydrated,
    backendAvailable,
    recoveryWarning,
    exportRecoveryData,
  } = useStudioCampaigns();
  const [selectedCampaignId, setSelectedCampaignId] = useState(starterCampaigns[0]?.id || '');
  const [activeModule, setActiveModule] = useState<StudioModule>('brief');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] = useState<'openai' | 'fallback' | null>(null);
  const [campaignDraft, setCampaignDraft] = useState({
    name: '',
    objective: '',
    audience: '',
    offer: '',
    coreMessage: '',
    brandPillar: 'Perspective expansion',
    campaignType: 'Soft launch',
    landingPage: 'https://uthynk.com',
    startDate: '',
    endDate: '',
  });

  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) || campaigns[0];
  const { selectedPosts, reviewPosts, firstScheduled } = useStudioPosts(posts, selectedCampaign?.id);
  const selectedAssets = assets.filter((asset) => asset.campaignId === selectedCampaign?.id);
  const activeChannels = channels.filter((channel) => channel.enabled);
  const enabledPlatforms = selectedCampaign?.enabledChannels?.length
    ? selectedCampaign.enabledChannels
    : activeChannels.map((channel) => channel.id);
  const missingAssets = assets.filter((asset) => asset.status === 'needed' || asset.status === 'prompt_ready');
  const metricSummary = summarizeStudioMetrics(posts, metrics);

  const analytics = useMemo(
    () => [
      { label: 'Active channels', value: activeChannels.length, detail: 'LinkedIn, Facebook, Instagram, Threads registry' },
      { label: 'Posts generated', value: posts.length, detail: 'Drafts, review items, and scheduled packets' },
      { label: 'Review queue', value: reviewPosts.length, detail: 'Items waiting for approval' },
      { label: 'Metric events', value: metricSummary.metricEvents, detail: `${metricSummary.engagement} tracked engagement actions` },
    ],
    [activeChannels.length, metricSummary.engagement, metricSummary.metricEvents, posts.length, reviewPosts.length]
  );

  function patchState(patch: Partial<StudioState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function updateCampaignDraft(key: keyof typeof campaignDraft, value: string) {
    setCampaignDraft((current) => ({ ...current, [key]: value }));
  }

  function createCampaign() {
    if (!campaignDraft.name.trim()) return;

    const nextCampaign: StudioCampaign = {
      id: makeId(),
      name: campaignDraft.name.trim(),
      objective: campaignDraft.objective.trim() || 'Clarify the UThynk story and move the audience toward one action.',
      audience: campaignDraft.audience.trim() || 'People who want better judgment without academic friction.',
      offer: campaignDraft.offer.trim() || 'Try three free reasoning challenges.',
      coreMessage: campaignDraft.coreMessage.trim() || 'UThynk helps you notice the perspective you had not considered.',
      brandPillar: campaignDraft.brandPillar.trim() || 'Perspective expansion',
      campaignType: campaignDraft.campaignType.trim() || 'Soft launch',
      landingPage: campaignDraft.landingPage.trim() || 'https://uthynk.com',
      startDate: campaignDraft.startDate,
      endDate: campaignDraft.endDate,
      enabledChannels: activeChannels.map((channel) => channel.id),
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    patchState({
      campaigns: [nextCampaign, ...campaigns],
      assets: [buildVideoAsset(nextCampaign), ...assets],
    });
    setSelectedCampaignId(nextCampaign.id);
    setCampaignDraft({
      name: '',
      objective: '',
      audience: '',
      offer: '',
      coreMessage: '',
      brandPillar: 'Perspective expansion',
      campaignType: 'Soft launch',
      landingPage: 'https://uthynk.com',
      startDate: '',
      endDate: '',
    });
  }

  function toggleChannel(id: StudioChannelId) {
    patchState({
      channels: channels.map((channel) => (channel.id === id ? { ...channel, enabled: !channel.enabled } : channel)),
    });
  }

  async function generateContentPackage() {
    if (!selectedCampaign) return;

    const platforms: StudioChannelId[] = enabledPlatforms.length ? enabledPlatforms : ['linkedin'];
    setIsGenerating(true);

    try {
      const generated = await generateStudioPackage({
        objective: selectedCampaign.objective,
        audience: selectedCampaign.audience,
        sourceQuestion: selectedCampaign.coreMessage,
        enabledChannels: platforms,
        cadence: 'one week',
        previousApprovedContent: posts.filter((post) => post.status === 'approved' || post.status === 'published').slice(0, 8),
        brandRules: ['Use plain language', 'Avoid hype', 'Make every platform strategy distinct'],
        recentPerformanceSignals: metrics.slice(0, 12),
        campaignName: selectedCampaign.name,
        offer: selectedCampaign.offer,
      });
      const now = new Date().toISOString();
      const newPosts = generated.posts.length
        ? generated.posts.map((post, index): StudioPost => {
            const platform = normalizePlatform(post.platform);
            return {
              id: makeId(),
              campaignId: selectedCampaign.id,
              platform,
              hook: post.hook,
              body: post.body,
              cta: post.cta,
              hashtags: post.hashtags,
              caption: post.caption,
              assetPrompt: post.assetPrompt,
              graphicFormat: platform === 'instagram' ? 'portrait' : platform === 'linkedin' ? 'landscape' : 'square',
              status: 'review',
              scheduledFor: todayOffset(index + 1),
              scheduledTime: post.suggestedTime || '8:00 AM',
              scheduledTimezone: 'America/Chicago',
              approvalDecision: 'needs_review',
              approvalNote: '',
              createdAt: now,
            };
          })
        : platforms.map((platform, index) => buildPost(selectedCampaign, platform, index));
      const newAssets = generated.assets.length
        ? generated.assets.map((asset): StudioMediaAsset => ({
            id: makeId(),
            campaignId: selectedCampaign.id,
            title: asset.title,
            assetType: asset.assetType,
            prompt: asset.prompt,
            format: asset.format,
            status: 'prompt_ready',
            version: 1,
            createdAt: now,
          }))
        : [buildVideoAsset(selectedCampaign)];

      patchState({
        posts: [...newPosts, ...posts],
        assets: [...newAssets, ...assets],
      });
      setGenerationSource(generated.source);
    } catch {
      patchState({
        posts: [...platforms.map((platform, index) => buildPost(selectedCampaign, platform, index)), ...posts],
        assets: [buildVideoAsset(selectedCampaign), ...assets],
      });
      setGenerationSource('fallback');
    } finally {
      setIsGenerating(false);
      setActiveModule('approval');
    }
  }

  function updatePost(id: string, patch: Partial<StudioPost>) {
    patchState({
      posts: posts.map((post) => (post.id === id ? { ...post, ...patch } : post)),
    });
  }

  function moveCampaignStatus(status: StudioStatus) {
    if (!selectedCampaign) return;
    patchState({
      campaigns: campaigns.map((campaign) => (campaign.id === selectedCampaign.id ? { ...campaign, status } : campaign)),
    });
  }

  return (
    <div className={styles.scope}>
      {recoveryWarning && (
        <section className="studioRecoveryWarning">
          <strong>Studio recovery mode</strong>
          <p>{recoveryWarning}</p>
          <button className="btn" type="button" onClick={exportRecoveryData}>Export Recovery Data</button>
        </section>
      )}
      <section className="studioCommandCenter">
        <div>
          <p className="studioEyebrow">This Week at UThynk</p>
          <h2>{selectedCampaign?.name || 'Weekly campaign workspace'}</h2>
          <span>{firstScheduled ? `First post scheduled ${firstScheduled.scheduledFor} at ${firstScheduled.scheduledTime || '8:00 AM'}.` : 'Build next week, review the queue, approve the strongest pieces, then schedule.'}</span>
          <small className="studioMuted">{backendAvailable ? 'Saved to Supabase.' : 'Using browser recovery backup until Supabase is reachable.'}</small>
        </div>
        <button className="btn btnPrimary" type="button" onClick={generateContentPackage} disabled={isGenerating || !hydrated}>
          {isGenerating ? 'Building Campaign...' : "Build Next Week's Campaign"}
        </button>
      </section>

      <section className="studioWeekStats">
        <article><strong>{posts.length}</strong><span>Posts prepared</span><small>Across active campaigns</small></article>
        <article><strong>{activeChannels.length}</strong><span>Platforms active</span><small>{activeChannels.map((channel) => channel.label).join(', ')}</small></article>
        <article><strong>{reviewPosts.length}</strong><span>Need approval</span><small>Copy or visuals waiting on approval</small></article>
        <article><strong>{missingAssets.length}</strong><span>Assets missing</span><small>Prompts ready or files needed</small></article>
      </section>

      <div className="studioGrid studioGridExpanded">
        <section className="studioPanel studioControlPanel">
          <div className="studioPanelHeader">
            <span>Channel Registry</span>
            <strong>Active launch destinations.</strong>
          </div>
          <div className="studioChannelList">
            {(channels.length ? channels : defaultChannels).map((channel) => (
              <button key={channel.id} className={channel.enabled ? 'enabled' : ''} type="button" onClick={() => toggleChannel(channel.id)}>
                <span>{channel.enabled ? 'Enabled' : 'Paused'} / {channel.connectionStatus || 'not_connected'}</span>
                <strong>{channel.label}</strong>
                <small>{channel.cadence}</small>
              </button>
            ))}
          </div>
        </section>

        <CampaignWizard campaignDraft={campaignDraft} onChange={updateCampaignDraft} onCreate={createCampaign} />

        <section className="studioPanel">
          <div className="studioPanelHeader"><span>Saved Campaigns</span><strong>Campaigns created from weekly goals.</strong></div>
          <div className="studioCampaignList">
            {campaigns.map((campaign) => (
              <button key={campaign.id} className={selectedCampaign?.id === campaign.id ? 'active' : ''} type="button" onClick={() => setSelectedCampaignId(campaign.id)}>
                <span>{campaign.status}</span>
                <strong>{campaign.name}</strong>
                <small>{campaign.objective}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="studioPanel studioWidePanel">
          <div className="studioPanelHeader studioToolbarHeader">
            <div><span>Review Workspace</span><strong>{selectedCampaign?.name || 'Select a campaign'}</strong></div>
            <div className="studioTabs">
              {(['brief', 'content', 'media', 'calendar', 'approval', 'analytics', 'connections'] as const).map((item) => (
                <button key={item} className={activeModule === item ? 'active' : ''} type="button" onClick={() => setActiveModule(item)}>{item}</button>
              ))}
            </div>
          </div>

          {activeModule === 'brief' && selectedCampaign && (
            <div className="studioModuleGrid studioModuleGridTwo">
              <article><span>Audience</span><p>{selectedCampaign.audience}</p></article>
              <article><span>Offer</span><p>{selectedCampaign.offer}</p></article>
              <article><span>Core message</span><p>{selectedCampaign.coreMessage}</p></article>
              <article><span>Brand pillar</span><p>{selectedCampaign.brandPillar}</p></article>
            </div>
          )}

          {activeModule === 'content' && <ContentQueue isGenerating={isGenerating} generationSource={generationSource} onGenerate={generateContentPackage} />}

          {activeModule === 'media' && <AssetLibrary assets={selectedAssets} />}

          {activeModule === 'calendar' && <ContentCalendar posts={selectedPosts} onUpdatePost={updatePost} />}

          {activeModule === 'approval' && <ApprovalQueue posts={selectedPosts} onUpdatePost={updatePost} />}

          {activeModule === 'analytics' && <AnalyticsPanel analytics={analytics} />}

          {activeModule === 'connections' && <ConnectionsPanel channels={channels} />}
        </section>

        <section className="studioPanel">
          <div className="studioPanelHeader"><span>Saved Content</span><strong>{selectedPosts.length} campaign assets.</strong></div>
          <div className="studioPostList">
            {selectedPosts.length ? selectedPosts.map((post) => (
              <article key={post.id}><span>{channelLabels[post.platform]} / {post.status}</span><p>{post.hook}</p><small>{post.hashtags.join(' ')}</small></article>
            )) : <p className="studioMuted">No posts saved for this campaign yet.</p>}
          </div>
        </section>

        <section className="studioPanel">
          <div className="studioPanelHeader"><span>Weekly Approval Workflow</span><strong>Review the week before anything is published.</strong></div>
          <div className="studioApprovalBox">
            <p>Approve copy, confirm graphic prompts, set schedule date and time, then mark the campaign ready. Publishing adapters handle platform-specific details.</p>
            <button className="btn" type="button" onClick={() => moveCampaignStatus('review')}>Move Campaign To Review</button>
            <button className="btn btnPrimary" type="button" onClick={() => moveCampaignStatus('approved')}>Mark Campaign Approved</button>
          </div>
        </section>
      </div>
    </div>
  );
}

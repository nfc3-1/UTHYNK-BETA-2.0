'use client';

import { useEffect, useMemo, useState } from 'react';

type StudioChannelId = 'linkedin' | 'facebook' | 'instagram' | 'threads';
type StudioStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'published';
type ApprovalDecision = 'needs_review' | 'approved' | 'revision';

type StudioChannel = {
  id: StudioChannelId;
  label: string;
  enabled: boolean;
  cadence: string;
  note: string;
};

type StudioCampaign = {
  id: string;
  name: string;
  objective: string;
  audience: string;
  offer: string;
  coreMessage: string;
  brandPillar: string;
  campaignType: string;
  landingPage: string;
  startDate: string;
  endDate: string;
  enabledChannels: StudioChannelId[];
  status: StudioStatus;
  createdAt: string;
};

type StudioPost = {
  id: string;
  campaignId: string;
  platform: StudioChannelId;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  caption: string;
  assetPrompt: string;
  graphicFormat: 'square' | 'portrait' | 'landscape';
  status: StudioStatus;
  scheduledFor: string;
  scheduledTime?: string;
  approvalDecision: ApprovalDecision;
  approvalNote: string;
  createdAt: string;
};

type StudioMediaAsset = {
  id: string;
  campaignId: string;
  title: string;
  assetType: 'graphic' | 'video' | 'screenshot' | 'template';
  prompt: string;
  format: 'square' | 'portrait' | 'landscape';
  status: 'needed' | 'prompt_ready' | 'in_progress' | 'ready';
  createdAt: string;
};

type StudioState = {
  campaigns: StudioCampaign[];
  posts: StudioPost[];
  assets: StudioMediaAsset[];
  channels: StudioChannel[];
};

const STORAGE_KEY = 'uthynk-studio-v2';

const defaultChannels: StudioChannel[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    enabled: true,
    cadence: 'Founder insight + beta proof',
    note: 'Best for founder narrative, investor credibility, and thoughtful product updates.',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    enabled: true,
    cadence: 'Practical explanation + community question',
    note: 'Best for approachable everyday reasoning examples and local/community shares.',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    enabled: true,
    cadence: 'Carousel, quote graphic, or reel prompt',
    note: 'Best for visual snapshots, simple before/after thinking moments, and short clips.',
  },
  {
    id: 'threads',
    label: 'Threads',
    enabled: true,
    cadence: 'Short thought + question loop',
    note: 'Best for quick hooks, debate prompts, and lightweight conversation starters.',
  },
];

const starterCampaigns: StudioCampaign[] = [
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
    enabledChannels: ['linkedin', 'facebook', 'instagram', 'threads'],
    status: 'draft',
    createdAt: new Date().toISOString(),
  },
];

const starterPosts: StudioPost[] = [
  {
    id: 'post-founder-note',
    campaignId: 'campaign-soft-launch',
    platform: 'linkedin',
    hook: 'Most people do not need another answer. They need a better way to notice what they missed.',
    body: 'UThynk is built around a simple loop: answer a real question, face a useful new perspective, then reflect on whether your thinking changed. The goal is not to tell people what to think. It is to help them catch the angle they would have skipped.',
    cta: 'Try a free UThynk reasoning challenge.',
    hashtags: ['#BetterThinking', '#CriticalThinking', '#UThynk'],
    caption: 'Founder note for soft launch.',
    assetPrompt: 'Premium dark-mode UThynk graphic showing a question transforming into a new perspective, with subtle gold and teal accents.',
    graphicFormat: 'landscape',
    status: 'draft',
    scheduledFor: '',
    approvalDecision: 'needs_review',
    approvalNote: '',
    createdAt: new Date().toISOString(),
  },
];

const starterAssets: StudioMediaAsset[] = [
  {
    id: 'asset-beta-snapshot',
    campaignId: 'campaign-soft-launch',
    title: 'Perspective Shift Snapshot',
    assetType: 'graphic',
    prompt: 'Create a premium UThynk social graphic: question, answer, perspective you may not have considered, and +20 insight XP. Dark navy interface, gold CTA, teal highlight.',
    format: 'square',
    status: 'prompt_ready',
    createdAt: new Date().toISOString(),
  },
];

const channelLabels: Record<StudioChannelId, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  threads: 'Threads',
};

const platformTone: Record<StudioChannelId, string> = {
  linkedin: 'professional and founder-led',
  facebook: 'plain-spoken and community-centered',
  instagram: 'visual, concise, and emotionally clear',
  threads: 'short, conversational, and discussion-ready',
};


function isStudioChannelId(value: unknown): value is StudioChannelId {
  return value === 'linkedin' || value === 'facebook' || value === 'instagram' || value === 'threads';
}

function normalizePlatform(value: unknown): StudioChannelId {
  const normalized = String(value || '').trim().toLowerCase();

  if (isStudioChannelId(normalized)) {
    return normalized;
  }

  if (normalized.includes('facebook')) return 'facebook';
  if (normalized.includes('instagram')) return 'instagram';
  if (normalized.includes('thread')) return 'threads';

  return 'linkedin';
}

function normalizeStatus(value: unknown): StudioStatus {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'approval') return 'review';
  if (
    normalized === 'draft' ||
    normalized === 'review' ||
    normalized === 'approved' ||
    normalized === 'scheduled' ||
    normalized === 'published'
  ) {
    return normalized;
  }

  return 'draft';
}

function normalizeText(value: unknown, fallback: string) {
  const text = String(value || '').trim();

  return text || fallback;
}

function normalizeHashtags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  const text = String(value || '').trim();

  return text ? text.split(/\s+/).filter(Boolean) : ['#UThynk'];
}

function normalizeCampaign(value: any, index: number): StudioCampaign {
  return {
    id: normalizeText(value?.id, `campaign-${index}`),
    name: normalizeText(value?.name, starterCampaigns[0].name),
    objective: normalizeText(value?.objective, starterCampaigns[0].objective),
    audience: normalizeText(value?.audience, starterCampaigns[0].audience),
    offer: normalizeText(value?.offer, starterCampaigns[0].offer),
    coreMessage: normalizeText(value?.coreMessage, value?.campaign_brief?.coreMessage || starterCampaigns[0].coreMessage),
    brandPillar: normalizeText(value?.brandPillar, starterCampaigns[0].brandPillar),
    campaignType: normalizeText(value?.campaignType, starterCampaigns[0].campaignType),
    landingPage: normalizeText(value?.landingPage, starterCampaigns[0].landingPage),
    startDate: String(value?.startDate || ''),
    endDate: String(value?.endDate || ''),
    enabledChannels: Array.isArray(value?.enabledChannels)
      ? value.enabledChannels.map(normalizePlatform)
      : defaultChannels.filter((channel) => channel.enabled).map((channel) => channel.id),
    status: normalizeStatus(value?.status),
    createdAt: normalizeText(value?.createdAt, new Date().toISOString()),
  };
}

function normalizePost(value: any, index: number, fallbackCampaignId: string): StudioPost {
  const platform = normalizePlatform(value?.platform);

  return {
    id: normalizeText(value?.id, `post-${index}`),
    campaignId: normalizeText(value?.campaignId, fallbackCampaignId),
    platform,
    hook: normalizeText(value?.hook, starterPosts[0].hook),
    body: normalizeText(value?.body, `Draft ${channelLabels[platform]} body for UThynk.`),
    cta: normalizeText(value?.cta, 'Try a free UThynk reasoning challenge.'),
    hashtags: normalizeHashtags(value?.hashtags),
    caption: normalizeText(value?.caption, `${channelLabels[platform]} content idea.`),
    assetPrompt: normalizeText(value?.assetPrompt, 'Create a premium UThynk social graphic with a question, missed perspective, and growth signal.'),
    graphicFormat: value?.graphicFormat === 'portrait' || value?.graphicFormat === 'landscape' ? value.graphicFormat : 'square',
    status: normalizeStatus(value?.status),
    scheduledFor: String(value?.scheduledFor || ''),
    scheduledTime: normalizeText(value?.scheduledTime, '8:00 AM'),
    approvalDecision: value?.approvalDecision === 'approved' || value?.approvalDecision === 'revision' ? value.approvalDecision : 'needs_review',
    approvalNote: String(value?.approvalNote || ''),
    createdAt: normalizeText(value?.createdAt, new Date().toISOString()),
  };
}

function normalizeAsset(value: any, index: number, fallbackCampaignId: string): StudioMediaAsset {
  return {
    id: normalizeText(value?.id, `asset-${index}`),
    campaignId: normalizeText(value?.campaignId, fallbackCampaignId),
    title: normalizeText(value?.title, 'UThynk media prompt'),
    assetType:
      value?.assetType === 'video' || value?.assetType === 'screenshot' || value?.assetType === 'template'
        ? value.assetType
        : 'graphic',
    prompt: normalizeText(value?.prompt, value?.generation_prompt || starterAssets[0].prompt),
    format: value?.format === 'portrait' || value?.format === 'landscape' ? value.format : 'square',
    status:
      value?.status === 'needed' || value?.status === 'in_progress' || value?.status === 'ready'
        ? value.status
        : 'prompt_ready',
    createdAt: normalizeText(value?.createdAt, new Date().toISOString()),
  };
}

function normalizeChannel(value: any): StudioChannel {
  const id = normalizePlatform(value?.id || value?.platform || value?.label);
  const fallback = defaultChannels.find((channel) => channel.id === id) || defaultChannels[0];

  return {
    ...fallback,
    enabled: typeof value?.enabled === 'boolean' ? value.enabled : fallback.enabled,
    cadence: normalizeText(value?.cadence, fallback.cadence),
    note: normalizeText(value?.note || value?.notes, fallback.note),
  };
}
function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
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
    `The strongest answer is usually hiding one question you did not ask.`,
    `What if better thinking is less about being right and more about noticing what you missed?`,
    `A good reasoning challenge should make you pause, not perform.`,
    `Before you defend your answer, UThynk asks you to test the angle you skipped.`,
  ];
  const hook = hookOptions[index % hookOptions.length];

  return {
    id: makeId('post'),
    campaignId: campaign.id,
    platform,
    hook,
    body:
      `${campaign.coreMessage}\n\nFor ${label}, keep the message ${tone}. Start with a real-life decision, show the missing perspective, then invite the audience to try one challenge instead of promising instant wisdom.\n\nCampaign objective: ${campaign.objective}`,
    cta: campaign.offer || 'Try a free UThynk reasoning challenge.',
    hashtags: platform === 'threads' ? ['#UThynk'] : ['#UThynk', '#BetterThinking', '#Reasoning'],
    caption: `${label} variant for ${campaign.name}`,
    assetPrompt:
      `Create a ${platform === 'instagram' ? 'portrait carousel cover' : 'premium social graphic'} for UThynk. Theme: ${campaign.brandPillar}. Show a simple question, a missed perspective, and a small growth signal. Use dark navy, restrained gold, and teal accent. No clutter.`,
    graphicFormat: platform === 'instagram' ? 'portrait' : platform === 'linkedin' ? 'landscape' : 'square',
    status: 'draft',
    scheduledFor: todayOffset(index + 1),
    scheduledTime: ['8:00 AM', '11:30 AM', '5:00 PM', '7:30 PM'][index % 4],
    approvalDecision: 'needs_review',
    approvalNote: '',
    createdAt: new Date().toISOString(),
  };
}

function buildVideoAsset(campaign: StudioCampaign): StudioMediaAsset {
  return {
    id: makeId('asset-video'),
    campaignId: campaign.id,
    title: '30-second beta explainer storyboard',
    assetType: 'video',
    prompt:
      `Brand video plan for ${campaign.name}: Scene 1, show someone answering a real question. Scene 2, UThynk reveals a perspective they missed. Scene 3, show insight XP and a thinking snapshot. Scene 4, CTA: ${campaign.offer}. Tone should be premium, calm, and practical.`,
    format: 'portrait',
    status: 'prompt_ready',
    createdAt: new Date().toISOString(),
  };
}

function normalizeState(parsed: Partial<StudioState>): StudioState {
  const campaigns = Array.isArray(parsed.campaigns) && parsed.campaigns.length
    ? parsed.campaigns.map(normalizeCampaign)
    : starterCampaigns;
  const fallbackCampaignId = campaigns[0]?.id || starterCampaigns[0].id;

  return {
    campaigns,
    posts: Array.isArray(parsed.posts) && parsed.posts.length
      ? parsed.posts.map((post, index) => normalizePost(post, index, fallbackCampaignId))
      : starterPosts,
    assets: Array.isArray(parsed.assets) && parsed.assets.length
      ? parsed.assets.map((asset, index) => normalizeAsset(asset, index, fallbackCampaignId))
      : starterAssets,
    channels: Array.isArray(parsed.channels) && parsed.channels.length
      ? parsed.channels.map(normalizeChannel)
      : defaultChannels,
  };
}

export default function StudioDashboard() {
  const [campaigns, setCampaigns] = useState<StudioCampaign[]>(starterCampaigns);
  const [posts, setPosts] = useState<StudioPost[]>(starterPosts);
  const [assets, setAssets] = useState<StudioMediaAsset[]>(starterAssets);
  const [channels, setChannels] = useState<StudioChannel[]>(defaultChannels);
  const [selectedCampaignId, setSelectedCampaignId] = useState(starterCampaigns[0]?.id || '');
  const [activeModule, setActiveModule] = useState<'brief' | 'content' | 'media' | 'calendar' | 'approval' | 'analytics'>('brief');
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
  const [hydrated, setHydrated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] = useState<'openai' | 'fallback' | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('uthynk-studio-v1');

    if (stored) {
      try {
        const nextState = normalizeState(JSON.parse(stored));
        setCampaigns(nextState.campaigns);
        setPosts(nextState.posts);
        setAssets(nextState.assets);
        setChannels(nextState.channels);
        setSelectedCampaignId(nextState.campaigns[0]?.id || starterCampaigns[0]?.id || '');
      } catch {
        setCampaigns(starterCampaigns);
        setPosts(starterPosts);
        setAssets(starterAssets);
        setChannels(defaultChannels);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        campaigns,
        posts,
        assets,
        channels,
      })
    );
  }, [assets, campaigns, channels, hydrated, posts]);

  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) || campaigns[0];
  const selectedPosts = posts.filter((post) => post.campaignId === selectedCampaign?.id);
  const selectedAssets = assets.filter((asset) => asset.campaignId === selectedCampaign?.id);
  const activeChannels = channels.filter((channel) => channel.enabled);
  const enabledPlatforms = selectedCampaign?.enabledChannels?.length
    ? selectedCampaign.enabledChannels
    : activeChannels.map((channel) => channel.id);
  const reviewPosts = posts.filter((post) => post.approvalDecision !== 'approved' || post.status === 'review');
  const missingAssets = assets.filter((asset) => asset.status === 'needed' || asset.status === 'prompt_ready');
  const scheduledPosts = posts.filter((post) => post.status === 'scheduled' || post.scheduledFor);
  const firstScheduled = scheduledPosts
    .slice()
    .sort((a, b) => `${a.scheduledFor} ${a.scheduledTime || ''}`.localeCompare(`${b.scheduledFor} ${b.scheduledTime || ''}`))[0];

  const analytics = useMemo(
    () => [
      { label: 'Active channels', value: activeChannels.length, detail: 'LinkedIn, Facebook, Instagram, Threads registry' },
      { label: 'Posts generated', value: posts.length, detail: 'Drafts, review items, and scheduled packets' },
      { label: 'Review queue', value: posts.filter((item) => item.status === 'review' || item.approvalDecision === 'needs_review').length, detail: 'Items waiting for Nick approval' },
      { label: 'Ready assets', value: assets.filter((item) => item.status === 'ready' || item.status === 'prompt_ready').length, detail: 'Graphic, video, and template prompts' },
    ],
    [activeChannels.length, assets, posts]
  );

  function updateCampaignDraft(key: keyof typeof campaignDraft, value: string) {
    setCampaignDraft((current) => ({ ...current, [key]: value }));
  }

  function createCampaign() {
    if (!campaignDraft.name.trim()) return;

    const nextCampaign: StudioCampaign = {
      id: makeId('campaign'),
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

    setCampaigns((current) => [nextCampaign, ...current]);
    setAssets((current) => [buildVideoAsset(nextCampaign), ...current]);
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
    setChannels((current) =>
      current.map((channel) =>
        channel.id === id ? { ...channel, enabled: !channel.enabled } : channel
      )
    );
  }

  async function generateContentPackage() {
    if (!selectedCampaign) return;

    const platforms: StudioChannelId[] = enabledPlatforms.length ? enabledPlatforms : ['linkedin'];
    setIsGenerating(true);

    try {
      const response = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: selectedCampaign.objective,
          audience: selectedCampaign.audience,
          source: selectedCampaign.coreMessage,
          duration: 'one week',
          channels: platforms,
          campaignName: selectedCampaign.name,
        }),
      });

      if (!response.ok) throw new Error('Studio generation failed');

      const generated = await response.json();
      const now = new Date().toISOString();
      const newPosts: StudioPost[] = Array.isArray(generated.posts)
        ? generated.posts.map((post: any, index: number) => ({
            id: makeId('post'),
            campaignId: selectedCampaign.id,
            platform: normalizePlatform(post.platform),
            hook: normalizeText(post.hook, 'A better answer starts with a better question.'),
            body: normalizeText(post.body, 'UThynk helps people see the perspective they had not considered.'),
            cta: normalizeText(post.cta, selectedCampaign.offer),
            hashtags: normalizeHashtags(post.hashtags),
            caption: normalizeText(post.caption, 'UThynk campaign draft.'),
            assetPrompt: normalizeText(post.assetPrompt, 'Create a premium UThynk visual for this post.'),
            graphicFormat: normalizePlatform(post.platform) === 'instagram' ? 'portrait' : normalizePlatform(post.platform) === 'linkedin' ? 'landscape' : 'square',
            status: 'review',
            scheduledFor: todayOffset(index + 1),
            scheduledTime: normalizeText(post.suggestedTime, '8:00 AM'),
            approvalDecision: 'needs_review',
            approvalNote: '',
            createdAt: now,
          }))
        : platforms.map((platform, index) => buildPost(selectedCampaign, platform, index));
      const newAssets: StudioMediaAsset[] = Array.isArray(generated.assets)
        ? generated.assets.map((asset: any, index: number) => ({
            id: makeId('asset'),
            campaignId: selectedCampaign.id,
            title: normalizeText(asset.title, `Campaign asset ${index + 1}`),
            assetType: asset.assetType === 'video' ? 'video' : 'graphic',
            prompt: normalizeText(asset.prompt, 'Create a premium UThynk campaign visual.'),
            format: asset.format === 'portrait' || asset.format === 'landscape' ? asset.format : 'square',
            status: 'prompt_ready',
            createdAt: now,
          }))
        : [buildVideoAsset(selectedCampaign)];

      setPosts((current) => [...newPosts, ...current]);
      setAssets((current) => [...newAssets, ...current]);
      setGenerationSource(generated.source === 'openai' ? 'openai' : 'fallback');
    } catch {
      const newPosts = platforms.map((platform, index) => buildPost(selectedCampaign, platform, index));
      setPosts((current) => [...newPosts, ...current]);
      setAssets((current) => [buildVideoAsset(selectedCampaign), ...current]);
      setGenerationSource('fallback');
    } finally {
      setIsGenerating(false);
      setActiveModule('approval');
    }
  }

  function updatePost(id: string, patch: Partial<StudioPost>) {
    setPosts((current) => current.map((post) => (post.id === id ? { ...post, ...patch } : post)));
  }

  function moveCampaignStatus(status: StudioStatus) {
    if (!selectedCampaign) return;

    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === selectedCampaign.id ? { ...campaign, status } : campaign
      )
    );
  }

  return (
    <>
    <section className="studioCommandCenter">
      <div>
        <p className="studioEyebrow">This Week at UThynk</p>
        <h2>{selectedCampaign?.name || 'Weekly campaign workspace'}</h2>
        <span>{firstScheduled ? `First post scheduled ${firstScheduled.scheduledFor} at ${firstScheduled.scheduledTime || '8:00 AM'}.` : 'Build next week, review the queue, approve the strongest pieces, then schedule.'}</span>
      </div>
      <button className="btn btnPrimary" type="button" onClick={generateContentPackage} disabled={isGenerating}>
        {isGenerating ? 'Building Campaign...' : "Build Next Week's Campaign"}
      </button>
    </section>
    <section className="studioWeekStats">
      <article><strong>{posts.length}</strong><span>Posts prepared</span><small>Across active campaigns</small></article>
      <article><strong>{activeChannels.length}</strong><span>Platforms active</span><small>{activeChannels.map((channel) => channel.label).join(', ')}</small></article>
      <article><strong>{reviewPosts.length}</strong><span>Need approval</span><small>Copy or visuals waiting on Nick</small></article>
      <article><strong>{missingAssets.length}</strong><span>Assets missing</span><small>Prompts ready or files needed</small></article>
    </section>
    <div className="studioGrid studioGridExpanded">
      <section className="studioPanel studioControlPanel">
        <div className="studioPanelHeader">
          <span>Channel Registry</span>
          <strong>Active launch destinations.</strong>
        </div>
        <div className="studioChannelList">
          {channels.map((channel) => (
            <button
              key={channel.id}
              className={channel.enabled ? 'enabled' : ''}
              type="button"
              onClick={() => toggleChannel(channel.id)}
            >
              <span>{channel.enabled ? 'Enabled' : 'Paused'}</span>
              <strong>{channel.label}</strong>
              <small>{channel.cadence}</small>
            </button>
          ))}
        </div>
        <p className="studioMuted studioInlineNote">Later channels stay out of the active workflow until Nick turns them on.</p>
      </section>

      <section className="studioPanel studioWidePanel">
        <div className="studioPanelHeader">
          <span>Campaign Brief</span>
          <strong>Advanced brief details. Start with the weekly builder, then refine here.</strong>
        </div>
        <div className="studioFormGrid">
          <label className="studioField">
            <span>Campaign name</span>
            <input value={campaignDraft.name} onChange={(event) => updateCampaignDraft('name', event.target.value)} placeholder="Weekend beta launch" />
          </label>
          <label className="studioField">
            <span>Audience</span>
            <input value={campaignDraft.audience} onChange={(event) => updateCampaignDraft('audience', event.target.value)} placeholder="Parents, students, curious professionals" />
          </label>
          <label className="studioField studioFullField">
            <span>Objective</span>
            <textarea value={campaignDraft.objective} onChange={(event) => updateCampaignDraft('objective', event.target.value)} placeholder="What should this campaign make people understand, feel, or do?" />
          </label>
          <label className="studioField">
            <span>Offer / CTA</span>
            <input value={campaignDraft.offer} onChange={(event) => updateCampaignDraft('offer', event.target.value)} placeholder="Try three free reasoning challenges" />
          </label>
          <label className="studioField">
            <span>Brand pillar</span>
            <input value={campaignDraft.brandPillar} onChange={(event) => updateCampaignDraft('brandPillar', event.target.value)} placeholder="Perspective expansion" />
          </label>
          <label className="studioField studioFullField">
            <span>Core message</span>
            <textarea value={campaignDraft.coreMessage} onChange={(event) => updateCampaignDraft('coreMessage', event.target.value)} placeholder="The single idea every channel should repeat." />
          </label>
        </div>
        <button className="btn btnPrimary" type="button" onClick={createCampaign}>Save Campaign Brief</button>
      </section>

      <section className="studioPanel">
        <div className="studioPanelHeader">
          <span>Saved Campaigns</span>
          <strong>Campaigns created from weekly goals.</strong>
        </div>
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
          <div>
            <span>Review Workspace</span>
            <strong>{selectedCampaign?.name || 'Select a campaign'}</strong>
          </div>
          <div className="studioTabs">
            {(['brief', 'content', 'media', 'calendar', 'approval', 'analytics'] as const).map((item) => (
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

        {activeModule === 'content' && (
          <div className="studioApprovalBox">
            <p>Build a full week from the selected campaign goal. Studio will call the generation route, then place the drafts directly into review.</p>
            <button className="btn btnPrimary" type="button" onClick={generateContentPackage} disabled={isGenerating}>{isGenerating ? 'Building Campaign...' : 'Generate The Week'}</button>
            {generationSource && <p className="studioMuted studioInlineNote">Last generation source: {generationSource === 'openai' ? 'AI generation route' : 'local backup draft'}.</p>}
          </div>
        )}

        {activeModule === 'media' && (
          <div className="studioPostList">
            {selectedAssets.map((asset) => (
              <article key={asset.id}>
                <span>{asset.assetType} / {asset.status} / {asset.format}</span>
                <strong>{asset.title}</strong>
                <p>{asset.prompt}</p>
              </article>
            ))}
          </div>
        )}

        {activeModule === 'calendar' && (
          <div className="studioPostList">
            {selectedPosts.map((post) => (
              <article key={post.id}>
                <span>{channelLabels[post.platform]} / {post.status}</span>
                <label className="studioField compactField">
                  <span>Scheduled date</span>
                  <input type="date" value={post.scheduledFor} onChange={(event) => updatePost(post.id, { scheduledFor: event.target.value, status: event.target.value ? 'scheduled' : post.status })} />
                </label>
                <p>{post.hook}</p>
              </article>
            ))}
          </div>
        )}

        {activeModule === 'approval' && (
          <div className="studioPostList">
            {selectedPosts.map((post) => (
              <article key={post.id}>
                <span>{channelLabels[post.platform]} / {post.approvalDecision}</span>
                <strong>{post.hook}</strong>
                <p>{post.body}</p>
                <div className="studioPreviewMock">
                  <span>{channelLabels[post.platform]} preview</span>
                  <strong>{post.assetPrompt}</strong>
                </div>
                <p><b>CTA:</b> {post.cta}</p>
                <p><b>Asset prompt:</b> {post.assetPrompt}</p>
                <div className="studioApprovalActions">
                  <button className="btn" type="button" onClick={() => updatePost(post.id, { approvalDecision: 'approved', status: 'approved' })}>Approve</button>
                  <button className="btn" type="button" onClick={() => updatePost(post.id, { approvalDecision: 'revision', status: 'review' })}>Needs Revision</button>
                </div>
                <label className="studioField compactField">
                  <span>Revision notes</span>
                  <textarea value={post.approvalNote} onChange={(event) => updatePost(post.id, { approvalNote: event.target.value })} placeholder="What should change before this goes out?" />
                </label>
              </article>
            ))}
          </div>
        )}

        {activeModule === 'analytics' && (
          <div className="studioAnalyticsGrid studioAnalyticsGridFour">
            {analytics.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="studioPanel">
        <div className="studioPanelHeader">
          <span>Saved Content</span>
          <strong>{selectedPosts.length} campaign assets.</strong>
        </div>
        <div className="studioPostList">
          {selectedPosts.length ? selectedPosts.map((post) => (
            <article key={post.id}>
              <span>{channelLabels[post.platform]} / {post.status}</span>
              <p>{post.hook}</p>
              <small>{post.hashtags.join(' ')}</small>
            </article>
          )) : <p className="studioMuted">No posts saved for this campaign yet.</p>}
        </div>
      </section>

      <section className="studioPanel">
        <div className="studioPanelHeader">
          <span>Weekly Approval Workflow</span>
          <strong>Review the week before anything is published.</strong>
        </div>
        <div className="studioApprovalBox">
          <p>Approve copy, confirm graphic prompts, set schedule dates, then mark the campaign ready. No platform tokens are stored here.</p>
          <button className="btn" type="button" onClick={() => moveCampaignStatus('review')}>Move Campaign To Review</button>
          <button className="btn btnPrimary" type="button" onClick={() => moveCampaignStatus('approved')}>Mark Campaign Approved</button>
        </div>
      </section>
    </div>
    </>
  );
}






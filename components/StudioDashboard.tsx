'use client';

import { useEffect, useMemo, useState } from 'react';

type StudioCampaign = {
  id: string;
  name: string;
  objective: string;
  channel: string;
  status: 'draft' | 'approval' | 'ready';
  createdAt: string;
};

type StudioPost = {
  id: string;
  campaignId: string;
  platform: string;
  hook: string;
  status: 'idea' | 'draft' | 'approval';
  createdAt: string;
};

type StudioState = {
  campaigns: StudioCampaign[];
  posts: StudioPost[];
};

const STORAGE_KEY = 'uthynk-studio-v1';

const starterCampaigns: StudioCampaign[] = [
  {
    id: 'campaign-soft-launch',
    name: 'Soft Launch Perspective Campaign',
    objective: 'Show that UThynk helps people see what they had not considered.',
    channel: 'LinkedIn / X / Short video',
    status: 'draft',
    createdAt: new Date().toISOString(),
  },
];

const starterPosts: StudioPost[] = [
  {
    id: 'post-founder-note',
    campaignId: 'campaign-soft-launch',
    platform: 'LinkedIn',
    hook: 'Most people do not need another answer. They need a better way to notice what they missed.',
    status: 'idea',
    createdAt: new Date().toISOString(),
  },
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function StudioDashboard() {
  const [campaigns, setCampaigns] = useState<StudioCampaign[]>(starterCampaigns);
  const [posts, setPosts] = useState<StudioPost[]>(starterPosts);
  const [selectedCampaignId, setSelectedCampaignId] = useState(starterCampaigns[0]?.id || '');
  const [campaignName, setCampaignName] = useState('');
  const [campaignObjective, setCampaignObjective] = useState('');
  const [postHook, setPostHook] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StudioState;
        setCampaigns(parsed.campaigns?.length ? parsed.campaigns : starterCampaigns);
        setPosts(parsed.posts?.length ? parsed.posts : starterPosts);
        setSelectedCampaignId(parsed.campaigns?.[0]?.id || starterCampaigns[0]?.id || '');
      } catch {
        setCampaigns(starterCampaigns);
        setPosts(starterPosts);
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
      })
    );
  }, [campaigns, hydrated, posts]);

  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) || campaigns[0];
  const selectedPosts = posts.filter((post) => post.campaignId === selectedCampaign?.id);
  const analytics = useMemo(
    () => [
      { label: 'Draft campaigns', value: campaigns.filter((item) => item.status === 'draft').length },
      { label: 'Posts in approval', value: posts.filter((item) => item.status === 'approval').length },
      { label: 'Ready assets', value: campaigns.filter((item) => item.status === 'ready').length },
    ],
    [campaigns, posts]
  );

  function createCampaign() {
    if (!campaignName.trim()) return;

    const nextCampaign: StudioCampaign = {
      id: makeId('campaign'),
      name: campaignName.trim(),
      objective: campaignObjective.trim() || 'Clarify the UThynk story and move the audience toward one action.',
      channel: 'Multi-channel',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    setCampaigns((current) => [nextCampaign, ...current]);
    setSelectedCampaignId(nextCampaign.id);
    setCampaignName('');
    setCampaignObjective('');
  }

  function createPost() {
    if (!selectedCampaign || !postHook.trim()) return;

    const nextPost: StudioPost = {
      id: makeId('post'),
      campaignId: selectedCampaign.id,
      platform,
      hook: postHook.trim(),
      status: 'idea',
      createdAt: new Date().toISOString(),
    };

    setPosts((current) => [nextPost, ...current]);
    setPostHook('');
  }

  function moveCampaignToApproval() {
    if (!selectedCampaign) return;

    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === selectedCampaign.id ? { ...campaign, status: 'approval' } : campaign
      )
    );
  }

  return (
    <div className="studioGrid">
      <section className="studioPanel studioControlPanel">
        <div className="studioPanelHeader">
          <span>Campaign Planning</span>
          <strong>Create and organize launch narratives.</strong>
        </div>

        <label className="studioField">
          <span>Campaign name</span>
          <input
            value={campaignName}
            onChange={(event) => setCampaignName(event.target.value)}
            placeholder="Founder-led beta launch"
          />
        </label>

        <label className="studioField">
          <span>Objective</span>
          <textarea
            value={campaignObjective}
            onChange={(event) => setCampaignObjective(event.target.value)}
            placeholder="What should this campaign make people understand, feel, or do?"
          />
        </label>

        <button className="btn btnPrimary" type="button" onClick={createCampaign}>
          Save Campaign
        </button>
      </section>

      <section className="studioPanel">
        <div className="studioPanelHeader">
          <span>Saved Campaigns</span>
          <strong>Private planning workspace.</strong>
        </div>

        <div className="studioCampaignList">
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              className={selectedCampaign?.id === campaign.id ? 'active' : ''}
              type="button"
              onClick={() => setSelectedCampaignId(campaign.id)}
            >
              <span>{campaign.status}</span>
              <strong>{campaign.name}</strong>
              <small>{campaign.objective}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="studioPanel studioWidePanel">
        <div className="studioPanelHeader">
          <span>Brand Video Module</span>
          <strong>Plan the story before generating assets.</strong>
        </div>
        <div className="studioModuleGrid">
          <article>
            <span>Core message</span>
            <p>UThynk helps users notice the perspective they had not considered.</p>
          </article>
          <article>
            <span>Founder angle</span>
            <p>Nick as builder/operator, turning reasoning training into a practical daily habit.</p>
          </article>
          <article>
            <span>Next asset</span>
            <p>30-45 second beta explainer: question, answer, perspective shift, growth snapshot.</p>
          </article>
        </div>
      </section>

      <section className="studioPanel">
        <div className="studioPanelHeader">
          <span>Content Generation</span>
          <strong>Draft hooks tied to the selected campaign.</strong>
        </div>

        <label className="studioField">
          <span>Platform</span>
          <select value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option>LinkedIn</option>
            <option>X</option>
            <option>TikTok</option>
            <option>YouTube Shorts</option>
            <option>Email</option>
          </select>
        </label>

        <label className="studioField">
          <span>Post hook</span>
          <textarea
            value={postHook}
            onChange={(event) => setPostHook(event.target.value)}
            placeholder="Write the first line or campaign idea."
          />
        </label>

        <button className="btn btnPrimary" type="button" onClick={createPost}>
          Save Post Idea
        </button>
      </section>

      <section className="studioPanel">
        <div className="studioPanelHeader">
          <span>Saved Posts</span>
          <strong>{selectedCampaign?.name || 'Select a campaign'}</strong>
        </div>

        <div className="studioPostList">
          {selectedPosts.length ? (
            selectedPosts.map((post) => (
              <article key={post.id}>
                <span>{post.platform} / {post.status}</span>
                <p>{post.hook}</p>
              </article>
            ))
          ) : (
            <p className="studioMuted">No posts saved for this campaign yet.</p>
          )}
        </div>
      </section>

      <section className="studioPanel">
        <div className="studioPanelHeader">
          <span>Analytics</span>
          <strong>Basic operating signals.</strong>
        </div>
        <div className="studioAnalyticsGrid">
          {analytics.map((item) => (
            <div key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="studioPanel">
        <div className="studioPanelHeader">
          <span>Weekly Approval Workflow</span>
          <strong>Placeholder for Nick's review loop.</strong>
        </div>
        <div className="studioApprovalBox">
          <p>Review campaign plan, approve content queue, confirm media assets, then schedule distribution.</p>
          <button className="btn" type="button" onClick={moveCampaignToApproval}>
            Move Selected Campaign To Approval
          </button>
        </div>
      </section>
    </div>
  );
}

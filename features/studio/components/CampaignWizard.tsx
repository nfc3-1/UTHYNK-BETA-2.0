'use client';

import type { StudioCampaign } from '@/features/studio/types/studio';

type CampaignDraft = Pick<
  StudioCampaign,
  'name' | 'objective' | 'audience' | 'offer' | 'coreMessage' | 'brandPillar' | 'campaignType' | 'landingPage' | 'startDate' | 'endDate'
>;

type CampaignWizardProps = {
  campaignDraft: CampaignDraft;
  onChange: (key: keyof CampaignDraft, value: string) => void;
  onCreate: () => void;
};

export default function CampaignWizard({ campaignDraft, onChange, onCreate }: CampaignWizardProps) {
  return (
    <section className="studioPanel studioWidePanel">
      <div className="studioPanelHeader">
        <span>Campaign Brief</span>
        <strong>Advanced brief details. Start with the weekly builder, then refine here.</strong>
      </div>
      <div className="studioFormGrid">
        <label className="studioField"><span>Campaign name</span><input value={campaignDraft.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Weekend beta launch" /></label>
        <label className="studioField"><span>Audience</span><input value={campaignDraft.audience} onChange={(event) => onChange('audience', event.target.value)} placeholder="Parents, students, curious professionals" /></label>
        <label className="studioField studioFullField"><span>Objective</span><textarea value={campaignDraft.objective} onChange={(event) => onChange('objective', event.target.value)} placeholder="What should this campaign make people understand, feel, or do?" /></label>
        <label className="studioField"><span>Offer / CTA</span><input value={campaignDraft.offer} onChange={(event) => onChange('offer', event.target.value)} placeholder="Try three free reasoning challenges" /></label>
        <label className="studioField"><span>Brand pillar</span><input value={campaignDraft.brandPillar} onChange={(event) => onChange('brandPillar', event.target.value)} placeholder="Perspective expansion" /></label>
        <label className="studioField studioFullField"><span>Core message</span><textarea value={campaignDraft.coreMessage} onChange={(event) => onChange('coreMessage', event.target.value)} placeholder="The single idea every channel should repeat." /></label>
      </div>
      <button className="btn btnPrimary" type="button" onClick={onCreate}>Save Campaign Brief</button>
    </section>
  );
}

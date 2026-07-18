export type StudioChannelId = 'linkedin' | 'facebook' | 'instagram' | 'threads' | 'x';

export type StudioStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'retrying';

export type ApprovalDecision = 'needs_review' | 'approved' | 'revision';

export type StudioAssetStatus = 'needed' | 'prompt_ready' | 'in_progress' | 'ready' | 'approved';
export type StudioAssetType = 'graphic' | 'video' | 'screenshot' | 'template';
export type StudioGraphicFormat = 'square' | 'portrait' | 'landscape';

export type StudioChannel = {
  id: StudioChannelId;
  label: string;
  enabled: boolean;
  cadence: string;
  note: string;
  connectionStatus?: 'not_connected' | 'pending' | 'pending_token_exchange' | 'connected' | 'expired' | 'error';
  accountLabel?: string;
};

export type StudioCampaign = {
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

export type StudioPost = {
  id: string;
  campaignId: string;
  platform: StudioChannelId;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  caption: string;
  assetPrompt: string;
  graphicFormat: StudioGraphicFormat;
  status: StudioStatus;
  scheduledFor: string;
  scheduledTime?: string;
  scheduledTimezone?: string;
  approvalDecision: ApprovalDecision;
  approvalNote: string;
  publishingError?: string;
  publishedAt?: string;
  createdAt: string;
};

export type StudioMediaAsset = {
  id: string;
  campaignId: string;
  postId?: string;
  title: string;
  assetType: StudioAssetType;
  prompt: string;
  format: StudioGraphicFormat;
  status: StudioAssetStatus;
  fileUrl?: string;
  thumbnailUrl?: string;
  storagePath?: string;
  altText?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  version?: number;
  createdAt: string;
};

export type StudioMetric = {
  id: string;
  campaignId?: string;
  postId?: string;
  platform?: StudioChannelId;
  metricType: string;
  metricValue: number;
  occurredAt: string;
};

export type StudioState = {
  campaigns: StudioCampaign[];
  posts: StudioPost[];
  assets: StudioMediaAsset[];
  channels: StudioChannel[];
  metrics: StudioMetric[];
};

export type StudioGenerateRequest = {
  objective: string;
  audience: string;
  sourceQuestion: string;
  enabledChannels: StudioChannelId[];
  cadence: string;
  previousApprovedContent: StudioPost[];
  brandRules: string[];
  recentPerformanceSignals: StudioMetric[];
  campaignName?: string;
  offer?: string;
};

export type StudioGeneratedPackage = {
  source: 'openai' | 'fallback';
  campaign?: Partial<StudioCampaign>;
  posts: Array<Pick<StudioPost, 'platform' | 'hook' | 'body' | 'cta' | 'hashtags' | 'caption' | 'assetPrompt'> & {
    suggestedDay?: string;
    suggestedTime?: string;
  }>;
  assets: Array<Pick<StudioMediaAsset, 'title' | 'assetType' | 'prompt' | 'format'>>;
};

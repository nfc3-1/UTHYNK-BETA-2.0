import { randomUUID } from 'crypto';
import type { StudioChannelId, StudioMetric, StudioPost } from '@/features/studio/types/studio';
import { getServerEnv } from '@/lib/serverEnv';

export type PublishResult = {
  provider: StudioChannelId;
  externalPostId?: string;
  publishedAt?: string;
  status: 'published' | 'failed' | 'retrying';
  error?: string;
};

export type PostMetrics = {
  postId: string;
  metrics: StudioMetric[];
};

export interface PublishingProvider {
  connect(): Promise<void>;
  refreshToken(): Promise<void>;
  publishPost(post: StudioPost): Promise<PublishResult>;
  getMetrics(postId: string): Promise<PostMetrics>;
}

export type ProviderOAuthConfig = {
  provider: StudioChannelId;
  configured: boolean;
  authorizationUrl?: string;
  callbackUrl: string;
  missing: string[];
  state: string;
  scopes: string[];
};

const providerScopes: Record<StudioChannelId, string[]> = {
  facebook: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
  instagram: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
  linkedin: ['openid', 'profile', 'w_member_social'],
  threads: ['threads_basic', 'threads_content_publish'],
  x: [],
};

function oauthCallbackUrl(provider: StudioChannelId) {
  const env = getServerEnv();
  return `${env.appPublicUrl.replace(/\/$/, '')}/api/studio/connections/${provider}/callback`;
}

function appendParams(baseUrl: string, params: Record<string, string>) {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

export function createProviderOAuthConfig(provider: StudioChannelId, state = randomUUID()): ProviderOAuthConfig {
  const env = getServerEnv();
  const callbackUrl = oauthCallbackUrl(provider);
  const scopes = providerScopes[provider];

  if (provider === 'facebook' || provider === 'instagram') {
    const missing = [
      env.metaAppId ? '' : 'META_APP_ID',
      env.metaAppSecret ? '' : 'META_APP_SECRET',
    ].filter(Boolean);

    return {
      provider,
      configured: missing.length === 0,
      callbackUrl,
      missing,
      state,
      scopes,
      authorizationUrl: missing.length ? undefined : appendParams('https://www.facebook.com/v20.0/dialog/oauth', {
        client_id: env.metaAppId || '',
        redirect_uri: callbackUrl,
        response_type: 'code',
        state,
        scope: scopes.join(','),
      }),
    };
  }

  if (provider === 'linkedin') {
    const missing = [
      env.linkedinClientId ? '' : 'LINKEDIN_CLIENT_ID',
      env.linkedinClientSecret ? '' : 'LINKEDIN_CLIENT_SECRET',
    ].filter(Boolean);

    return {
      provider,
      configured: missing.length === 0,
      callbackUrl,
      missing,
      state,
      scopes,
      authorizationUrl: missing.length ? undefined : appendParams('https://www.linkedin.com/oauth/v2/authorization', {
        client_id: env.linkedinClientId || '',
        redirect_uri: callbackUrl,
        response_type: 'code',
        state,
        scope: scopes.join(' '),
      }),
    };
  }

  if (provider === 'threads') {
    const missing = [
      env.threadsClientId ? '' : 'THREADS_CLIENT_ID',
      env.threadsClientSecret ? '' : 'THREADS_CLIENT_SECRET',
    ].filter(Boolean);

    return {
      provider,
      configured: missing.length === 0,
      callbackUrl,
      missing,
      state,
      scopes,
      authorizationUrl: missing.length ? undefined : appendParams('https://threads.net/oauth/authorize', {
        client_id: env.threadsClientId || '',
        redirect_uri: callbackUrl,
        response_type: 'code',
        state,
        scope: scopes.join(','),
      }),
    };
  }

  return {
    provider,
    configured: false,
    callbackUrl,
    missing: ['Unsupported publishing provider'],
    state,
    scopes,
  };
}

class UnconfiguredPublishingProvider implements PublishingProvider {
  constructor(private readonly provider: StudioChannelId) {}

  async connect() {
    throw new Error(`${this.provider} OAuth is not configured yet.`);
  }

  async refreshToken() {
    throw new Error(`${this.provider} token refresh is not configured yet.`);
  }

  async publishPost(): Promise<PublishResult> {
    return {
      provider: this.provider,
      status: 'failed',
      error: `${this.provider} publishing adapter is not configured yet.`,
    };
  }

  async getMetrics(postId: string): Promise<PostMetrics> {
    return { postId, metrics: [] };
  }
}

export function createPublishingProvider(provider: StudioChannelId): PublishingProvider {
  return new UnconfiguredPublishingProvider(provider);
}

export const publishingProviders: Record<StudioChannelId, PublishingProvider> = {
  facebook: createPublishingProvider('facebook'),
  instagram: createPublishingProvider('instagram'),
  linkedin: createPublishingProvider('linkedin'),
  threads: createPublishingProvider('threads'),
  x: createPublishingProvider('x'),
};

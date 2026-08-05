import { NextResponse } from 'next/server';
import { activeChannelIds } from '@/features/studio/data/channelRegistry';
import { createProviderOAuthConfig } from '@/features/studio/services/publishingService';
import { getStudioAccess } from '@/lib/studioAuth';
import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';

function unauthorized(reason: 'unauthenticated' | 'not_admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: reason === 'unauthenticated' ? 401 : 403 });
}

export async function GET() {
  const access = await getStudioAccess();

  if (access.allowed !== true) {
    return unauthorized(access.reason);
  }

  const connectionRows = hasSupabaseAdminEnv() && supabaseAdmin
    ? await supabaseAdmin.from('studio_platform_connections').select('*').order('platform', { ascending: true })
    : { data: [] };

  const rowsByPlatform = new Map((connectionRows.data || []).map((row: any) => [row.platform, row]));

  return NextResponse.json({
    connections: activeChannelIds.map((platform) => {
      const row = rowsByPlatform.get(platform);
      const oauth = createProviderOAuthConfig(platform);

      return {
        platform,
        accountId: row?.account_id || null,
        accountName: row?.account_name || null,
        accountLabel: row?.account_label || null,
        connectionStatus: row?.connection_status || 'not_connected',
        scopes: row?.scopes || oauth.scopes,
        tokenExpiresAt: row?.token_expires_at || null,
        lastRefreshedAt: row?.last_refreshed_at || null,
        lastError: row?.last_error || null,
        oauthConfigured: oauth.configured,
        missingConfiguration: oauth.missing,
        callbackUrl: oauth.callbackUrl,
      };
    }),
  });
}

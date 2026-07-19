import { NextResponse } from 'next/server';
import { isStudioChannelId } from '@/features/studio/validation/studioSchemas';
import { getStudioAccess } from '@/lib/studioAuth';
import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';
import { trackServerEvent } from '@/lib/telemetry';

function unauthorized(reason: 'unauthenticated' | 'not_admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: reason === 'unauthenticated' ? 401 : 403 });
}

export async function GET(request: Request, context: { params: { platform: string } }) {
  const access = await getStudioAccess();

  if (access.allowed !== true) {
    return unauthorized(access.reason);
  }

  const platform = context.params.platform;
  if (!isStudioChannelId(platform) || platform === 'x') {
    return NextResponse.json({ error: 'Unsupported Studio provider' }, { status: 400 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error || !code || !state) {
    return NextResponse.json({ error: error || 'OAuth callback is missing code or state' }, { status: 400 });
  }

  if (hasSupabaseAdminEnv() && supabaseAdmin) {
    const existing = await supabaseAdmin
      .from('studio_platform_connections')
      .select('metadata')
      .eq('platform', platform)
      .maybeSingle();

    if (existing.data?.metadata?.oauthState !== state) {
      return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 });
    }

    await supabaseAdmin.from('studio_platform_connections').upsert({
      created_by: access.user.id,
      platform,
      connection_status: 'pending_token_exchange',
      token_secret_ref: `studio/${platform}/${access.user.id}`,
      last_error: null,
      metadata: {
        ...existing.data.metadata,
        oauthState: null,
        connectedAt: new Date().toISOString(),
        tokenExchangeRequired: true,
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform' });

    await supabaseAdmin.from('studio_audit_log').insert({
      actor_id: access.user.id,
      action: 'studio_connection_callback_received',
      entity_type: 'studio_platform_connections',
      metadata: { platform },
    });
  }

  await trackServerEvent('studio_connection_completed', access.user.id, { platform });

  return NextResponse.json({
    platform,
    status: 'pending_token_exchange',
    tokenStorage: 'token_secret_ref',
  });
}

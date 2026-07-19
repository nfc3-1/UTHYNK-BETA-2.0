import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { isStudioChannelId } from '@/features/studio/validation/studioSchemas';
import { createProviderOAuthConfig } from '@/features/studio/services/publishingService';
import { getStudioAccess } from '@/lib/studioAuth';
import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';
import { trackServerEvent } from '@/lib/telemetry';

function unauthorized(reason: 'unauthenticated' | 'not_admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: reason === 'unauthenticated' ? 401 : 403 });
}

export async function POST(_request: Request, context: { params: { platform: string } }) {
  const access = await getStudioAccess();

  if (access.allowed !== true) {
    return unauthorized(access.reason);
  }

  const platform = context.params.platform;
  if (!isStudioChannelId(platform) || platform === 'x') {
    return NextResponse.json({ error: 'Unsupported Studio provider' }, { status: 400 });
  }

  const state = randomUUID();
  const oauth = createProviderOAuthConfig(platform, state);

  if (hasSupabaseAdminEnv() && supabaseAdmin) {
    await supabaseAdmin.from('studio_platform_connections').upsert({
      created_by: access.user.id,
      platform,
      connection_status: oauth.configured ? 'pending' : 'not_connected',
      scopes: oauth.scopes,
      last_error: oauth.configured ? null : `Missing configuration: ${oauth.missing.join(', ')}`,
      metadata: {
        oauthState: state,
        callbackUrl: oauth.callbackUrl,
        oauthConfigured: oauth.configured,
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform' });

    await supabaseAdmin.from('studio_audit_log').insert({
      actor_id: access.user.id,
      action: 'studio_connection_started',
      entity_type: 'studio_platform_connections',
      metadata: {
        platform,
        oauthConfigured: oauth.configured,
        missingConfiguration: oauth.missing,
      },
    });
  }

  await trackServerEvent('studio_connection_started', access.user.id, {
    platform,
    oauthConfigured: oauth.configured,
  });

  if (!oauth.configured || !oauth.authorizationUrl) {
    return NextResponse.json({
      error: 'Provider OAuth is not configured',
      platform,
      missingConfiguration: oauth.missing,
      callbackUrl: oauth.callbackUrl,
    }, { status: 501 });
  }

  return NextResponse.json({
    platform,
    authorizationUrl: oauth.authorizationUrl,
    state,
    callbackUrl: oauth.callbackUrl,
  });
}

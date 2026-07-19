import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createGraphicAsset, defaultGraphicSettings } from '@/features/studio/services/graphicService';
import { validatePost } from '@/features/studio/validation/studioSchemas';
import { getStudioAccess } from '@/lib/studioAuth';
import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';

function unauthorized(reason: 'unauthenticated' | 'not_admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: reason === 'unauthenticated' ? 401 : 403 });
}

export async function POST(request: Request) {
  const access = await getStudioAccess();

  if (access.allowed !== true) {
    return unauthorized(access.reason);
  }

  const body = await request.json().catch(() => ({}));
  const post = validatePost(body?.post || {});
  const settings = {
    ...defaultGraphicSettings(post),
    ...(body?.settings || {}),
  };
  const asset = createGraphicAsset(post, settings, randomUUID());

  if (hasSupabaseAdminEnv() && supabaseAdmin) {
    const { error } = await supabaseAdmin.from('studio_assets').upsert({
      id: asset.id,
      campaign_id: asset.campaignId,
      post_id: asset.postId,
      created_by: access.user.id,
      asset_type: asset.assetType,
      title: asset.title,
      storage_path: asset.storagePath,
      generation_prompt: asset.prompt,
      status: asset.status,
      metadata: {
        fileUrl: asset.fileUrl,
        thumbnailUrl: asset.thumbnailUrl,
        altText: asset.altText,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType,
        version: asset.version,
        provider: asset.provider,
        generatedAt: asset.generatedAt,
        graphicSettings: asset.graphicSettings,
      },
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: 'Graphic could not be saved.' }, { status: 500 });
    }

    await supabaseAdmin.from('studio_audit_log').insert({
      actor_id: access.user.id,
      action: 'studio_graphic_generated',
      entity_type: 'studio_asset',
      entity_id: asset.id,
      after_state: { status: asset.status, postId: post.id },
      metadata: { provider: 'local_template', platform: post.platform },
    });
  }

  return NextResponse.json({ asset });
}

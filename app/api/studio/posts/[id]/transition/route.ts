import { NextResponse } from 'next/server';
import { assertStudioStatusTransition } from '@/features/studio/services/workflowService';
import type { StudioStatus } from '@/features/studio/types/studio';
import { validatePost, normalizeStatus } from '@/features/studio/validation/studioSchemas';
import { getStudioAccess } from '@/lib/studioAuth';
import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';
import { trackServerEvent } from '@/lib/telemetry';

export async function POST(request: Request, context: { params: { id: string } }) {
  const access = await getStudioAccess();

  if (access.allowed !== true) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: access.reason === 'unauthenticated' ? 401 : 403 });
  }

  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return NextResponse.json({ error: 'Studio persistence is not configured.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const nextStatus = normalizeStatus(body?.status);
  const { data: postRow, error: postError } = await supabaseAdmin
    .from('studio_posts')
    .select('*')
    .eq('id', context.params.id)
    .maybeSingle();

  if (postError || !postRow) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }

  const post = validatePost(postRow);

  try {
    assertStudioStatusTransition(post.status, nextStatus, {
      approved: post.approvalDecision === 'approved' || post.status === 'approved',
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid transition.' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (nextStatus === 'approved') {
    patch.approval_decision = 'approved';
    patch.approved_by = access.user.id;
    patch.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('studio_posts')
    .update(patch)
    .eq('id', context.params.id)
    .select('*')
    .single();

  if (error || !data) {
    await trackServerEvent('database_failure', access.user.id, {
      route: '/api/studio/posts/[id]/transition',
      message: error?.message || 'transition update failed',
    });
    return NextResponse.json({ error: 'Transition failed.' }, { status: 500 });
  }

  await supabaseAdmin.from('studio_audit_log').insert({
    actor_id: access.user.id,
    action: 'studio_post_status_changed',
    entity_type: 'studio_post',
    entity_id: context.params.id,
    before_state: { status: post.status },
    after_state: { status: nextStatus },
    metadata: { route: '/api/studio/posts/[id]/transition' },
  });

  if (nextStatus === 'approved') {
    await trackServerEvent('studio_post_approved', access.user.id, {
      postId: context.params.id,
      campaignId: data.campaign_id,
      platform: data.platform,
    });
  }

  return NextResponse.json({ post: validatePost(data) });
}

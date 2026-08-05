import { NextResponse } from 'next/server';
import { getServerSessionUser } from '@/lib/auth';
import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionUser = await getServerSessionUser();
    const receivedAt = new Date().toISOString();
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Telemetry Event]', {
        receivedAt,
        type: body?.type,
        path: getString(metadata.path),
      });
    }

    if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
      console.warn('[Telemetry Persistence] Supabase admin env is not configured.');
      return NextResponse.json({ success: true, persisted: false });
    }

    const eventType = getString(body?.type);
    const eventMetadata = {
      ...metadata,
      createdAt: body.createdAt ?? null,
      receivedAt,
    };
    const insert =
      eventType === 'provided_feedback'
        ? supabaseAdmin.from('feedback_submissions').insert({
            profile_id: sessionUser?.id || null,
            event_type: eventType,
            context: getString(metadata.context) || null,
            message: getString(metadata.message).slice(0, 4000),
            page_path: getString(metadata.path) || null,
            metadata: eventMetadata,
          })
        : supabaseAdmin.from('product_events').insert({
            user_id: sessionUser?.id || null,
            event_type: eventType || 'unknown_event',
            metadata: eventMetadata,
            created_at: body.createdAt || receivedAt,
          });

    if (eventType === 'provided_feedback' && !getString(metadata.message)) {
      return NextResponse.json(
        { error: 'Feedback message is required.' },
        { status: 400 }
      );
    }

    const { error } = await insert;

    if (error) {
      console.error('[Telemetry Persistence] Supabase insert failed.', error);
      return NextResponse.json(
        { error: 'Telemetry persistence failed.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, persisted: true });
  } catch {
    return NextResponse.json(
      { error: 'Telemetry ingestion failed.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';

function isUuid(value: unknown) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const receivedAt = new Date().toISOString();
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    console.log('[Telemetry Event]', {
      receivedAt,
      ...body,
    });

    if (body?.type !== 'provided_feedback') {
      return NextResponse.json({ success: true, persisted: false });
    }

    const message = getString(metadata.message);

    if (!message) {
      return NextResponse.json(
        { error: 'Feedback message is required.' },
        { status: 400 }
      );
    }

    if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
      console.warn('[Feedback Persistence] Supabase admin env is not configured.');
      return NextResponse.json({ success: true, persisted: false });
    }

    const { error } = await supabaseAdmin.from('feedback_submissions').insert({
      profile_id: isUuid(body.userId) ? body.userId : null,
      event_type: body.type,
      context: getString(metadata.context) || null,
      message,
      page_path: getString(metadata.path) || null,
      metadata: {
        ...metadata,
        createdAt: body.createdAt ?? null,
        receivedAt,
      },
    });

    if (error) {
      console.error('[Feedback Persistence] Supabase insert failed.', error);
      return NextResponse.json(
        { error: 'Feedback persistence failed.' },
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

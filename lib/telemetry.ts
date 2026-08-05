export type TelemetryEvent = {
  type: ProductEventType | string;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type ProductEventType =
  | 'challenge_started'
  | 'challenge_completed'
  | 'followup_completed'
  | 'reflection_completed'
  | 'signup_completed'
  | 'class_created'
  | 'assignment_created'
  | 'studio_campaign_generated'
  | 'studio_post_approved'
  | 'studio_connection_started'
  | 'studio_connection_completed'
  | 'studio_publish_failed'
  | 'studio_state_saved'
  | 'auth_login_failed'
  | 'auth_password_reset_requested'
  | 'database_failure'
  | 'ai_generation_failed';

export function createTelemetryEvent(
  type: string,
  userId?: string,
  metadata?: Record<string, unknown>
): TelemetryEvent {
  return {
    type,
    userId,
    metadata,
    createdAt: new Date().toISOString(),
  };
}

export async function trackEvent(event: TelemetryEvent) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Telemetry]', event);
    return;
  }

  try {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('Telemetry failure', error);
  }
}

export async function trackServerEvent(
  type: ProductEventType,
  userId?: string | null,
  metadata?: Record<string, unknown>
) {
  const event = createTelemetryEvent(type, userId || undefined, metadata);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server Telemetry]', event);
  }

  try {
    const { hasSupabaseAdminEnv, supabaseAdmin } = await import('@/lib/supabaseAdmin');

    if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
      return;
    }

    await supabaseAdmin.from('product_events').insert({
      user_id: userId || null,
      event_type: type,
      metadata: metadata || {},
      created_at: event.createdAt,
    });
  } catch (error) {
    console.error('Server telemetry failure', error);
  }
}

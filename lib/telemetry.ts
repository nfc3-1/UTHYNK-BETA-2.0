export type TelemetryEvent = {
  type: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

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

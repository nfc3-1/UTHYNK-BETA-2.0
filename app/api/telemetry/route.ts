import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('[Telemetry Event]', {
      receivedAt: new Date().toISOString(),
      ...body,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Telemetry ingestion failed.' },
      { status: 500 }
    );
  }
}

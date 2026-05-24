import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'realtime-ready',
    recommendations: [
      'Supabase Realtime',
      'Socket.IO',
      'Ably',
      'Pusher',
    ],
  });
}

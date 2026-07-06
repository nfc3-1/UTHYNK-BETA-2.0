import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabaseConfig';

type ResetBody = {
  email?: string;
};

function getSiteOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = `${requestUrl.protocol}//${requestUrl.host}`.replace(/\/$/, '');
  const configuredOrigin = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
  const allowedProductionOrigins = [
    'https://uthynk.com',
    'https://www.uthynk.com',
    'https://uthynk-beta-2-0.vercel.app',
  ];

  if (allowedProductionOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  if (allowedProductionOrigins.includes(configuredOrigin)) {
    return configuredOrigin;
  }

  if (requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1') {
    return requestOrigin;
  }

  return 'https://uthynk.com';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetBody;
    const email = String(body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (!supabaseUrl || !supabasePublishableKey) {
      return NextResponse.json(
        { error: 'Supabase Auth is not configured for this deployment.' },
        { status: 503 }
      );
    }

    const authClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteOrigin(request)}/reset-password`,
    });

    return NextResponse.json({
      ok: true,
      message: 'If an account exists for that email, a password reset link has been sent.',
    });
  } catch {
    return NextResponse.json({ error: 'Password reset request failed.' }, { status: 500 });
  }
}

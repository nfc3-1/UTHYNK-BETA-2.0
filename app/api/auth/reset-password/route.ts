import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabaseConfig';
import { trackServerEvent } from '@/lib/telemetry';

type ResetBody = {
  email?: string;
};

function getResetOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = `${requestUrl.protocol}//${requestUrl.host}`.replace(/\/$/, '');

  if (requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1') {
    return requestOrigin;
  }

  return 'https://uthynk-beta-2-0.vercel.app';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetBody;
    const email = String(body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const rateLimit = checkRateLimit(`password-reset:${getClientIp(request)}:${email}`, 4, 60 * 60 * 1000);

    if (!rateLimit.allowed) {
      await trackServerEvent('auth_password_reset_requested', null, { email, status: 'rate_limited' });
      return NextResponse.json({ error: 'Too many password reset requests. Try again later.' }, { status: 429 });
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

    const resetOrigin = getResetOrigin(request);

    await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${resetOrigin}/reset-password`,
    });

    await trackServerEvent('auth_password_reset_requested', null, { email, status: 'requested', resetOrigin });

    return NextResponse.json({
      ok: true,
      message: 'If an account exists for that email, a password reset link has been sent.',
      resetOrigin,
    });
  } catch {
    return NextResponse.json({ error: 'Password reset request failed.' }, { status: 500 });
  }
}

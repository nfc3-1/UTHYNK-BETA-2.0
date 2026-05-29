import { NextResponse } from 'next/server';
import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';

const cookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'Missing Supabase access token.' }, { status: 400 });
    }

    if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase auth is not configured.' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid login session.' }, { status: 401 });
    }

    const sessionUser = {
      email: data.user.email,
      id: data.user.id,
      username:
        data.user.user_metadata?.username ||
        data.user.user_metadata?.name ||
        data.user.email?.split('@')[0],
    };

    const response = NextResponse.json({ user: sessionUser });
    response.cookies.set('uthynk-session', JSON.stringify(sessionUser), cookieOptions);
    response.cookies.set('uthynk-profile', JSON.stringify(sessionUser), {
      ...cookieOptions,
      httpOnly: false,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Login session could not be created.' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('uthynk-session', '', { maxAge: 0, path: '/' });
  response.cookies.set('uthynk-profile', '', { maxAge: 0, path: '/' });
  return response;
}

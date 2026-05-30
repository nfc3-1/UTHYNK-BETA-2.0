import { NextResponse } from 'next/server';
import { upsertCanonicalUser } from '@/lib/canonicalPersistence';
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
    const { accessToken, profile } = await request.json();

    if (profile?.id && profile?.email) {
      let sessionUser = {
        age_band: profile.age_band,
        email: String(profile.email).trim().toLowerCase(),
        id: String(profile.id),
        onboarding_goal: profile.onboarding_goal,
        onboarding_style: profile.onboarding_style,
        username: profile.username || String(profile.email).split('@')[0],
      };

      if (hasSupabaseAdminEnv() && supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .eq('email', sessionUser.email)
          .single();

        if (error || !data) {
          return NextResponse.json({ error: 'Profile session could not be verified.' }, { status: 401 });
        }

        sessionUser = {
          age_band: data.age_band,
          email: data.email,
          id: data.id,
          onboarding_goal: data.onboarding_goal,
          onboarding_style: data.onboarding_style,
          username: data.username,
        };
      }

      await upsertCanonicalUser({
        id: sessionUser.id,
        email: sessionUser.email,
        username: sessionUser.username,
        age_band: sessionUser.age_band,
        onboarding_goal: sessionUser.onboarding_goal,
        onboarding_style: sessionUser.onboarding_style,
      });

      const response = NextResponse.json({ user: sessionUser });
      response.cookies.set('uthynk-session', JSON.stringify(sessionUser), cookieOptions);
      response.cookies.set('uthynk-profile', JSON.stringify(profile), {
        ...cookieOptions,
        httpOnly: false,
      });

      return response;
    }

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'Missing login session.' }, { status: 400 });
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

    if (sessionUser.email) {
      await upsertCanonicalUser({
        id: sessionUser.id,
        email: sessionUser.email,
        username: sessionUser.username,
      });
    }

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

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { publicProfile, setAuthCookies } from "@/lib/authCookies";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabaseConfig";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") || "/";
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/";

  if (!code) {
    return NextResponse.redirect(new URL(`/login?mode=login&error=oauth`, url.origin));
  }

  if (!supabaseUrl || !supabasePublishableKey) {
    return NextResponse.redirect(new URL(`/login?mode=login&error=config`, url.origin));
  }

  const authClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data, error } = await authClient.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(new URL(`/login?mode=login&error=oauth`, url.origin));
  }

  const authUser = data.user;
  const email = authUser.email.trim().toLowerCase();
  const username =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.user_metadata?.username ||
    email.split("@")[0];

  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    const profile = publicProfile({
      auth_user_id: authUser.id,
      email,
      id: authUser.id,
      username,
    });
    const response = NextResponse.redirect(new URL(safeNextPath, url.origin));

    setAuthCookies(response, profile);
    return response;
  }

  const { data: existing } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .or(`auth_user_id.eq.${authUser.id},email.eq.${email}`)
    .maybeSingle();

  const profileResult = existing?.id
    ? await supabaseAdmin
        .from("user_profiles")
        .update({
          auth_user_id: authUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single()
    : await supabaseAdmin
        .from("user_profiles")
        .insert({
          auth_user_id: authUser.id,
          email,
          username,
        })
        .select("*")
        .single();

  if (profileResult.error || !profileResult.data) {
    return NextResponse.redirect(new URL(`/login?mode=login&error=profile`, url.origin));
  }

  const response = NextResponse.redirect(new URL(safeNextPath, url.origin));

  setAuthCookies(response, profileResult.data);
  return response;
}

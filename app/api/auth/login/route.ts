import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { publicProfile, setAuthCookies } from "@/lib/authCookies";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabaseConfig";
import { trackServerEvent } from "@/lib/telemetry";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const rateLimit = checkRateLimit(`login:${getClientIp(request)}:${email}`, 8, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      await trackServerEvent("auth_login_failed", null, { email, reason: "rate_limited" });
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
    }

    if (!supabaseUrl || !supabasePublishableKey) {
      return NextResponse.json(
        { error: "Supabase Auth is not configured for this deployment." },
        { status: 503 }
      );
    }

    const authClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const authResult = await authClient.auth.signInWithPassword({ email, password });

    if (authResult.error || !authResult.data.user) {
      await trackServerEvent("auth_login_failed", null, { email, reason: authResult.error?.message || "invalid_credentials" });
      return NextResponse.json(
        { error: authResult.error?.message || "Invalid email or password." },
        { status: 401 }
      );
    }

    const authUser = authResult.data.user;

    if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
      const profile = publicProfile({
        auth_user_id: authUser.id,
        id: authUser.id,
        email,
        username:
          authUser.user_metadata?.username ||
          authUser.user_metadata?.name ||
          email.split("@")[0],
        age_band: authUser.user_metadata?.age_band || "18_plus",
        onboarding_goal: authUser.user_metadata?.onboarding_goal || "sharpen_reasoning",
        onboarding_style: authUser.user_metadata?.onboarding_style || "balanced",
      });
      const response = NextResponse.json({
        source: "supabase-auth",
        profile,
      });
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
            username: authUser.user_metadata?.username || email.split("@")[0],
          })
          .select("*")
          .single();

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json({ error: "Profile loading failed." }, { status: 500 });
    }

    const response = NextResponse.json({
      source: "supabase",
      profile: publicProfile(profileResult.data),
    });
    setAuthCookies(response, profileResult.data);

    return response;
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}

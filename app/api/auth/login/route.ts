import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { publicProfile, setAuthCookies } from "@/lib/authCookies";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://oxgogjxrrpqpvtpkxevv.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "sb_publishable_p-2i4etsV_L1zcIEWOsq1A_Ep7xWGEx";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase Auth is not configured for this deployment." },
        { status: 503 }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const authResult = await authClient.auth.signInWithPassword({ email, password });

    if (authResult.error || !authResult.data.user) {
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

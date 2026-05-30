import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publicProfile, setAuthCookies } from "@/lib/authCookies";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabaseConfig";

type SignupBody = {
  ageBand?: string;
  email?: string;
  onboardingGoal?: string;
  onboardingStyle?: string;
  password?: string;
  username?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupBody;
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const username = String(body.username || "").trim();
    const ageBand = String(body.ageBand || "18_plus").trim();
    const onboardingGoal = String(body.onboardingGoal || "sharpen_reasoning").trim();
    const onboardingStyle = String(body.onboardingStyle || "balanced").trim();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
      const authClient = createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      const authResult = await authClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            age_band: ageBand,
            onboarding_goal: onboardingGoal,
            onboarding_style: onboardingStyle,
            username: username || email.split("@")[0],
          },
        },
      });

      if (authResult.error || !authResult.data.user) {
        return NextResponse.json(
          { error: authResult.error?.message || "Signup failed." },
          { status: 400 }
        );
      }

      const profile = publicProfile({
        auth_user_id: authResult.data.user.id,
        id: authResult.data.user.id,
        email,
        username: username || email.split("@")[0],
        age_band: ageBand,
        onboarding_goal: onboardingGoal,
        onboarding_style: onboardingStyle,
      });
      const response = NextResponse.json({
        source: "supabase-auth",
        profile,
      });
      setAuthCookies(response, profile);

      return response;
    }

    const createdAuthUser = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: username || email.split("@")[0],
      },
    });

    if (createdAuthUser.error) {
      return NextResponse.json(
        {
          error: createdAuthUser.error.message.includes("already")
            ? "An account already exists for this email. Sign in instead."
            : createdAuthUser.error.message,
        },
        { status: 400 }
      );
    }

    const authUser = createdAuthUser.data.user;
    const profilePayload = {
      auth_user_id: authUser?.id,
      email,
      username: username || email.split("@")[0],
      age_band: ageBand,
      onboarding_goal: onboardingGoal,
      onboarding_style: onboardingStyle,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    const profileResult = existing?.id
      ? await supabaseAdmin
          .from("user_profiles")
          .update(profilePayload)
          .eq("id", existing.id)
          .select("*")
          .single()
      : await supabaseAdmin
          .from("user_profiles")
          .insert(profilePayload)
          .select("*")
          .single();

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json({ error: "Profile creation failed." }, { status: 500 });
    }

    const response = NextResponse.json({
      source: "supabase",
      profile: publicProfile(profileResult.data),
    });
    setAuthCookies(response, profileResult.data);

    return response;
  } catch {
    return NextResponse.json({ error: "Signup failed." }, { status: 500 });
  }
}

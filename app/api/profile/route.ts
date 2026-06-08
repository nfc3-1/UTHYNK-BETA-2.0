import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { publicProfile, setAuthCookies } from "@/lib/authCookies";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const sessionUser = await getServerSessionUser();

    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const username = String(body.username || "").trim();
    const ageBand = String(body.ageBand || "18_plus").trim();
    const onboardingGoal = String(body.onboardingGoal || "sharpen_reasoning").trim();
    const onboardingStyle = String(body.onboardingStyle || "balanced").trim();

    if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
      const profile = publicProfile({
        id: sessionUser.id,
        auth_user_id: sessionUser.auth_user_id,
        email: sessionUser.email,
        username: username || sessionUser.username || "UThynker",
        age_band: ageBand,
        onboarding_goal: onboardingGoal,
        onboarding_style: onboardingStyle,
      });
      const response = NextResponse.json({ source: "local", profile });
      setAuthCookies(response, profile);

      return response;
    }

    const { data: updated, error } = await supabaseAdmin
      .from("user_profiles")
      .update({
        username: username || sessionUser.username,
        age_band: ageBand,
        onboarding_goal: onboardingGoal,
        onboarding_style: onboardingStyle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionUser.id)
      .select("*")
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: "Profile update failed." }, { status: 500 });
    }

    const response = NextResponse.json({ source: "supabase", profile: publicProfile(updated) });
    setAuthCookies(response, updated);

    return response;
  } catch {
    return NextResponse.json({ error: "Profile request failed." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const username = String(body.username || "").trim();
    const ageBand = String(body.ageBand || "18_plus").trim();
    const onboardingGoal = String(body.onboardingGoal || "sharpen_reasoning").trim();
    const onboardingStyle = String(body.onboardingStyle || "balanced").trim();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to create or load a profile." },
        { status: 400 }
      );
    }

    if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
      return NextResponse.json({
        source: "local",
        profile: {
          id: "demo-user",
          email,
          username: username || "UThynker",
          age_band: ageBand,
          onboarding_goal: onboardingGoal,
          onboarding_style: onboardingStyle,
          xp: 0,
          streak: 0,
          rank: "Observer",
          reasoning_score: 70,
          primary_trait: "Analytical",
        },
      });
    }

    const { data: existing } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (existing) {
      const { data: updated } = await supabaseAdmin
        .from("user_profiles")
        .update({
          username: username || existing.username,
          age_band: ageBand,
          onboarding_goal: onboardingGoal,
          onboarding_style: onboardingStyle,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      return NextResponse.json({ source: "supabase", profile: updated || existing });
    }

    const { data: created, error } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        email,
        username: username || email.split("@")[0],
        age_band: ageBand,
        onboarding_goal: onboardingGoal,
        onboarding_style: onboardingStyle,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Profile creation failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({ source: "supabase", profile: created });
  } catch {
    return NextResponse.json(
      { error: "Profile request failed." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const sessionUser = await getServerSessionUser();

  if (!sessionUser?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return NextResponse.json({
      source: "local",
      profile: {
        rank: "Observer",
        xp: 0,
        streak: 0,
        reasoning_score: 70,
        primary_trait: "Analytical",
      },
      sessions: [],
    });
  }

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("rank, xp, streak, reasoning_score, primary_trait")
    .eq("id", sessionUser.id)
    .single();

  const { data: sessions } = await supabaseAdmin
    .from("reasoning_sessions")
    .select("id, challenge_category, reasoning_score, xp_awarded, trait_detected, created_at")
    .eq("user_id", sessionUser.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    source: "supabase",
    profile,
    sessions: sessions || [],
  });
}

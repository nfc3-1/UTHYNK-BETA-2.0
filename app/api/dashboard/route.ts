import { NextResponse } from "next/server";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({
      source: "demo",
      profile: {
        rank: "Analyst",
        xp: 1240,
        streak: 4,
        reasoning_score: 74,
        primary_trait: "Strategic Thinking",
      },
      sessions: [
        {
          id: "demo-1",
          challenge_category: "Workplace Strategy",
          reasoning_score: 78,
          xp_awarded: 55,
          trait_detected: "Strategic Restraint",
          created_at: new Date().toISOString(),
        },
        {
          id: "demo-2",
          challenge_category: "Financial Judgment",
          reasoning_score: 72,
          xp_awarded: 40,
          trait_detected: "Opportunity Cost",
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    });
  }

  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return NextResponse.json({
      source: "local",
      profile: null,
      sessions: [],
    });
  }

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("rank, xp, streak, reasoning_score, primary_trait")
    .eq("id", userId)
    .single();

  const { data: sessions } = await supabaseAdmin
    .from("reasoning_sessions")
    .select("id, challenge_category, reasoning_score, xp_awarded, trait_detected, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    source: "supabase",
    profile,
    sessions: sessions || [],
  });
}

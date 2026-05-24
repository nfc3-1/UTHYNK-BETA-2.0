import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';

export async function getReasoningMemory(userId?: string) {
  if (!userId || !hasSupabaseAdminEnv() || !supabaseAdmin) {
    return null;
  }

  const { data: sessions } = await supabaseAdmin
    .from('reasoning_sessions')
    .select(
      'challenge_category, reasoning_score, trait_detected, ai_analysis, weaknesses, created_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!sessions?.length) {
    return null;
  }

  const averageReasoning = Math.round(
    sessions.reduce(
      (sum, session) => sum + (session.reasoning_score || 0),
      0
    ) / sessions.length
  );

  const recurringTraits = sessions
    .map((s) => s.trait_detected)
    .filter(Boolean)
    .slice(0, 3);

  return {
    averageReasoning,
    recurringTraits,
    recentPatterns: sessions.map((session) => ({
      category: session.challenge_category,
      score: session.reasoning_score,
      trait: session.trait_detected,
      analysis: session.ai_analysis,
    })),
  };
}

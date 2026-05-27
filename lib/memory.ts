import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';

export async function getReasoningMemory(userId?: string) {
  if (!userId || !hasSupabaseAdminEnv() || !supabaseAdmin) {
    return null;
  }

  const { data: sessions } = await supabaseAdmin
    .from('reasoning_sessions')
    .select(
      'session_id, conversation_id, challenge_category, reasoning_score, trait_detected, ai_analysis, follow_up, strengths, weaknesses, orchestration_category, cadence_key, created_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(12);

  const { data: traits } = await supabaseAdmin
    .from('cognitive_traits')
    .select('trait_name, trait_score, updated_at')
    .eq('user_id', userId)
    .order('trait_score', { ascending: false })
    .limit(8);

  const { data: reasoningProfile } = await supabaseAdmin
    .from('reasoning_profiles')
    .select(
      'evidence_score, adaptability_score, emotional_control_score, incentives_score, dominant_trait, updated_at'
    )
    .eq('user_id', userId)
    .single();

  if (!sessions?.length) {
    return traits?.length
      ? {
          averageReasoning: null,
          recurringTraits: traits.map((trait) => trait.trait_name).filter(Boolean).slice(0, 3),
          persistentTraits: traits,
          behavioralProfile: reasoningProfile,
          recentFollowUps: [],
          recentPatterns: [],
          categoryStats: [],
        }
      : null;
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

  const categoryMap = sessions.reduce<Record<string, { count: number; total: number }>>(
    (acc, session) => {
      const key = session.orchestration_category || session.challenge_category || 'general';

      acc[key] = acc[key] || { count: 0, total: 0 };
      acc[key].count += 1;
      acc[key].total += session.reasoning_score || 0;

      return acc;
    },
    {}
  );

  return {
    averageReasoning,
    behavioralProfile: reasoningProfile,
    recurringTraits,
    persistentTraits: traits || [],
    recentFollowUps: sessions.map((session) => session.follow_up).filter(Boolean).slice(0, 6),
    categoryStats: Object.entries(categoryMap).map(([category, stats]) => ({
      category,
      attempts: stats.count,
      averageScore: Math.round(stats.total / stats.count),
    })),
    recentPatterns: sessions.map((session) => ({
      category: session.orchestration_category || session.challenge_category,
      conversationId: session.conversation_id,
      sessionId: session.session_id,
      score: session.reasoning_score,
      trait: session.trait_detected,
      analysis: session.ai_analysis,
      strengths: session.strengths || [],
      weaknesses: session.weaknesses || [],
      cadenceKey: session.cadence_key,
    })),
  };
}

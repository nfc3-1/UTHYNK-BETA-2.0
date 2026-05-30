import { hasSupabaseAdminEnv, supabaseAdmin } from '@/lib/supabaseAdmin';
import { randomUUID } from 'crypto';

type ProfileLike = {
  id: string;
  email: string;
  username?: string;
  age_band?: string;
  onboarding_goal?: string;
  onboarding_style?: string;
  xp?: number;
  streak?: number;
  rank?: string;
  reasoning_score?: number;
  primary_trait?: string;
};

export async function ensureSupabaseAuthUser(email: string, username?: string) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !email) {
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: `${randomUUID()}Aa1!`,
      user_metadata: {
        username,
      },
    });

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}

export async function upsertCanonicalUser(profile: ProfileLike) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !profile?.email || !profile?.id) {
    return null;
  }

  try {
    const email = profile.email.trim().toLowerCase();
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    const authUser = existing?.auth_user_id
      ? null
      : await ensureSupabaseAuthUser(email, profile.username);
    const payload = {
      auth_user_id: existing?.auth_user_id || authUser?.id || null,
      profile_id: profile.id,
      email,
      username: profile.username || email.split('@')[0],
      age_band: profile.age_band || '18_plus',
      onboarding_goal: profile.onboarding_goal || 'sharpen_reasoning',
      onboarding_style: profile.onboarding_style || 'balanced',
      xp: profile.xp || 0,
      streak: profile.streak || 0,
      rank: profile.rank || 'Observer',
      reasoning_score: profile.reasoning_score || 70,
      primary_trait: profile.primary_trait || 'Analytical',
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { data } = await supabaseAdmin
        .from('users')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single();

      return data || existing;
    }

    const { data } = await supabaseAdmin
      .from('users')
      .insert({
        id: profile.id,
        ...payload,
      })
      .select('*')
      .single();

    return data;
  } catch {
    return null;
  }
}

export async function updateCanonicalUserProgress({
  primaryTrait,
  profileId,
  rank,
  reasoningScore,
  streak,
  xp,
}: {
  primaryTrait?: string;
  profileId: string;
  rank: string;
  reasoningScore: number;
  streak: number;
  xp: number;
}) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !profileId) {
    return null;
  }

  try {
    const { data } = await supabaseAdmin
      .from('users')
      .update({
        xp,
        streak,
        rank,
        reasoning_score: reasoningScore,
        primary_trait: primaryTrait,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select('*')
      .single();

    return data;
  } catch {
    return null;
  }
}

export async function upsertCanonicalTrait({
  evidence,
  profileId,
  traitName,
  traitScore,
}: {
  evidence?: string;
  profileId: string;
  traitName: string;
  traitScore: number;
}) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !profileId || !traitName) {
    return null;
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from('user_traits')
      .select('*')
      .eq('user_id', profileId)
      .eq('trait_name', traitName)
      .single();
    const payload = {
      user_id: profileId,
      trait_name: traitName,
      trait_score: traitScore,
      evidence_count: (existing?.evidence_count || 0) + 1,
      last_evidence: evidence || existing?.last_evidence || null,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { data } = await supabaseAdmin
        .from('user_traits')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single();

      return data || existing;
    }

    const { data } = await supabaseAdmin
      .from('user_traits')
      .insert(payload)
      .select('*')
      .single();

    return data;
  } catch {
    return null;
  }
}

export async function persistCanonicalConversation({
  category,
  challenge,
  challengeId,
  claim,
  conversationId,
  feedback,
  memory,
  sessionId,
  thinkingLens,
  userId,
}: {
  category: string;
  challenge: string;
  challengeId?: string;
  claim: string;
  conversationId: string;
  feedback: any;
  memory?: any;
  sessionId: string;
  thinkingLens?: string;
  userId?: string;
}) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !userId) {
    return null;
  }

  try {
    const now = new Date().toISOString();
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .upsert(
        {
          user_id: userId,
          session_key: sessionId,
          conversation_id: conversationId,
          last_activity_at: now,
          message_count: 2,
          xp_earned: feedback.xp || 0,
          metadata: {
            category,
            challengeId: challengeId || 'daily',
          },
        },
        { onConflict: 'user_id,session_key' }
      )
      .select('*')
      .single();

    const { data: claimRow } = await supabaseAdmin
      .from('claims')
      .insert({
        user_id: userId,
        session_id: session?.id || null,
        session_key: sessionId,
        conversation_id: conversationId,
        challenge_id: challengeId || 'daily',
        challenge_category: category,
        thinking_lens: thinkingLens || null,
        prompt: challenge,
        claim_text: claim,
        ai_analysis: feedback.analysis,
        contrarian_response: feedback.contrarian,
        follow_up: feedback.followUp,
        reasoning_score: feedback.score,
        xp_awarded: feedback.xp || 0,
        trait_detected: feedback.trait,
        strengths: feedback.strengths || [],
        weaknesses: feedback.weaknesses || [],
        verifier: feedback.verifier || {},
        memory_snapshot: memory || null,
      })
      .select('*')
      .single();

    return {
      claim: claimRow,
      session,
    };
  } catch {
    return null;
  }
}

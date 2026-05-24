import { NextResponse } from "next/server";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  calculateNextStreak,
  calculateReasoningScore,
  getRankFromXp,
} from "@/lib/progression";
import { evolveTraitScore } from "@/lib/traits";
import { getReasoningMemory } from "@/lib/memory";

type ReasoningRequest = {
  challenge?: string;
  challengeId?: string;
  category?: string;
  response?: string;
  userId?: string;
};

function buildAdaptiveSystemPrompt(profile?: any) {
  const ageBand = profile?.age_band || '18_plus';
  const style = profile?.onboarding_style || 'balanced';

  let coachingTone =
    'Use balanced Socratic reasoning with concise strategic feedback.';

  if (ageBand === 'under_13') {
    coachingTone =
      'Use gentle guidance. Avoid aggressive contrarian pressure. Focus on curiosity and reasoning fundamentals.';
  }

  if (ageBand === '13_17') {
    coachingTone =
      'Use light Socratic challenge and constructive pushback without hostility.';
  }

  if (style === 'contrarian') {
    coachingTone +=
      ' Increase intellectual pushback and steelman opposing viewpoints strongly.';
  }

  if (style === 'supportive') {
    coachingTone +=
      ' Prioritize encouragement and confidence-building while still challenging assumptions carefully.';
  }

  return `You are UThynk, an adaptive AI reasoning coach. ${coachingTone} Be concise, rigorous, practical, and non-partisan. Use prior reasoning patterns when available. Identify recurring strengths and weaknesses. Do not give legal, medical, or financial advice. Return only valid JSON with keys: score number 0-100, xp number, trait string, analysis string, contrarian string, followUp string, strengths string[], weaknesses string[].`;
}

const fallbackAnalysis = (response: string) => {
  const trimmed = response.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const score = Math.min(88, Math.max(55, 58 + Math.floor(wordCount / 5)));

  return {
    score,
    xp: score >= 75 ? 55 : 40,
    trait: score >= 75 ? "Strategic Restraint" : "Tactical Thinking",
    analysis:
      wordCount < 25
        ? "Your response is too brief to show full reasoning. Add evidence, incentives, timing, and consequences."
        : "Your response shows initial judgment, but it needs sharper incentive analysis and clearer long-term positioning.",
    contrarian:
      "What if the fastest emotional response weakens your credibility, while a calm evidence-based follow-up increases your leverage?",
    followUp:
      "What specific action protects your reputation while avoiding unnecessary conflict?",
    strengths: ["emotional control", "awareness of reputation risk"],
    weaknesses: ["limited incentive analysis", "needs a clearer next step"],
  };
};

async function loadProfile(userId?: string) {
  if (!userId || !hasSupabaseAdminEnv() || !supabaseAdmin) {
    return null;
  }

  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return data;
}

async function updateTrait(userId: string, traitName: string, reasoningScore: number) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !traitName) {
    return null;
  }

  const { data: existing } = await supabaseAdmin
    .from("cognitive_traits")
    .select("id, trait_score")
    .eq("user_id", userId)
    .eq("trait_name", traitName)
    .single();

  const nextScore = evolveTraitScore(existing?.trait_score || 50, reasoningScore);

  if (existing?.id) {
    await supabaseAdmin
      .from("cognitive_traits")
      .update({
        trait_score: nextScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("cognitive_traits").insert({
      user_id: userId,
      trait_name: traitName,
      trait_score: nextScore,
    });
  }

  return { traitName, traitScore: nextScore };
}

async function updateUserProgress(userId: string, feedback: any) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return null;
  }

  const { data: existing } = await supabaseAdmin
    .from("user_profiles")
    .select("xp, reasoning_score, streak, primary_trait, updated_at")
    .eq("id", userId)
    .single();

  if (!existing) {
    return null;
  }

  const nextXp = (existing.xp || 0) + (feedback.xp || 0);

  const nextScore = calculateReasoningScore(
    existing.reasoning_score || 70,
    feedback.score || 70
  );

  const nextStreak = calculateNextStreak(
    existing.updated_at || null,
    existing.streak || 0
  );

  const nextRank = getRankFromXp(nextXp);
  const evolvedTrait = await updateTrait(userId, feedback.trait, feedback.score || 70);

  await supabaseAdmin
    .from("user_profiles")
    .update({
      xp: nextXp,
      reasoning_score: nextScore,
      streak: nextStreak,
      rank: nextRank,
      primary_trait: feedback.trait || existing.primary_trait,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return {
    xp: nextXp,
    reasoningScore: nextScore,
    streak: nextStreak,
    rank: nextRank,
    evolvedTrait,
  };
}

async function persistSession({
  userId,
  challengeId,
  category,
  challenge,
  response,
  feedback,
}: {
  userId?: string;
  challengeId?: string;
  category?: string;
  challenge: string;
  response: string;
  feedback: any;
}) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !userId) {
    return null;
  }

  await supabaseAdmin.from("reasoning_sessions").insert({
    user_id: userId,
    challenge_id: challengeId || "daily",
    challenge_category: category || "General",
    prompt: challenge,
    response,
    ai_analysis: feedback.analysis,
    contrarian_response: feedback.contrarian,
    follow_up: feedback.followUp,
    reasoning_score: feedback.score,
    xp_awarded: feedback.xp,
    trait_detected: feedback.trait,
  });

  return updateUserProgress(userId, feedback);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReasoningRequest;

    const challenge = body.challenge?.trim() || "Daily reasoning challenge";
    const response = body.response?.trim() || "";

    if (!response) {
      return NextResponse.json(
        { error: "A response is required before reasoning can be analyzed." },
        { status: 400 }
      );
    }

    const memory = await getReasoningMemory(body.userId);
    const profile = await loadProfile(body.userId);

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const fallback = fallbackAnalysis(response);

      const progression = await persistSession({
        userId: body.userId,
        challengeId: body.challengeId,
        category: body.category,
        challenge,
        response,
        feedback: fallback,
      });

      return NextResponse.json({
        source: "fallback",
        memory,
        progression,
        ...fallback,
      });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.45,
        messages: [
          {
            role: "system",
            content: buildAdaptiveSystemPrompt(profile),
          },
          {
            role: "user",
            content: JSON.stringify({
              challenge,
              userResponse: response,
              historicalMemory: memory,
              onboardingProfile: profile,
            }),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const fallback = fallbackAnalysis(response);

      const progression = await persistSession({
        userId: body.userId,
        challengeId: body.challengeId,
        category: body.category,
        challenge,
        response,
        feedback: fallback,
      });

      return NextResponse.json({
        source: "fallback",
        memory,
        progression,
        ...fallback,
      });
    }

    const data = await aiResponse.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      const fallback = fallbackAnalysis(response);

      const progression = await persistSession({
        userId: body.userId,
        challengeId: body.challengeId,
        category: body.category,
        challenge,
        response,
        feedback: fallback,
      });

      return NextResponse.json({
        source: "fallback",
        memory,
        progression,
        ...fallback,
      });
    }

    const parsed = JSON.parse(content);

    const progression = await persistSession({
      userId: body.userId,
      challengeId: body.challengeId,
      category: body.category,
      challenge,
      response,
      feedback: parsed,
    });

    return NextResponse.json({
      source: "openai",
      memory,
      progression,
      onboardingProfile: profile,
      ...parsed,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Reasoning analysis failed. Try again with a clearer response.",
      },
      { status: 500 }
    );
  }
}

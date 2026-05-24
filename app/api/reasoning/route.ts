import { NextResponse } from "next/server";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";

type ReasoningRequest = {
  challenge?: string;
  challengeId?: string;
  category?: string;
  response?: string;
  userId?: string;
};

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
    return;
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

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const fallback = fallbackAnalysis(response);

      await persistSession({
        userId: body.userId,
        challengeId: body.challengeId,
        category: body.category,
        challenge,
        response,
        feedback: fallback,
      });

      return NextResponse.json({ source: "fallback", ...fallback });
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
            content:
              "You are UThynk, an AI reasoning coach. Be concise, rigorous, practical, and non-partisan. Do not give legal, medical, or financial advice. Analyze reasoning quality, challenge assumptions, and ask one sharper follow-up. Return only valid JSON with keys: score number 0-100, xp number, trait string, analysis string, contrarian string, followUp string, strengths string[], weaknesses string[].",
          },
          {
            role: "user",
            content: JSON.stringify({
              challenge,
              userResponse: response,
            }),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const fallback = fallbackAnalysis(response);

      await persistSession({
        userId: body.userId,
        challengeId: body.challengeId,
        category: body.category,
        challenge,
        response,
        feedback: fallback,
      });

      return NextResponse.json({ source: "fallback", ...fallback });
    }

    const data = await aiResponse.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      const fallback = fallbackAnalysis(response);

      await persistSession({
        userId: body.userId,
        challengeId: body.challengeId,
        category: body.category,
        challenge,
        response,
        feedback: fallback,
      });

      return NextResponse.json({ source: "fallback", ...fallback });
    }

    const parsed = JSON.parse(content);

    await persistSession({
      userId: body.userId,
      challengeId: body.challengeId,
      category: body.category,
      challenge,
      response,
      feedback: parsed,
    });

    return NextResponse.json({ source: "openai", ...parsed });
  } catch {
    return NextResponse.json(
      {
        error: "Reasoning analysis failed. Try again with a clearer response.",
      },
      { status: 500 }
    );
  }
}

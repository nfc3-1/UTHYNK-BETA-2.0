import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getReasoningMemory } from "@/lib/memory";
import {
  calculateNextStreak,
  calculateReasoningScore,
  getRankFromXp,
} from "@/lib/progression";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";
import { evolveTraitScore } from "@/lib/traits";

type ReasoningCategory =
  | "debate"
  | "decisions"
  | "ethics"
  | "creative"
  | "relationships"
  | "general";

type ReasoningRequest = {
  challenge?: string;
  challengeId?: string;
  category?: string;
  conversationId?: string;
  response?: string;
  sessionId?: string;
  stream?: boolean;
  userId?: string;
};

const categoryPromptMap: Record<
  ReasoningCategory,
  {
    evaluatorRole: string;
    followUpDirective: string;
    lens: string[];
    temperature: number;
    traits: string[];
  }
> = {
  debate: {
    evaluatorRole: "argument quality verifier",
    followUpDirective:
      "Generate a new follow-up that attacks the weakest warrant, missing evidence, or strongest opposing view.",
    lens: ["claim precision", "evidence", "warrant strength", "counterargument handling"],
    temperature: 0.58,
    traits: ["Evidence Discipline", "Intellectual Flexibility", "Argument Mapping"],
  },
  decisions: {
    evaluatorRole: "decision strategy verifier",
    followUpDirective:
      "Generate a new follow-up that forces a choice under uncertainty, with a concrete trigger for changing course.",
    lens: ["tradeoffs", "incentives", "reversibility", "second-order effects"],
    temperature: 0.46,
    traits: ["Strategic Restraint", "Risk Calibration", "Incentive Awareness"],
  },
  ethics: {
    evaluatorRole: "principled reasoning verifier",
    followUpDirective:
      "Generate a new follow-up that tests whether the user's principle survives a hard edge case.",
    lens: ["stakeholders", "principles", "harm analysis", "role reversal"],
    temperature: 0.52,
    traits: ["Principled Reasoning", "Perspective Taking", "Moral Consistency"],
  },
  creative: {
    evaluatorRole: "creative reasoning verifier",
    followUpDirective:
      "Generate a new follow-up that changes the constraint, angle, or frame instead of asking a generic next question.",
    lens: ["specificity", "constraint use", "originality", "useful reframing"],
    temperature: 0.72,
    traits: ["Creative Reframing", "Adaptive Thinking", "Constraint Fluency"],
  },
  relationships: {
    evaluatorRole: "social reasoning verifier",
    followUpDirective:
      "Generate a new follow-up that tests tone, timing, and the other person's likely interpretation.",
    lens: ["emotional control", "incentives", "timing", "perspective taking"],
    temperature: 0.54,
    traits: ["Emotional Control", "Social Calibration", "Perspective Taking"],
  },
  general: {
    evaluatorRole: "adaptive reasoning verifier",
    followUpDirective:
      "Generate a new follow-up that targets the single most important missing reasoning move.",
    lens: ["clarity", "evidence", "alternatives", "next test"],
    temperature: 0.5,
    traits: ["Analytical Discipline", "Adaptive Thinking", "Tactical Thinking"],
  },
};

const responseModes = [
  "diagnostic",
  "counterfactual",
  "decision checkpoint",
  "assumption audit",
  "pressure test",
  "steelman reversal",
];

function normalizeCategory(category?: string, challenge?: string): ReasoningCategory {
  const source = `${category || ""} ${challenge || ""}`.toLowerCase();

  if (/debate|argument|persuad|claim|rebuttal|steelman/.test(source)) return "debate";
  if (/ethic|moral|fair|harm|justice|stakeholder|principle/.test(source)) return "ethics";
  if (/creative|invent|story|imagine|reframe|design|idea/.test(source)) return "creative";
  if (/relationship|friend|family|trust|conflict|social|reputation/.test(source)) return "relationships";
  if (/decision|choose|risk|tradeoff|career|money|plan|strategy|option/.test(source)) return "decisions";

  return "general";
}

function hashText(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function verifierEngine(response: string, category: ReasoningCategory) {
  const lower = response.toLowerCase();
  const words = response.trim() ? response.trim().split(/\s+/).length : 0;
  const signals = {
    evidence: /\b(because|evidence|data|example|for instance|shows|proof|observed)\b/.test(lower),
    alternatives: /\b(alternative|option|instead|another|otherwise|could)\b/.test(lower),
    tradeoff: /\b(tradeoff|risk|cost|benefit|downside|upside|however|although|but)\b/.test(lower),
    action: /\b(next|then|first|step|would|will|should|test|measure)\b/.test(lower),
    perspective: /\b(they|their|someone|stakeholder|opponent|other side|audience)\b/.test(lower),
    emotionalControl: /\b(calm|pause|listen|avoid|de-escalate|wait|tone|restraint)\b/.test(lower),
    incentives: /\b(incentive|motivation|leverage|reward|pressure|reputation|cost)\b/.test(lower),
  };
  const behavioral = {
    evidence: clamp((signals.evidence ? 72 : 42) + Math.min(18, words)),
    adaptability: clamp((signals.alternatives ? 68 : 40) + (signals.tradeoff ? 12 : 0) + Math.min(12, words / 2)),
    emotionalControl: clamp((signals.emotionalControl ? 74 : 44) + (signals.perspective ? 10 : 0)),
    incentives: clamp((signals.incentives ? 74 : 42) + (signals.tradeoff ? 10 : 0)),
  };
  const weights: Record<ReasoningCategory, (keyof typeof behavioral)[]> = {
    debate: ["evidence", "adaptability"],
    decisions: ["incentives", "adaptability"],
    ethics: ["emotionalControl", "adaptability"],
    creative: ["adaptability", "evidence"],
    relationships: ["emotionalControl", "incentives"],
    general: ["evidence", "adaptability", "incentives"],
  };
  const weighted = weights[category].reduce((sum, key) => sum + behavioral[key], 0) / weights[category].length;
  const missingMoves = Object.entries(signals)
    .filter(([, present]) => !present)
    .map(([name]) => name)
    .slice(0, 4);

  return {
    behavioral,
    missingMoves,
    score: clamp(35 + Math.min(28, words * 1.1) + weighted * 0.45),
    signals,
  };
}

function ensureString(value: unknown, fallback: string) {
  const text = String(value || "").trim();

  return text || fallback;
}

function ensureList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  return Array.from(new Set(value.map((item) => String(item || "").trim()).filter(Boolean))).slice(0, 4);
}

function sanitizeFeedback(parsed: any, verifier: ReturnType<typeof verifierEngine>, prompt: typeof categoryPromptMap[ReasoningCategory]) {
  const aiScore = Number(parsed?.score);
  const score = clamp(Number.isFinite(aiScore) ? aiScore * 0.72 + verifier.score * 0.28 : verifier.score);

  return {
    analysis: ensureString(parsed?.analysis, "The model returned incomplete analysis. Try again with a more specific response."),
    behavioral: {
      evidence: clamp(Number(parsed?.behavioral?.evidence) || verifier.behavioral.evidence),
      adaptability: clamp(Number(parsed?.behavioral?.adaptability) || verifier.behavioral.adaptability),
      emotionalControl: clamp(Number(parsed?.behavioral?.emotionalControl) || verifier.behavioral.emotionalControl),
      incentives: clamp(Number(parsed?.behavioral?.incentives) || verifier.behavioral.incentives),
    },
    contrarian: ensureString(parsed?.contrarian, "What would make your current interpretation fail under pressure?"),
    followUp: ensureString(parsed?.followUp, "What is the next test that would most quickly expose whether your reasoning is sound?"),
    score,
    strengths: ensureList(parsed?.strengths, prompt.lens.slice(0, 2)),
    trait: ensureString(parsed?.trait, prompt.traits[0]),
    weaknesses: ensureList(parsed?.weaknesses, verifier.missingMoves),
    xp: clamp(Number(parsed?.xp) || (score >= 85 ? 70 : score >= 70 ? 52 : 35), 20, 95),
    verifier,
  };
}

async function loadProfile(userId?: string) {
  if (!userId || !hasSupabaseAdminEnv() || !supabaseAdmin) return null;

  const { data } = await supabaseAdmin.from("user_profiles").select("*").eq("id", userId).single();

  return data;
}

async function updateTrait(userId: string, traitName: string, score: number) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !traitName) return null;

  const { data: existing } = await supabaseAdmin
    .from("cognitive_traits")
    .select("id, trait_score")
    .eq("user_id", userId)
    .eq("trait_name", traitName)
    .single();
  const nextScore = evolveTraitScore(existing?.trait_score || 50, score);

  if (existing?.id) {
    await supabaseAdmin.from("cognitive_traits").update({ trait_score: nextScore, updated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await supabaseAdmin.from("cognitive_traits").insert({ user_id: userId, trait_name: traitName, trait_score: nextScore });
  }

  return { traitName, traitScore: nextScore };
}

async function updateReasoningProfile(userId: string, feedback: ReturnType<typeof sanitizeFeedback>) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin) return null;

  const { data: existing } = await supabaseAdmin.from("reasoning_profiles").select("*").eq("user_id", userId).single();
  const blend = (current: number | null | undefined, next: number) => clamp((Number(current) || 50) * 0.75 + next * 0.25);
  const nextProfile = {
    user_id: userId,
    evidence_score: blend(existing?.evidence_score, feedback.behavioral.evidence),
    adaptability_score: blend(existing?.adaptability_score, feedback.behavioral.adaptability),
    emotional_control_score: blend(existing?.emotional_control_score, feedback.behavioral.emotionalControl),
    incentives_score: blend(existing?.incentives_score, feedback.behavioral.incentives),
    dominant_trait: feedback.trait,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { data } = await supabaseAdmin.from("reasoning_profiles").update(nextProfile).eq("id", existing.id).select("*").single();
    return data;
  }

  const { data } = await supabaseAdmin.from("reasoning_profiles").insert(nextProfile).select("*").single();
  return data;
}

async function updateUserProgress(userId: string, feedback: ReturnType<typeof sanitizeFeedback>) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin) return null;

  const { data: existing } = await supabaseAdmin
    .from("user_profiles")
    .select("xp, reasoning_score, streak, primary_trait, updated_at")
    .eq("id", userId)
    .single();

  if (!existing) return null;

  const nextXp = (existing.xp || 0) + feedback.xp;
  const nextScore = calculateReasoningScore(existing.reasoning_score || 70, feedback.score);
  const nextStreak = calculateNextStreak(existing.updated_at || null, existing.streak || 0);
  const nextRank = getRankFromXp(nextXp);
  const evolvedTrait = await updateTrait(userId, feedback.trait, feedback.score);
  const reasoningProfile = await updateReasoningProfile(userId, feedback);

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

  return { evolvedTrait, rank: nextRank, reasoningProfile, reasoningScore: nextScore, streak: nextStreak, xp: nextXp };
}

async function persistSession(input: {
  challenge: string;
  challengeId?: string;
  conversationId: string;
  feedback: ReturnType<typeof sanitizeFeedback>;
  memory?: any;
  mode: string;
  prompt: typeof categoryPromptMap[ReasoningCategory];
  response: string;
  sessionId: string;
  userId?: string;
}) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !input.userId) return null;

  await supabaseAdmin.from("reasoning_sessions").insert({
    user_id: input.userId,
    session_id: input.sessionId,
    conversation_id: input.conversationId,
    challenge_id: input.challengeId || "daily",
    challenge_category: input.prompt === categoryPromptMap.debate ? "debate" : undefined,
    prompt: input.challenge,
    response: input.response,
    ai_analysis: input.feedback.analysis,
    contrarian_response: input.feedback.contrarian,
    follow_up: input.feedback.followUp,
    reasoning_score: input.feedback.score,
    xp_awarded: input.feedback.xp,
    trait_detected: input.feedback.trait,
    strengths: input.feedback.strengths,
    weaknesses: input.feedback.weaknesses,
    verifier_score: input.feedback.verifier.score,
    orchestration_category: input.prompt.evaluatorRole,
    cadence_key: input.mode,
    memory_snapshot: input.memory || null,
  });

  await supabaseAdmin.from("reasoning_followups").insert({
    user_id: input.userId,
    session_id: input.sessionId,
    conversation_id: input.conversationId,
    challenge_id: input.challengeId || "daily",
    challenge_category: input.prompt.evaluatorRole,
    follow_up: input.feedback.followUp,
    cadence_key: input.mode,
  });

  await supabaseAdmin.from("reasoning_verifier_scores").insert({
    user_id: input.userId,
    session_id: input.sessionId,
    conversation_id: input.conversationId,
    challenge_id: input.challengeId || "daily",
    challenge_category: input.prompt.evaluatorRole,
    ai_score: input.feedback.score,
    verifier_score: input.feedback.verifier.score,
    blended_score: input.feedback.score,
    rubric: input.prompt.lens.join(", "),
    signals: input.feedback.verifier,
  });

  return updateUserProgress(input.userId, input.feedback);
}

function jsonStreamEvent(type: string, payload: unknown) {
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function buildSystemPrompt(input: {
  category: ReasoningCategory;
  conversationId: string;
  memory: any;
  mode: string;
  profile: any;
  sessionId: string;
  verifier: ReturnType<typeof verifierEngine>;
}) {
  const prompt = categoryPromptMap[input.category];

  return [
    "You are UThynk, an adaptive reasoning coach. Produce specific, non-repetitive feedback.",
    `Session identity: sessionId=${input.sessionId}, conversationId=${input.conversationId}.`,
    `Category: ${input.category}. Role: ${prompt.evaluatorRole}.`,
    `Response mode: ${input.mode}. Do not reuse the same opening, cadence, or follow-up shape from prior turns.`,
    `Reasoning lens: ${prompt.lens.join(", ")}.`,
    `Follow-up directive: ${prompt.followUpDirective}`,
    `Available trait labels: ${prompt.traits.join(", ")}.`,
    `User profile: ${JSON.stringify(input.profile || null)}.`,
    `Persistent memory: ${JSON.stringify(input.memory || null)}.`,
    `Verifier engine result: ${JSON.stringify(input.verifier)}.`,
    `Do not repeat these follow-ups: ${JSON.stringify(input.memory?.recentFollowUps || [])}.`,
    "Return only valid JSON with keys: score number, xp number, trait string, analysis string, contrarian string, followUp string, strengths string[], weaknesses string[], behavioral object with evidence/adaptability/emotionalControl/incentives numbers.",
  ].join(" ");
}

async function callOpenAi(input: {
  apiKey: string;
  category: ReasoningCategory;
  challenge: string;
  conversationId: string;
  memory: any;
  mode: string;
  profile: any;
  response: string;
  sessionId: string;
  stream: boolean;
  verifier: ReturnType<typeof verifierEngine>;
}) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${input.apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: categoryPromptMap[input.category].temperature,
      stream: input.stream,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(input) },
        {
          role: "user",
          content: JSON.stringify({ challenge: input.challenge, priorSessions: input.memory?.recentPatterns || [], response: input.response }),
        },
      ],
    }),
  });
}

async function nonStreamingFeedback(input: Parameters<typeof callOpenAi>[0]) {
  const aiResponse = await callOpenAi({ ...input, stream: false });
  if (!aiResponse.ok) throw new Error("OpenAI reasoning request failed.");

  const data = await aiResponse.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty reasoning response.");

  return JSON.parse(content);
}

function streamingFeedback(input: Parameters<typeof callOpenAi>[0] & { challengeId?: string; userId?: string }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(jsonStreamEvent("orchestration", {
          category: input.category,
          conversationId: input.conversationId,
          mode: input.mode,
          sessionId: input.sessionId,
          verifier: input.verifier,
        })));

        const aiResponse = await callOpenAi({ ...input, stream: true });
        if (!aiResponse.ok || !aiResponse.body) throw new Error("OpenAI streaming request failed.");

        const reader = aiResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let content = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            const parsed = JSON.parse(data);
            const token = parsed?.choices?.[0]?.delta?.content || "";
            if (token) {
              content += token;
              controller.enqueue(encoder.encode(jsonStreamEvent("token", { token })));
            }
          }
        }

        const feedback = sanitizeFeedback(JSON.parse(content), input.verifier, categoryPromptMap[input.category]);
        const progression = await persistSession({
          challenge: input.challenge,
          challengeId: input.challengeId,
          conversationId: input.conversationId,
          feedback,
          memory: input.memory,
          mode: input.mode,
          prompt: categoryPromptMap[input.category],
          response: input.response,
          sessionId: input.sessionId,
          userId: input.userId,
        });

        controller.enqueue(encoder.encode(jsonStreamEvent("final", { source: "openai", memory: input.memory, mode: input.mode, progression, ...feedback })));
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(jsonStreamEvent("error", { error: error instanceof Error ? error.message : "Reasoning stream failed." })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReasoningRequest;
    const sessionUser = await getServerSessionUser();
    const userId = body.userId || sessionUser?.id;
    const sessionId = body.sessionId || crypto.randomUUID();
    const conversationId = body.conversationId || body.challengeId || sessionId;
    const challenge = body.challenge?.trim() || "Daily reasoning challenge";
    const response = body.response?.trim() || "";

    if (!response) {
      return NextResponse.json({ error: "A response is required before reasoning can be analyzed." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is required for adaptive reasoning. Static fallback is disabled." }, { status: 503 });
    }

    const category = normalizeCategory(body.category, challenge);
    const memory = await getReasoningMemory(userId);
    const profile = await loadProfile(userId);
    const verifier = verifierEngine(response, category);
    const modeSeed = hashText(`${category}:${sessionId}:${conversationId}:${challenge}:${response}:${memory?.recentFollowUps?.join("|") || ""}`);
    const mode = responseModes[modeSeed % responseModes.length];
    const wantsStream = body.stream === true || request.headers.get("accept")?.includes("text/event-stream");
    const openAiArgs = { apiKey, category, challenge, conversationId, memory, mode, profile, response, sessionId, stream: false, verifier };

    if (wantsStream) {
      return streamingFeedback({ ...openAiArgs, challengeId: body.challengeId, userId });
    }

    const feedback = sanitizeFeedback(await nonStreamingFeedback(openAiArgs), verifier, categoryPromptMap[category]);
    const progression = await persistSession({
      challenge,
      challengeId: body.challengeId,
      conversationId,
      feedback,
      memory,
      mode,
      prompt: categoryPromptMap[category],
      response,
      sessionId,
      userId,
    });

    return NextResponse.json({ source: "openai", memory, mode, progression, ...feedback });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reasoning analysis failed." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import {
  persistCanonicalConversation,
  updateCanonicalUserProgress,
  upsertCanonicalTrait,
} from "@/lib/canonicalPersistence";
import { getReasoningMemory } from "@/lib/memory";
import {
  calculateNextStreak,
  calculateReasoningScore,
  getRankFromXp,
} from "@/lib/progression";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";
import { evolveTraitScore } from "@/lib/traits";

type ReasoningRequest = {
  challenge?: string;
  challengeId?: string;
  category?: string;
  conversationId?: string;
  language?: "en" | "es" | "fr";
  response?: string;
  sessionId?: string;
  stream?: boolean;
  thinkingLens?: string;
  userId?: string;
};

type ReasoningCategory =
  | "debate"
  | "decisions"
  | "ethics"
  | "creative"
  | "relationships"
  | "general";

type BehavioralScores = {
  evidence: number;
  adaptability: number;
  emotionalControl: number;
  incentives: number;
};

type VerifierResult = {
  score: number;
  behavioral: BehavioralScores;
  signals: Record<string, boolean>;
  missingMoves: string[];
};

type ReasoningFeedback = {
  analysis: string;
  behavioral: BehavioralScores;
  contrarian: string;
  followUp: string;
  score: number;
  strengths: string[];
  trait: string;
  weaknesses: string[];
  xp: number;
  verifier: VerifierResult;
};

type CategoryPrompt = {
  category: ReasoningCategory;
  evaluatorRole: string;
  reasoningLens: string[];
  followUpDirective: string;
  traitOptions: string[];
  temperature: number;
};

const categoryPromptMap: Record<ReasoningCategory, CategoryPrompt> = {
  debate: {
    category: "debate",
    evaluatorRole: "argument quality verifier",
    reasoningLens: ["claim precision", "evidence", "warrant strength", "counterargument handling"],
    followUpDirective:
      "Generate a new follow-up that attacks the weakest warrant, missing evidence, or strongest opposing view.",
    traitOptions: ["Evidence Discipline", "Intellectual Flexibility", "Argument Mapping"],
    temperature: 0.58,
  },
  decisions: {
    category: "decisions",
    evaluatorRole: "decision strategy verifier",
    reasoningLens: ["tradeoffs", "incentives", "reversibility", "second-order effects"],
    followUpDirective:
      "Generate a new follow-up that forces a choice under uncertainty, with a concrete trigger for changing course.",
    traitOptions: ["Strategic Restraint", "Risk Calibration", "Incentive Awareness"],
    temperature: 0.46,
  },
  ethics: {
    category: "ethics",
    evaluatorRole: "principled reasoning verifier",
    reasoningLens: ["stakeholders", "principles", "harm analysis", "role reversal"],
    followUpDirective:
      "Generate a new follow-up that tests whether the user's principle survives a hard edge case.",
    traitOptions: ["Principled Reasoning", "Perspective Taking", "Moral Consistency"],
    temperature: 0.52,
  },
  creative: {
    category: "creative",
    evaluatorRole: "creative reasoning verifier",
    reasoningLens: ["specificity", "constraint use", "originality", "useful reframing"],
    followUpDirective:
      "Generate a new follow-up that changes the constraint, angle, or frame instead of asking a generic next question.",
    traitOptions: ["Creative Reframing", "Adaptive Thinking", "Constraint Fluency"],
    temperature: 0.72,
  },
  relationships: {
    category: "relationships",
    evaluatorRole: "social reasoning verifier",
    reasoningLens: ["emotional control", "incentives", "timing", "perspective taking"],
    followUpDirective:
      "Generate a new follow-up that tests tone, timing, and the other person's likely interpretation.",
    traitOptions: ["Emotional Control", "Social Calibration", "Perspective Taking"],
    temperature: 0.54,
  },
  general: {
    category: "general",
    evaluatorRole: "adaptive reasoning verifier",
    reasoningLens: ["clarity", "evidence", "alternatives", "next test"],
    followUpDirective:
      "Generate a new follow-up that targets the single most important missing reasoning move.",
    traitOptions: ["Analytical Discipline", "Adaptive Thinking", "Tactical Thinking"],
    temperature: 0.5,
  },
};

const randomizedResponseModes = [
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

function stableModeSeed(input: {
  category: ReasoningCategory;
  challenge: string;
  conversationId: string;
  response: string;
  sessionId: string;
  memory: any;
}) {
  return hashText(
    [
      input.category,
      input.sessionId,
      input.conversationId,
      input.challenge,
      input.response,
      input.memory?.recentPatterns?.length || 0,
      input.memory?.recentFollowUps?.join("|") || "",
    ].join(":")
  );
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function verifierEngine(response: string, category: ReasoningCategory): VerifierResult {
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
  const categoryWeights: Record<ReasoningCategory, (keyof BehavioralScores)[]> = {
    debate: ["evidence", "adaptability"],
    decisions: ["incentives", "adaptability"],
    ethics: ["emotionalControl", "adaptability"],
    creative: ["adaptability", "evidence"],
    relationships: ["emotionalControl", "incentives"],
    general: ["evidence", "adaptability", "incentives"],
  };
  const weightedKeys = categoryWeights[category];
  const weighted = weightedKeys.reduce((sum, key) => sum + behavioral[key], 0) / weightedKeys.length;
  const base = Math.min(28, words * 1.1);
  const score = clamp(35 + base + weighted * 0.45);
  const missingMoves = Object.entries(signals)
    .filter(([, present]) => !present)
    .map(([name]) => name)
    .slice(0, 4);

  return {
    score,
    behavioral,
    signals,
    missingMoves,
  };
}

function ensureString(value: unknown, fallback: string) {
  const text = String(value || "").trim();

  return text || fallback;
}

function ensureList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.map((item) => String(item || "").trim()).filter(Boolean);

  return Array.from(new Set(items)).slice(0, 4);
}

function sanitizeFeedback(
  parsed: any,
  verifier: VerifierResult,
  categoryPrompt: CategoryPrompt
): ReasoningFeedback {
  const aiScore = Number(parsed?.score);
  const score = clamp(
    Number.isFinite(aiScore) ? aiScore * 0.72 + verifier.score * 0.28 : verifier.score
  );
  const trait = ensureString(parsed?.trait, categoryPrompt.traitOptions[0]);

  return {
    analysis: ensureString(
      parsed?.analysis,
      "The model returned incomplete analysis. Try again with a more specific response."
    ),
    behavioral: {
      evidence: clamp(Number(parsed?.behavioral?.evidence) || verifier.behavioral.evidence),
      adaptability: clamp(
        Number(parsed?.behavioral?.adaptability) || verifier.behavioral.adaptability
      ),
      emotionalControl: clamp(
        Number(parsed?.behavioral?.emotionalControl) || verifier.behavioral.emotionalControl
      ),
      incentives: clamp(Number(parsed?.behavioral?.incentives) || verifier.behavioral.incentives),
    },
    contrarian: ensureString(
      parsed?.contrarian,
      "What would make your current interpretation fail under pressure?"
    ),
    followUp: ensureString(
      parsed?.followUp,
      "What is the next test that would most quickly expose whether your reasoning is sound?"
    ),
    score,
    strengths: ensureList(parsed?.strengths, categoryPrompt.reasoningLens.slice(0, 2)),
    trait,
    weaknesses: ensureList(parsed?.weaknesses, verifier.missingMoves),
    xp: clamp(Number(parsed?.xp) || (score >= 85 ? 70 : score >= 70 ? 52 : 35), 20, 95),
    verifier,
  };
}

function buildAdaptiveSystemPrompt({
  categoryPrompt,
  conversationId,
  language,
  memory,
  mode,
  profile,
  sessionId,
  verifier,
}: {
  categoryPrompt: CategoryPrompt;
  conversationId: string;
  language: "en" | "es" | "fr";
  memory?: any;
  mode: string;
  profile?: any;
  sessionId: string;
  verifier: VerifierResult;
}) {
  const ageBand = profile?.age_band || "18_plus";
  const style = profile?.onboarding_style || "balanced";
  const recentFollowUps = memory?.recentFollowUps?.filter(Boolean).slice(0, 8) || [];
  const responseLanguage =
    language === "es" ? "Spanish" : language === "fr" ? "French" : "English";

  return [
    "You are UThynk, an adaptive reasoning coach. You must produce specific, non-repetitive feedback.",
    `Write every user-facing response field in ${responseLanguage}. Keep JSON keys in English.`,
    `Session identity: sessionId=${sessionId}, conversationId=${conversationId}.`,
    `Category: ${categoryPrompt.category}. Role: ${categoryPrompt.evaluatorRole}.`,
    `Response mode: ${mode}. Do not reuse the same opening, cadence, or follow-up shape from prior turns.`,
    `Reasoning lens: ${categoryPrompt.reasoningLens.join(", ")}.`,
    `Follow-up directive: ${categoryPrompt.followUpDirective}`,
    `Available trait labels: ${categoryPrompt.traitOptions.join(", ")}.`,
    `User age band: ${ageBand}. Coaching style: ${style}.`,
    `Persistent memory: ${JSON.stringify(memory || null)}.`,
    `Verifier engine result: ${JSON.stringify(verifier)}.`,
    `Do not repeat these follow-ups: ${JSON.stringify(recentFollowUps)}.`,
    "Score by blending your judgment with the verifier result. Penalize generic, unsupported, or evasive reasoning.",
    "Return only valid JSON with keys: score number, xp number, trait string, analysis string, contrarian string, followUp string, strengths string[], weaknesses string[], behavioral object with evidence/adaptability/emotionalControl/incentives numbers.",
  ].join(" ");
}

async function loadProfile(userId?: string) {
  if (!userId || !hasSupabaseAdminEnv() || !supabaseAdmin) {
    return null;
  }

  const { data } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
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

  await upsertCanonicalTrait({
    evidence: `Reasoning score ${reasoningScore}`,
    profileId: userId,
    traitName,
    traitScore: nextScore,
  });

  return { traitName, traitScore: nextScore };
}

async function updateReasoningProfile(userId: string, feedback: ReasoningFeedback) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return null;
  }

  const { data: existing } = await supabaseAdmin
    .from("reasoning_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  const blend = (current: number | null | undefined, next: number) =>
    clamp((Number(current) || 50) * 0.75 + next * 0.25);

  const nextProfile = {
    user_id: userId,
    evidence_score: blend(existing?.evidence_score, feedback.behavioral.evidence),
    adaptability_score: blend(existing?.adaptability_score, feedback.behavioral.adaptability),
    emotional_control_score: blend(
      existing?.emotional_control_score,
      feedback.behavioral.emotionalControl
    ),
    incentives_score: blend(existing?.incentives_score, feedback.behavioral.incentives),
    dominant_trait: feedback.trait,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { data } = await supabaseAdmin
      .from("reasoning_profiles")
      .update(nextProfile)
      .eq("id", existing.id)
      .select("*")
      .single();

    return data;
  }

  const { data } = await supabaseAdmin
    .from("reasoning_profiles")
    .insert(nextProfile)
    .select("*")
    .single();

  return data;
}

async function updateUserProgress(userId: string, feedback: ReasoningFeedback) {
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

  await updateCanonicalUserProgress({
    primaryTrait: feedback.trait || existing.primary_trait,
    profileId: userId,
    rank: nextRank,
    reasoningScore: nextScore,
    streak: nextStreak,
    xp: nextXp,
  });

  return {
    evolvedTrait,
    reasoningProfile,
    rank: nextRank,
    reasoningScore: nextScore,
    streak: nextStreak,
    xp: nextXp,
  };
}

async function persistSession({
  categoryPrompt,
  challenge,
  challengeId,
  conversationId,
  feedback,
  memory,
  mode,
  response,
  sessionId,
  thinkingLens,
  userId,
}: {
  categoryPrompt: CategoryPrompt;
  challenge: string;
  challengeId?: string;
  conversationId: string;
  feedback: ReasoningFeedback;
  memory?: any;
  mode: string;
  response: string;
  sessionId: string;
  thinkingLens?: string;
  userId?: string;
}) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !userId) {
    return null;
  }

  await supabaseAdmin.from("reasoning_sessions").insert({
    user_id: userId,
    session_id: sessionId,
    conversation_id: conversationId,
    challenge_id: challengeId || "daily",
    challenge_category: categoryPrompt.category,
    prompt: challenge,
    response,
    ai_analysis: feedback.analysis,
    contrarian_response: feedback.contrarian,
    follow_up: feedback.followUp,
    reasoning_score: feedback.score,
    xp_awarded: feedback.xp,
    trait_detected: feedback.trait,
    strengths: feedback.strengths,
    weaknesses: feedback.weaknesses,
    verifier_score: feedback.verifier.score,
    orchestration_category: categoryPrompt.category,
    cadence_key: mode,
    memory_snapshot: memory || null,
  });

  await supabaseAdmin.from("reasoning_followups").insert({
    user_id: userId,
    session_id: sessionId,
    conversation_id: conversationId,
    challenge_id: challengeId || "daily",
    challenge_category: categoryPrompt.category,
    follow_up: feedback.followUp,
    cadence_key: mode,
  });

  await supabaseAdmin.from("reasoning_verifier_scores").insert({
    user_id: userId,
    session_id: sessionId,
    conversation_id: conversationId,
    challenge_id: challengeId || "daily",
    challenge_category: categoryPrompt.category,
    ai_score: feedback.score,
    verifier_score: feedback.verifier.score,
    blended_score: feedback.score,
    rubric: categoryPrompt.reasoningLens.join(", "),
    signals: feedback.verifier,
  });

  await persistCanonicalConversation({
    category: categoryPrompt.category,
    challenge,
    challengeId,
    claim: response,
    conversationId,
    feedback,
    memory,
    sessionId,
    thinkingLens,
    userId,
  });

  return updateUserProgress(userId, feedback);
}

function jsonStreamEvent(type: string, payload: unknown) {
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

async function callOpenAi({
  apiKey,
  categoryPrompt,
  challenge,
  conversationId,
  language,
  memory,
  mode,
  profile,
  response,
  sessionId,
  stream,
  thinkingLens,
  verifier,
}: {
  apiKey: string;
  categoryPrompt: CategoryPrompt;
  challenge: string;
  conversationId: string;
  language: "en" | "es" | "fr";
  memory?: any;
  mode: string;
  profile?: any;
  response: string;
  sessionId: string;
  stream: boolean;
  thinkingLens?: string;
  verifier: VerifierResult;
}) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: categoryPrompt.temperature,
      stream,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildAdaptiveSystemPrompt({
            categoryPrompt,
            conversationId,
            language,
            memory,
            mode,
            profile,
            sessionId,
            verifier,
          }),
        },
        {
          role: "user",
          content: JSON.stringify({
            challenge,
            priorSessions: memory?.recentPatterns || [],
            response,
            thinkingLens,
          }),
        },
      ],
    }),
  });
}

async function nonStreamingFeedback(args: Parameters<typeof callOpenAi>[0]) {
  const aiResponse = await callOpenAi({ ...args, stream: false });

  if (!aiResponse.ok) {
    throw new Error("OpenAI reasoning request failed.");
  }

  const data = await aiResponse.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty reasoning response.");
  }

  return JSON.parse(content);
}

function streamingFeedback(args: {
  apiKey: string;
  categoryPrompt: CategoryPrompt;
  challenge: string;
  challengeId?: string;
  conversationId: string;
  language: "en" | "es" | "fr";
  memory?: any;
  mode: string;
  profile?: any;
  response: string;
  sessionId: string;
  thinkingLens?: string;
  userId?: string;
  verifier: VerifierResult;
}) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            jsonStreamEvent("orchestration", {
              category: args.categoryPrompt.category,
              conversationId: args.conversationId,
              mode: args.mode,
              sessionId: args.sessionId,
              verifier: args.verifier,
            })
          )
        );

        const aiResponse = await callOpenAi({ ...args, stream: true });

        if (!aiResponse.ok || !aiResponse.body) {
          throw new Error("OpenAI streaming request failed.");
        }

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
            const delta = parsed?.choices?.[0]?.delta?.content || "";

            if (delta) {
              content += delta;
              controller.enqueue(encoder.encode(jsonStreamEvent("token", { token: delta })));
            }
          }
        }

        const parsed = JSON.parse(content);
        const feedback = sanitizeFeedback(parsed, args.verifier, args.categoryPrompt);
        const progression = await persistSession({ ...args, feedback });

        controller.enqueue(
          encoder.encode(
            jsonStreamEvent("final", {
              source: "openai",
              memory: args.memory,
              mode: args.mode,
              onboardingProfile: args.profile,
              progression,
              ...feedback,
            })
          )
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            jsonStreamEvent("error", {
              error:
                error instanceof Error
                  ? error.message
                  : "Reasoning stream failed before completion.",
            })
          )
        );
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
    const language: "en" | "es" | "fr" =
      body.language === "es" || body.language === "fr" ? body.language : "en";
    const response = body.response?.trim() || "";

    if (!response) {
      return NextResponse.json(
        { error: "A response is required before reasoning can be analyzed." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is required for adaptive reasoning. Static fallback is disabled." },
        { status: 503 }
      );
    }

    const category = normalizeCategory(body.category, challenge);
    const categoryPrompt = categoryPromptMap[category];
    const memory = await getReasoningMemory(userId);
    const profile = await loadProfile(userId);
    const verifier = verifierEngine(response, category);
    const modeSeed = stableModeSeed({
      category,
      challenge,
      conversationId,
      memory,
      response,
      sessionId,
    });
    const mode = randomizedResponseModes[modeSeed % randomizedResponseModes.length];
    const wantsStream =
      body.stream === true || request.headers.get("accept")?.includes("text/event-stream");

    const openAiArgs = {
      apiKey,
      categoryPrompt,
      challenge,
      conversationId,
      language,
      memory,
      mode,
      profile,
      response,
      sessionId,
      stream: false,
      thinkingLens: body.thinkingLens,
      verifier,
    };

    if (wantsStream) {
      return streamingFeedback({
        ...openAiArgs,
        challengeId: body.challengeId,
        thinkingLens: body.thinkingLens,
        userId,
      });
    }

    const parsed = await nonStreamingFeedback(openAiArgs);
    const feedback = sanitizeFeedback(parsed, verifier, categoryPrompt);
    const progression = await persistSession({
      categoryPrompt,
      challenge,
      challengeId: body.challengeId,
      conversationId,
      feedback,
      memory,
      mode,
      response,
      sessionId,
      thinkingLens: body.thinkingLens,
      userId,
    });

    return NextResponse.json({
      source: "openai",
      memory,
      mode,
      onboardingProfile: profile,
      progression,
      ...feedback,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Reasoning analysis failed. Try again with a clearer response.",
      },
      { status: 500 }
    );
  }
}

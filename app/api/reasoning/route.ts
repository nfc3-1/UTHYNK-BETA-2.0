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

type ReasoningRequest = {
  challenge?: string;
  challengeId?: string;
  category?: string;
  response?: string;
  stream?: boolean;
  userId?: string;
};

type CategoryOrchestration = {
  category: string;
  cadenceKey: string;
  coachingMode: string;
  followUpMode: string;
  scoringFocus: string[];
  traitHints: string[];
  verifierRubric: string;
  responseShape: string;
  temperature: number;
};

type ReasoningFeedback = {
  score: number;
  xp: number;
  trait: string;
  analysis: string;
  contrarian: string;
  followUp: string;
  strengths: string[];
  weaknesses: string[];
  verifier?: Record<string, unknown>;
};

const CATEGORY_PLAYBOOKS: Record<string, Omit<CategoryOrchestration, "category" | "cadenceKey" | "responseShape">> = {
  debate: {
    coachingMode: "argument-map coach",
    followUpMode: "force the strongest counterargument or missing warrant",
    scoringFocus: ["claim clarity", "evidence quality", "counterargument handling"],
    traitHints: ["Intellectual Flexibility", "Evidence Discipline"],
    verifierRubric: "Reward explicit claims, evidence, concessions, and clean rebuttals.",
    temperature: 0.55,
  },
  decisions: {
    coachingMode: "decision-quality strategist",
    followUpMode: "surface tradeoffs, reversibility, timing, and second-order consequences",
    scoringFocus: ["tradeoffs", "incentives", "risk", "next action"],
    traitHints: ["Strategic Restraint", "Risk Calibration"],
    verifierRubric: "Reward alternatives, risk sizing, sequencing, and clear action.",
    temperature: 0.42,
  },
  ethics: {
    coachingMode: "principled ethics examiner",
    followUpMode: "test the principle against a hard edge case",
    scoringFocus: ["principles", "stakeholders", "edge cases", "harm analysis"],
    traitHints: ["Principled Reasoning", "Perspective Taking"],
    verifierRubric: "Reward named stakeholders, consistent principles, and edge-case handling.",
    temperature: 0.5,
  },
  creative: {
    coachingMode: "creative reframing coach",
    followUpMode: "ask for a sharper metaphor, constraint, or alternative frame",
    scoringFocus: ["originality", "constraint use", "specificity", "useful reframing"],
    traitHints: ["Creative Reframing", "Adaptive Thinking"],
    verifierRubric: "Reward non-obvious framing, useful constraints, and concrete examples.",
    temperature: 0.68,
  },
  general: {
    coachingMode: "adaptive reasoning coach",
    followUpMode: "target the weakest missing reasoning move",
    scoringFocus: ["clarity", "evidence", "incentives", "consequences"],
    traitHints: ["Tactical Thinking", "Analytical Discipline"],
    verifierRubric: "Reward clear logic, evidence, tradeoffs, and actionable next steps.",
    temperature: 0.48,
  },
};

const RESPONSE_SHAPES = [
  "Start with the main reasoning pattern, then name one precise upgrade.",
  "Open with the hidden assumption, then give a practical pressure test.",
  "Lead with the strongest move, then contrast it with the biggest blind spot.",
  "Frame the feedback as a decision checkpoint with one concrete next move.",
];

function normalizeCategory(category?: string, challenge?: string) {
  const source = `${category || ""} ${challenge || ""}`.toLowerCase();

  if (/debate|argument|persuad|claim|rebuttal/.test(source)) return "debate";
  if (/ethic|moral|fair|harm|justice|stakeholder/.test(source)) return "ethics";
  if (/creative|invent|story|imagine|reframe|design/.test(source)) return "creative";
  if (/decision|choose|risk|tradeoff|career|money|plan|strategy/.test(source)) return "decisions";

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

function buildOrchestration(
  category?: string,
  challenge?: string,
  response?: string,
  memory?: any
): CategoryOrchestration {
  const normalized = normalizeCategory(category, challenge);
  const playbook = CATEGORY_PLAYBOOKS[normalized] || CATEGORY_PLAYBOOKS.general;
  const seed = hashText(
    `${normalized}:${challenge || ""}:${response || ""}:${memory?.recentPatterns?.length || 0}`
  );

  return {
    ...playbook,
    category: normalized,
    cadenceKey: `${normalized}-${seed % 997}`,
    responseShape: RESPONSE_SHAPES[seed % RESPONSE_SHAPES.length],
  };
}

function buildAdaptiveSystemPrompt({
  profile,
  memory,
  orchestration,
}: {
  profile?: any;
  memory?: any;
  orchestration: CategoryOrchestration;
}) {
  const ageBand = profile?.age_band || "18_plus";
  const style = profile?.onboarding_style || "balanced";
  const goal = profile?.onboarding_goal || "sharpen_reasoning";
  const recentFollowUps = memory?.recentFollowUps?.filter(Boolean).slice(0, 5) || [];

  let coachingTone = "Use balanced Socratic reasoning with concise strategic feedback.";

  if (ageBand === "under_13") {
    coachingTone =
      "Use gentle guidance. Avoid aggressive contrarian pressure. Focus on curiosity and reasoning fundamentals.";
  } else if (ageBand === "13_17") {
    coachingTone = "Use light Socratic challenge and constructive pushback without hostility.";
  }

  if (style === "contrarian") {
    coachingTone += " Increase intellectual pushback and steelman opposing viewpoints strongly.";
  }

  if (style === "supportive") {
    coachingTone += " Prioritize encouragement and confidence-building while still challenging assumptions carefully.";
  }

  return [
    `You are UThynk, a category-conditioned adaptive AI reasoning coach.`,
    coachingTone,
    `Current orchestration: ${orchestration.coachingMode}.`,
    `User goal: ${goal}.`,
    `Score primarily on: ${orchestration.scoringFocus.join(", ")}.`,
    `Verifier rubric: ${orchestration.verifierRubric}`,
    `Cadence rule: ${orchestration.responseShape}`,
    `Follow-up rule: ${orchestration.followUpMode}.`,
    `Avoid repeating these recent follow-ups: ${JSON.stringify(recentFollowUps)}.`,
    `Use persistent traits and memory only as context, not as destiny: ${JSON.stringify(memory || null)}.`,
    "Do not use generic template phrasing. Make the analysis specific to the challenge, category, and response.",
    "Do not give legal, medical, or financial advice.",
    "Return only valid JSON with keys: score number 0-100, xp number, trait string, analysis string, contrarian string, followUp string, strengths string[], weaknesses string[].",
  ].join(" ");
}

function clampScore(score: unknown) {
  const numeric = Number(score);

  if (!Number.isFinite(numeric)) {
    return 70;
  }

  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function uniqList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return Array.from(new Set(items)).slice(0, 4);
}

function localVerifier(response: string, orchestration: CategoryOrchestration) {
  const lower = response.toLowerCase();
  const words = response.trim() ? response.trim().split(/\s+/).length : 0;
  const signals = {
    evidence: /\b(because|evidence|data|example|for instance|shows)\b/.test(lower),
    tradeoff: /\b(tradeoff|risk|cost|benefit|however|although|but)\b/.test(lower),
    action: /\b(next|then|first|step|would|will|should)\b/.test(lower),
    perspective: /\b(they|their|someone|stakeholder|opponent|other side)\b/.test(lower),
  };

  const signalScore = Object.values(signals).filter(Boolean).length * 8;
  const lengthScore = Math.min(34, Math.floor(words * 1.2));
  const categoryBonus =
    orchestration.category === "debate" && signals.evidence && signals.perspective
      ? 8
      : orchestration.category === "decisions" && signals.tradeoff && signals.action
        ? 8
        : orchestration.category === "ethics" && signals.perspective && signals.tradeoff
          ? 8
          : 0;

  return {
    score: Math.min(92, Math.max(45, 44 + lengthScore + signalScore + categoryBonus)),
    signals,
    rubric: orchestration.verifierRubric,
  };
}

function buildFallbackFollowUp(orchestration: CategoryOrchestration, response: string) {
  const prompts: Record<string, string[]> = {
    debate: [
      "What is the strongest objection to your claim, and what evidence would actually answer it?",
      "Which assumption would an intelligent opponent attack first?",
    ],
    decisions: [
      "What option preserves the most upside while limiting the worst downside?",
      "What would change your mind before you commit to the next step?",
    ],
    ethics: [
      "Which stakeholder pays the largest hidden cost, and what principle explains your answer?",
      "Does your reasoning still hold if the roles are reversed?",
    ],
    creative: [
      "What constraint would make this idea sharper instead of broader?",
      "What is a more surprising frame that still solves the same problem?",
    ],
    general: [
      "What evidence would most improve or weaken your current reasoning?",
      "What is the next concrete step that tests your assumption fastest?",
    ],
  };
  const options = prompts[orchestration.category] || prompts.general;

  return options[hashText(`${response}:${orchestration.cadenceKey}`) % options.length];
}

function normalizeFeedback(
  parsed: Partial<ReasoningFeedback>,
  response: string,
  orchestration: CategoryOrchestration,
  memory?: any
): ReasoningFeedback {
  const verifier = localVerifier(response, orchestration);
  const aiScore = clampScore(parsed.score);
  const score = Math.round(aiScore * 0.72 + verifier.score * 0.28);
  const recentFollowUps: string[] = memory?.recentFollowUps || [];
  let followUp = String(parsed.followUp || "").trim();

  if (!followUp || recentFollowUps.some((recent) => recent.toLowerCase() === followUp.toLowerCase())) {
    followUp = buildFallbackFollowUp(orchestration, response);
  }

  return {
    score,
    xp: Math.max(25, Math.min(90, Number(parsed.xp) || (score >= 82 ? 65 : score >= 70 ? 50 : 35))),
    trait: String(parsed.trait || orchestration.traitHints[0]).trim(),
    analysis:
      String(parsed.analysis || "").trim() ||
      "Your response has the start of a useful reasoning pattern, but it needs clearer evidence, tradeoffs, and a sharper next step.",
    contrarian:
      String(parsed.contrarian || "").trim() ||
      "What if the part that feels most obvious is the part most worth testing?",
    followUp,
    strengths: uniqList(parsed.strengths, [orchestration.scoringFocus[0], orchestration.traitHints[0]]),
    weaknesses: uniqList(parsed.weaknesses, ["needs clearer evidence", "sharpen the next action"]),
    verifier: {
      ...verifier,
      aiScore,
      blendedScore: score,
      cadenceKey: orchestration.cadenceKey,
    },
  };
}

const fallbackAnalysis = (
  response: string,
  orchestration: CategoryOrchestration,
  memory?: any
) => {
  const verifier = localVerifier(response, orchestration);

  return normalizeFeedback(
    {
      score: verifier.score,
      xp: verifier.score >= 75 ? 55 : 40,
      trait: orchestration.traitHints[0],
      analysis:
        response.trim().split(/\s+/).length < 25
          ? `Your ${orchestration.category} response is too brief to show full reasoning. Add ${orchestration.scoringFocus.slice(0, 3).join(", ")}.`
          : `Your response shows initial judgment. The strongest upgrade is to make ${orchestration.scoringFocus[0]} and ${orchestration.scoringFocus[1]} explicit.`,
      contrarian: "What if your first interpretation is directionally right but missing the incentive that changes the outcome?",
      followUp: buildFallbackFollowUp(orchestration, response),
      strengths: [orchestration.scoringFocus[0], orchestration.traitHints[0]],
      weaknesses: [`needs stronger ${orchestration.scoringFocus[1]}`, "make the next step testable"],
    },
    response,
    orchestration,
    memory
  );
};

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

  return { traitName, traitScore: nextScore };
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

  const nextXp = (existing.xp || 0) + (feedback.xp || 0);
  const nextScore = calculateReasoningScore(existing.reasoning_score || 70, feedback.score || 70);
  const nextStreak = calculateNextStreak(existing.updated_at || null, existing.streak || 0);
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
  memory,
  orchestration,
}: {
  userId?: string;
  challengeId?: string;
  category?: string;
  challenge: string;
  response: string;
  feedback: ReasoningFeedback;
  memory?: any;
  orchestration: CategoryOrchestration;
}) {
  if (!hasSupabaseAdminEnv() || !supabaseAdmin || !userId) {
    return null;
  }

  await supabaseAdmin.from("reasoning_sessions").insert({
    user_id: userId,
    challenge_id: challengeId || "daily",
    challenge_category: category || orchestration.category,
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
    verifier_score: feedback.verifier?.blendedScore || feedback.score,
    orchestration_category: orchestration.category,
    cadence_key: orchestration.cadenceKey,
    memory_snapshot: memory || null,
  });

  await supabaseAdmin.from("reasoning_followups").insert({
    user_id: userId,
    challenge_id: challengeId || "daily",
    challenge_category: category || orchestration.category,
    follow_up: feedback.followUp,
    cadence_key: orchestration.cadenceKey,
  });

  await supabaseAdmin.from("reasoning_verifier_scores").insert({
    user_id: userId,
    challenge_id: challengeId || "daily",
    challenge_category: category || orchestration.category,
    ai_score: feedback.verifier?.aiScore || feedback.score,
    verifier_score: feedback.verifier?.score || feedback.score,
    blended_score: feedback.score,
    rubric: orchestration.verifierRubric,
    signals: feedback.verifier || {},
  });

  return updateUserProgress(userId, feedback);
}

function jsonStreamEvent(type: string, payload: unknown) {
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

async function callOpenAi({
  apiKey,
  profile,
  memory,
  orchestration,
  challenge,
  response,
  stream,
}: {
  apiKey: string;
  profile?: any;
  memory?: any;
  orchestration: CategoryOrchestration;
  challenge: string;
  response: string;
  stream: boolean;
}) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: orchestration.temperature,
      stream,
      messages: [
        {
          role: "system",
          content: buildAdaptiveSystemPrompt({ profile, memory, orchestration }),
        },
        {
          role: "user",
          content: JSON.stringify({
            challenge,
            userResponse: response,
            category: orchestration.category,
            historicalMemory: memory,
            onboardingProfile: profile,
            orchestration,
          }),
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
}

async function nonStreamingFeedback(args: {
  apiKey: string;
  profile?: any;
  memory?: any;
  orchestration: CategoryOrchestration;
  challenge: string;
  response: string;
}) {
  const aiResponse = await callOpenAi({ ...args, stream: false });

  if (!aiResponse.ok) {
    return null;
  }

  const data = await aiResponse.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function streamingFeedback(args: {
  apiKey: string;
  profile?: any;
  memory?: any;
  orchestration: CategoryOrchestration;
  challenge: string;
  response: string;
  userId?: string;
  challengeId?: string;
  category?: string;
}) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(jsonStreamEvent("orchestration", args.orchestration))
        );

        const aiResponse = await callOpenAi({ ...args, stream: true });

        if (!aiResponse.ok || !aiResponse.body) {
          const fallback = fallbackAnalysis(args.response, args.orchestration, args.memory);
          const progression = await persistSession({ ...args, feedback: fallback });
          const coachMessage = `${fallback.analysis}\n\nPushback: ${fallback.contrarian}\n\nNext Challenge: ${fallback.followUp}`;

          for (let index = 0; index < coachMessage.length; index += 24) {
            controller.enqueue(
              encoder.encode(jsonStreamEvent("delta", { delta: coachMessage.slice(index, index + 24) }))
            );
          }

          controller.enqueue(
            encoder.encode(jsonStreamEvent("final", {
              source: "fallback",
              memory: args.memory,
              orchestration: args.orchestration,
              progression,
              ...fallback,
            }))
          );
          controller.close();
          return;
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
            }
          }
        }

        const parsed = JSON.parse(content);
        const feedback = normalizeFeedback(parsed, args.response, args.orchestration, args.memory);
        const progression = await persistSession({ ...args, feedback });
        const coachMessage = `${feedback.analysis}\n\nPushback: ${feedback.contrarian}\n\nNext Challenge: ${feedback.followUp}`;

        for (let index = 0; index < coachMessage.length; index += 24) {
          controller.enqueue(
            encoder.encode(jsonStreamEvent("delta", { delta: coachMessage.slice(index, index + 24) }))
          );
        }

        controller.enqueue(
          encoder.encode(jsonStreamEvent("final", {
            source: "openai",
            memory: args.memory,
            orchestration: args.orchestration,
            onboardingProfile: args.profile,
            progression,
            ...feedback,
          }))
        );
        controller.close();
      } catch {
        const fallback = fallbackAnalysis(args.response, args.orchestration, args.memory);
        const progression = await persistSession({ ...args, feedback: fallback });
        const coachMessage = `${fallback.analysis}\n\nPushback: ${fallback.contrarian}\n\nNext Challenge: ${fallback.followUp}`;

        for (let index = 0; index < coachMessage.length; index += 24) {
          controller.enqueue(
            encoder.encode(jsonStreamEvent("delta", { delta: coachMessage.slice(index, index + 24) }))
          );
        }

        controller.enqueue(
          encoder.encode(jsonStreamEvent("final", {
            source: "fallback",
            memory: args.memory,
            orchestration: args.orchestration,
            progression,
            ...fallback,
          }))
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
    const challenge = body.challenge?.trim() || "Daily reasoning challenge";
    const response = body.response?.trim() || "";

    if (!response) {
      return NextResponse.json(
        { error: "A response is required before reasoning can be analyzed." },
        { status: 400 }
      );
    }

    const memory = await getReasoningMemory(userId);
    const profile = await loadProfile(userId);
    const orchestration = buildOrchestration(body.category, challenge, response, memory);
    const apiKey = process.env.OPENAI_API_KEY;
    const wantsStream =
      body.stream === true || request.headers.get("accept")?.includes("text/event-stream");

    if (!apiKey) {
      const fallback = fallbackAnalysis(response, orchestration, memory);
      const progression = await persistSession({
        userId,
        challengeId: body.challengeId,
        category: body.category,
        challenge,
        response,
        feedback: fallback,
        memory,
        orchestration,
      });

      return NextResponse.json({
        source: "fallback",
        memory,
        orchestration,
        progression,
        ...fallback,
      });
    }

    if (wantsStream) {
      return streamingFeedback({
        apiKey,
        profile,
        memory,
        orchestration,
        challenge,
        response,
        userId,
        challengeId: body.challengeId,
        category: body.category,
      });
    }

    const parsed = await nonStreamingFeedback({
      apiKey,
      profile,
      memory,
      orchestration,
      challenge,
      response,
    });
    const feedback = parsed
      ? normalizeFeedback(parsed, response, orchestration, memory)
      : fallbackAnalysis(response, orchestration, memory);
    const progression = await persistSession({
      userId,
      challengeId: body.challengeId,
      category: body.category,
      challenge,
      response,
      feedback,
      memory,
      orchestration,
    });

    return NextResponse.json({
      source: parsed ? "openai" : "fallback",
      memory,
      orchestration,
      onboardingProfile: profile,
      progression,
      ...feedback,
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

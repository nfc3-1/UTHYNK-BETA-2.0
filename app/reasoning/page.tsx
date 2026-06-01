"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { adaptChallengeForAge, ageBandLabel, normalizeAgeBand } from "@/lib/ageAdaptivePrompts";
import { challenges, getChallengeById, type Challenge } from "@/lib/challenges";
import { createTelemetryEvent, trackEvent } from "@/lib/telemetry";
import {
  cognitionFeedByLanguage,
  languageOptions,
  localizeChallenge,
  localizeText,
  type Language,
  uiCopy,
} from "@/lib/reasoningI18n";
import { slugifyCategory } from "@/lib/questionBank";

const initialFeedback = {
  score: 72,
  xp: 45,
  trait: "Tactical Thinking",
  analysis:
    "A strong answer should protect your reputation without reacting emotionally or escalating too early.",
  contrarian:
    "What if your first instinct creates a second problem while a calmer response builds leverage?",
  followUp:
    "What specific next step protects your position without overreacting?",
  strengths: ["strategic restraint", "long-term awareness"],
  verifier: {
    behavioral: {
      adaptability: 70,
      emotionalControl: 72,
      evidence: 68,
      incentives: 66,
    },
    score: 72,
    signals: {
      incentives: false,
    },
  },
  weaknesses: ["needs incentive analysis", "clarify the next step"],
};

const categoryLinks = Array.from(
  new Set(challenges.map((challenge) => challenge.category))
);

const rankThresholds = [
  { rank: "Observer", xp: 0 },
  { rank: "Analyst", xp: 500 },
  { rank: "Strategist", xp: 1500 },
  { rank: "Architect", xp: 3500 },
  { rank: "Philosopher", xp: 6000 },
  { rank: "Master of Thought", xp: 10000 },
];

const thinkingLenses = [
  { id: "logic", labelKey: "lensLogic" },
  { id: "incentives", labelKey: "lensIncentives" },
  { id: "ethics", labelKey: "lensEthics" },
  { id: "history", labelKey: "lensHistory" },
  { id: "strategy", labelKey: "lensStrategy" },
] as const;

const onboardingCopy = {
  en: {
    title: "How to use UThynk",
    intro:
      "UThynk is a reasoning trainer. Pick a lens, answer the active question, then use the feedback to sharpen your next response.",
    steps: [
      {
        title: "Choose a thinking lens",
        text: "Logic checks structure, incentives checks motives, ethics checks values, history checks patterns, and strategy checks long-term tradeoffs.",
      },
      {
        title: "Answer in your own words",
        text: "A few clear sentences are enough. Add an example, a reason, or a counterargument when you can.",
      },
      {
        title: "Review the challenge",
        text: "UThynk gives a contradiction prompt, follow-up, evidence score, and growth signal so you can improve the next answer.",
      },
      {
        title: "Switch categories anytime",
        text: "Use the right-side categories to practice work, money, media, literature, science, identity, and more.",
      },
    ],
    close: "Start thinking",
    reopen: "How to use",
  },
  es: {
    title: "Cómo usar UThynk",
    intro:
      "UThynk entrena tu razonamiento. Elige un enfoque, responde la pregunta activa y usa la retroalimentación para mejorar tu siguiente respuesta.",
    steps: [
      {
        title: "Elige un enfoque",
        text: "Lógica revisa estructura, incentivos revisa motivos, ética revisa valores, historia revisa patrones y estrategia revisa consecuencias.",
      },
      {
        title: "Responde con tus palabras",
        text: "Unas frases claras bastan. Agrega un ejemplo, una razón o un contraargumento cuando puedas.",
      },
      {
        title: "Revisa el reto",
        text: "UThynk muestra una contradicción, una pregunta de seguimiento, evidencia y una señal de crecimiento.",
      },
      {
        title: "Cambia de categoría",
        text: "Usa las categorías de la derecha para practicar trabajo, dinero, medios, literatura, ciencia, identidad y más.",
      },
    ],
    close: "Empezar",
    reopen: "Cómo usar",
  },
  fr: {
    title: "Comment utiliser UThynk",
    intro:
      "UThynk entraîne ton raisonnement. Choisis une lentille, réponds à la question active, puis utilise le retour pour améliorer ta prochaine réponse.",
    steps: [
      {
        title: "Choisis une lentille",
        text: "Logique vérifie la structure, incitations vérifie les motivations, éthique vérifie les valeurs, histoire vérifie les modèles et stratégie vérifie les compromis.",
      },
      {
        title: "Réponds avec tes mots",
        text: "Quelques phrases claires suffisent. Ajoute un exemple, une raison ou un contre-argument quand tu peux.",
      },
      {
        title: "Analyse le défi",
        text: "UThynk donne une contradiction, une question de suivi, un score d'évidence et un signal de progression.",
      },
      {
        title: "Change de catégorie",
        text: "Utilise les catégories à droite pour pratiquer travail, argent, médias, littérature, science, identité et plus.",
      },
    ],
    close: "Commencer",
    reopen: "Mode d'emploi",
  },
} satisfies Record<Language, {
  title: string;
  intro: string;
  steps: Array<{ title: string; text: string }>;
  close: string;
  reopen: string;
}>;

const thinkingToolCopy = {
  en: {
    section: "Thinking Tools",
    challenge: "Challenge",
    followUp: "Follow-Up",
    lab: "Lab",
    timeline: "Timeline",
    position: "Your position",
    support: "What backs it up?",
    opposition: "Strongest challenge",
    assumptions: "Hidden assumptions",
  },
  es: {
    section: "Herramientas de pensamiento",
    challenge: "Reto",
    followUp: "Seguimiento",
    lab: "Laboratorio",
    timeline: "Línea",
    position: "Tu posición",
    support: "Qué la respalda",
    opposition: "Mayor reto",
    assumptions: "Supuestos ocultos",
  },
  fr: {
    section: "Outils de pensée",
    challenge: "Défi",
    followUp: "Suivi",
    lab: "Labo",
    timeline: "Parcours",
    position: "Ta position",
    support: "Ce qui l'appuie",
    opposition: "Défi le plus fort",
    assumptions: "Hypothèses cachées",
  },
} satisfies Record<Language, {
  section: string;
  challenge: string;
  followUp: string;
  lab: string;
  timeline: string;
  position: string;
  support: string;
  opposition: string;
  assumptions: string;
}>;

function getProgressionState(xp: number) {
  const currentIndex = rankThresholds.findLastIndex((item) => xp >= item.xp);
  const current = rankThresholds[Math.max(0, currentIndex)];
  const next = rankThresholds[Math.min(rankThresholds.length - 1, currentIndex + 1)];

  if (!next || current.rank === next.rank) {
    return { percent: 100, value: `${xp} XP` };
  }

  const earnedInRank = xp - current.xp;
  const neededForRank = next.xp - current.xp;
  const percent = Math.max(4, Math.min(100, Math.round((earnedInRank / neededForRank) * 100)));

  return { percent, value: `${xp} XP` };
}

function ReasoningExperience({
  language,
}: {
  language: Language;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChallenge = useMemo(() => {
    const requestedId = searchParams.get("id");

    if (requestedId) {
      return getChallengeById(requestedId);
    }

    if (typeof window === "undefined") {
      return getChallengeById();
    }

    const seenIds = JSON.parse(
      localStorage.getItem("uthynk-seen-challenge-ids") || "[]"
    ) as string[];
    const freshPool = challenges.filter((item) => !seenIds.includes(item.id));
    const pool = freshPool.length ? freshPool : challenges;

    return pool[Math.floor(Math.random() * pool.length)] || getChallengeById();
  }, [searchParams]);
  const [challenge, setChallenge] = useState<Challenge>(initialChallenge);

  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");
  const [difficulty, setDifficulty] = useState(challenge.difficulty);
  const [pressure, setPressure] = useState("Moderate");
  const [profile, setProfile] = useState<any>(null);
  const [rightTab, setRightTab] = useState<"categories" | "insights" | "analysis">("insights");
  const [thinkingToolTab, setThinkingToolTab] = useState<"challenge" | "followUp" | "lab" | "timeline">("challenge");
  const [leftSignalTab, setLeftSignalTab] = useState<"patterns" | "metrics">("patterns");
  const [thinkingLens, setThinkingLens] = useState<(typeof thinkingLenses)[number]["id"]>("logic");
  const [evaluatedClaim, setEvaluatedClaim] = useState("");
  const [latestReward, setLatestReward] = useState<any>(null);
  const [feedback, setFeedback] = useState({
    ...initialFeedback,
    trait: challenge.trait,
  });
  const [freePassUsed, setFreePassUsed] = useState(0);
  const [conversation, setConversation] = useState<any[]>([
    {
      role: "uthynk",
      content:
        "Welcome back. I remember your previous reasoning patterns. Let's continue sharpening your thinking.",
    },
  ]);
  const copy = uiCopy[language];
  const toolsCopy = thinkingToolCopy[language];
  const ageBand = normalizeAgeBand(profile?.age_band);
  const ageAdjustedChallenge = adaptChallengeForAge(challenge, ageBand);
  const visibleChallenge = localizeChallenge(ageAdjustedChallenge, language);
  const visibleFeedback = {
    ...feedback,
    analysis: localizeText(feedback.analysis, language),
    contrarian: localizeText(feedback.contrarian, language),
    followUp: localizeText(feedback.followUp, language),
    trait: localizeText(feedback.trait, language),
    strengths: feedback.strengths.map((item) => localizeText(item, language)),
    weaknesses: feedback.weaknesses.map((item) => localizeText(item, language)),
  };
  const visibleCategoryLinks = categoryLinks.map((category) => {
    const matchingChallenge = challenges.find((item) => item.category === category);

    return {
      category,
      href: `/lessons/${slugifyCategory(category)}`,
      label: matchingChallenge
        ? localizeChallenge(matchingChallenge, language).category
        : category,
    };
  });
  const visibleDifficulty = localizeText(difficulty, language);
  const visiblePressure = localizeText(pressure, language);
  const progressionState = getProgressionState(profile?.xp || 0);

  const recognitionRef = useRef<any>(null);
  const conversationIdRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedProfile = localStorage.getItem("uthynk-profile");
    const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;
    setProfile(parsedProfile);
    setFreePassUsed(Number(localStorage.getItem("uthynk-free-pass-used") || "0"));
    trackEvent(
      createTelemetryEvent("reasoning_arrived", parsedProfile?.id, {
        challengeId: challenge.id,
        category: challenge.category,
      })
    );
    const today = new Date().toISOString().slice(0, 10);
    const lastVisit = localStorage.getItem("uthynk-last-visit-date");

    if (lastVisit && lastVisit !== today) {
      trackEvent(
        createTelemetryEvent("returned_next_day", parsedProfile?.id, {
          lastVisit,
          returnedAt: today,
        })
      );
    }

    localStorage.setItem("uthynk-last-visit-date", today);

    conversationIdRef.current =
      conversationIdRef.current ||
      localStorage.getItem("uthynk-conversation-id") ||
      crypto.randomUUID();
    sessionIdRef.current = crypto.randomUUID();
    localStorage.setItem("uthynk-conversation-id", conversationIdRef.current);
    localStorage.setItem(
      "uthynk-seen-challenge-ids",
      JSON.stringify(
        Array.from(
          new Set([
            ...JSON.parse(localStorage.getItem("uthynk-seen-challenge-ids") || "[]"),
            challenge.id,
          ])
        )
      )
    );

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === "es" ? "es-US" : language === "fr" ? "fr-FR" : "en-US";

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ');

      setResponse(transcript);
    };

    recognitionRef.current = recognition;
  }, [challenge.id, language]);

  function selectNextChallenge(currentChallenge: Challenge, score: number) {
    const preferredDifficulty =
      score >= 88 ? "strategic" : score >= 76 ? "critical" : score >= 62 ? "practical" : "everyday";
    const seenIds =
      typeof window === "undefined"
        ? []
        : (JSON.parse(localStorage.getItem("uthynk-seen-challenge-ids") || "[]") as string[]);
    const categoryPool = challenges.filter(
      (item) =>
        item.id !== currentChallenge.id &&
        item.category === currentChallenge.category &&
        !seenIds.includes(item.id)
    );
    const difficultyPool = challenges.filter(
      (item) =>
        item.id !== currentChallenge.id &&
        item.difficulty === preferredDifficulty &&
        !seenIds.includes(item.id)
    );
    const freshPool = challenges.filter(
      (item) => item.id !== currentChallenge.id && !seenIds.includes(item.id)
    );
    const fallbackPool = challenges.filter((item) => item.id !== currentChallenge.id);
    const pool = categoryPool.length
      ? categoryPool
      : difficultyPool.length
        ? difficultyPool
        : freshPool.length
          ? freshPool
          : fallbackPool;
    const seed = Date.now() + score + currentChallenge.id.length;

    return pool[seed % pool.length] || currentChallenge;
  }

  function selectCategory(category: string) {
    const seenIds =
      typeof window === "undefined"
        ? []
        : (JSON.parse(localStorage.getItem("uthynk-seen-challenge-ids") || "[]") as string[]);
    const categoryPool = challenges.filter(
      (item) => item.category === category && !seenIds.includes(item.id)
    );
    const fallbackPool = challenges.filter((item) => item.category === category);
    const pool = categoryPool.length ? categoryPool : fallbackPool;
    const nextChallenge = pool[(Date.now() + category.length) % pool.length];

    if (!nextChallenge) return;

    setChallenge(nextChallenge);
    setDifficulty(nextChallenge.difficulty);
    setPressure(
      nextChallenge.difficulty === "strategic" || nextChallenge.difficulty === "critical"
        ? "High"
        : nextChallenge.difficulty === "everyday"
          ? "Low"
          : "Moderate"
    );
    setResponse("");
    setStreamingText("");
    setError("");
    trackEvent(
      createTelemetryEvent("selected_category", profile?.id, {
        category,
        challengeId: nextChallenge.id,
        source: "reasoning_right_rail",
      })
    );

    if (typeof window !== "undefined") {
      const nextSeen = Array.from(new Set([...seenIds, nextChallenge.id]));
      localStorage.setItem("uthynk-seen-challenge-ids", JSON.stringify(nextSeen));
      const currentPath = window.location.pathname === "/" ? "/" : "/reasoning";
      window.history.replaceState(null, "", `${currentPath}?id=${nextChallenge.id}`);
    }
  }

  function startVoiceInput() {
    recognitionRef.current?.start();
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
  }

  async function analyzeReasoning() {
    try {
      setLoading(true);
      setError("");
      setStreamingText("");
      let activeProfile: any = null;

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("uthynk-profile");
        activeProfile = stored ? JSON.parse(stored) : null;
        const used = Number(localStorage.getItem("uthynk-free-pass-used") || "0");

        if (!activeProfile?.id && used >= 3) {
          router.push("/login?reason=free-pass");
          return;
        }
      }

      setConversation((prev) => [
        ...prev,
        {
          role: "user",
          content: response,
        },
      ]);
      trackEvent(
        createTelemetryEvent("submitted_answer", activeProfile?.id, {
          category: challenge.category,
          challengeId: challenge.id,
          language,
          responseLength: response.length,
          thinkingLens,
        })
      );

      const res = await fetch("/api/reasoning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          ageBand,
          category: challenge.category,
          challenge: `${visibleChallenge.prompt}\nThinking lens: ${thinkingLens}`,
          language,
          response,
          conversationId: conversationIdRef.current,
          sessionId: sessionIdRef.current,
          thinkingLens,
          userId: activeProfile?.id,
          stream: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === "auth_required") {
          router.push("/login?reason=free-pass");
          return;
        }
        setError(data.error || "Reasoning analysis failed.");
        return;
      }

      if (!res.body) {
        setError("Reasoning stream did not start.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let data: any = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const eventType = event
            .split("\n")
            .find((line) => line.startsWith("event:"))
            ?.replace("event:", "")
            .trim();
          const eventData = event
            .split("\n")
            .find((line) => line.startsWith("data:"))
            ?.replace("data:", "")
            .trim();

          if (!eventData) continue;

          const payload = JSON.parse(eventData);

          if (eventType === "token") {
            setStreamingText((prev) => prev + payload.token);
          }

          if (eventType === "final") {
            data = payload;
          }

          if (eventType === "error") {
            setError(payload.error || "Reasoning stream failed.");
          }
        }
      }

      if (!data) {
        setError("Reasoning analysis ended without final feedback.");
        return;
      }

      setEvaluatedClaim(response);
      trackEvent(
        createTelemetryEvent("completed_reasoning_loop", activeProfile?.id, {
          category: challenge.category,
          challengeId: challenge.id,
          freePassUser: !activeProfile?.id,
          score: data.score,
          xp: data.xp,
        })
      );
      if (!activeProfile?.id && typeof window !== "undefined") {
        const nextFreePassUsed = Math.min(
          3,
          Number(localStorage.getItem("uthynk-free-pass-used") || "0") + 1
        );
        localStorage.setItem("uthynk-free-pass-used", String(nextFreePassUsed));
        document.cookie = `uthynk-free-pass-used=${nextFreePassUsed}; path=/; max-age=2592000; SameSite=Lax`;
        setFreePassUsed(nextFreePassUsed);
      }
      setFeedback({ ...data, trait: data.trait || challenge.trait });
      setLatestReward({
        evidenceDelta: Math.max(
          1,
          Math.round(((data.verifier?.behavioral?.evidence || data.score || 70) - 62) / 8)
        ),
        pattern: data.trait || challenge.trait,
        xp: data.xp || 8,
      });

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("uthynk-profile");
        const profile = stored ? JSON.parse(stored) : {};
        const today = new Date().toISOString().slice(0, 10);
        const lastCompleted = localStorage.getItem("uthynk-last-completed-date");
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        const localStreak =
          lastCompleted === today
            ? profile.streak || 0
            : lastCompleted === yesterday
              ? (profile.streak || 0) + 1
              : 1;
        const nextProfile = {
          ...profile,
          xp: data.progression?.xp ?? (profile.xp || 0) + (data.xp || 0),
          streak: data.progression?.streak ?? localStreak,
          rank: data.progression?.rank ?? profile.rank,
          reasoning_score:
            data.progression?.reasoningScore ?? data.score ?? profile.reasoning_score,
          primary_trait:
            data.progression?.evolvedTrait?.traitName ||
            data.trait ||
            profile.primary_trait,
        };

        localStorage.setItem("uthynk-profile", JSON.stringify(nextProfile));
        setProfile(nextProfile);
        localStorage.setItem("uthynk-last-completed-date", today);
        document.cookie = `uthynk-profile=${encodeURIComponent(
          JSON.stringify(nextProfile)
        )}; path=/; max-age=2592000; SameSite=Lax`;
      }

      const uthynkMessage = `${data.analysis}\n\nPushback: ${data.contrarian}\n\nNext Challenge: ${data.followUp}`;

      setConversation((prev) => [
        ...prev,
        {
          role: "uthynk",
          content: uthynkMessage,
        },
      ]);

      if (data.score >= 88) {
        setDifficulty('strategic');
        setPressure('High');
      } else if (data.score >= 76) {
        setDifficulty('critical');
        setPressure('High');
      } else if (data.score >= 62) {
        setDifficulty('practical');
        setPressure('Moderate');
      } else {
        setDifficulty('everyday');
        setPressure('Low');
      }

      const nextChallenge = selectNextChallenge(challenge, data.score);
      setChallenge(nextChallenge);
      setDifficulty(nextChallenge.difficulty);
      setResponse(data.followUp || '');
      trackEvent(
        createTelemetryEvent("received_next_challenge", activeProfile?.id, {
          challengeId: nextChallenge.id,
          category: nextChallenge.category,
          difficulty: nextChallenge.difficulty,
        })
      );

      if (typeof window !== "undefined") {
        const seenIds = JSON.parse(
          localStorage.getItem("uthynk-seen-challenge-ids") || "[]"
        ) as string[];
        localStorage.setItem(
          "uthynk-seen-challenge-ids",
          JSON.stringify(Array.from(new Set([...seenIds, nextChallenge.id])))
        );
      }
    } catch {
      setError("Unable to analyze reasoning right now.");
    } finally {
      setLoading(false);
    }
  }

  const strongestOpposingCase =
    visibleFeedback.contrarian ||
    localizeText("What would a careful opponent say is missing from your reasoning?", language);
  const timeline = [
    {
      title: copy.sessionContinuity,
      text: `${conversation.length} ${copy.sessionTurns} ${visiblePressure}.`,
    },
    {
      title: copy.priorContradiction,
      text: visibleFeedback.contrarian,
    },
    {
      title: copy.evolvingInsight,
      text: visibleFeedback.analysis,
    },
    {
      title: copy.recursiveFollowUp,
      text: visibleFeedback.followUp,
    },
  ];
  const primaryIdentity = localizeText(profile?.primary_trait, language) || visibleFeedback.trait;
  const secondaryMode = visibleFeedback.strengths[0] || "Strategic restraint";
  const growthEdge = visibleFeedback.weaknesses[0] || "Evidence strength";
  const biasWatch =
    feedback.verifier?.signals?.incentives
      ? "Incentive blind spot"
      : (100 - (feedback.verifier?.behavioral?.emotionalControl || 50)) > 35
        ? "Emotional rigidity"
        : "Overconfidence";
  const activeLens =
    thinkingLenses.find((lens) => lens.id === thinkingLens)?.labelKey || "lensLogic";
  const questionType =
    thinkingLens === "incentives"
      ? copy.incentiveMap
      : thinkingLens === "ethics"
        ? copy.valueConflict
        : thinkingLens === "history"
          ? copy.patternTest
          : thinkingLens === "strategy"
            ? copy.tradeoffMove
            : copy.evidenceTest;

  return (
    <section className="uthynkReasoningLayout">
      <aside className="uthynkSidePanel uthynkLeftPanel">
        <section className="leftRailSection identitySummaryCard">
          <div className="panelLabel">{copy.identity}</div>
          <strong className="identityRank">{localizeText(profile?.rank || "Observer", language)}</strong>
          <div className="identityMetaGrid">
            <div>
              <span>{copy.streak}</span>
              <strong>{profile?.streak || 0} {copy.streakDays}</strong>
            </div>
            <div>
              <span>XP</span>
              <strong>{progressionState.value}</strong>
            </div>
          </div>
          <div>
            <span>{copy.trait}</span>
            <strong>{primaryIdentity}</strong>
          </div>
          <div className="progressBar" aria-label={copy.identityProgression}>
            <div
              className="progressFill uthynkProgressFill"
              style={{ width: `${progressionState.percent}%` }}
            />
          </div>
        </section>

        <section className="leftRailSection profileSignalCard">
          <div className="panelLabel">{copy.thinkingProfile}</div>
          <div className="profileRows">
            <div><span>{copy.primaryMode}</span><strong>{primaryIdentity}</strong></div>
            <div><span>{copy.style}</span><strong>{localizeText(secondaryMode, language)}</strong></div>
            <div><span>{copy.growthEdge}</span><strong>{localizeText(growthEdge, language)}</strong></div>
            <div><span>{copy.biasWatch}</span><strong>{localizeText(biasWatch, language)}</strong></div>
          </div>
        </section>

        <section className="leftRailSection sessionSignalCard">
          <div className="panelLabel">{copy.currentSession}</div>
          <div className="profileRows">
            <div><span>{copy.lens}</span><strong>{copy[activeLens]}</strong></div>
            <div><span>{copy.progress}</span><strong>{visibleDifficulty}</strong></div>
            <div><span>{copy.intensity}</span><strong>{visiblePressure}</strong></div>
            <div><span>{copy.questionType}</span><strong>{questionType}</strong></div>
          </div>
        </section>

        <section className="leftRailSection leftSignalPanel">
          <div className="leftSignalHeader">
            <div className="panelLabel">{copy.liveSignals}</div>
            <div className="leftSignalTabs" role="tablist" aria-label="Live reasoning signals">
              {[
                { id: "patterns", label: "Patterns" },
                { id: "metrics", label: "Metrics" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={leftSignalTab === tab.id}
                  className={leftSignalTab === tab.id ? "active" : ""}
                  onClick={() => setLeftSignalTab(tab.id as "patterns" | "metrics")}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {leftSignalTab === "patterns" ? (
            <div className="traitList compactTraitList">
              {visibleFeedback.strengths.map((item) => (
                <span key={item}>{item}</span>
              ))}
              {visibleFeedback.weaknesses.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}

          {leftSignalTab === "metrics" ? (
            <div className="compactMetricGrid">
              <div>
                <span title={copy.logicQualityTooltip}>{copy.logicQuality}</span>
                <strong>{visibleFeedback.score}</strong>
              </div>
              <div>
                <span title={copy.evidenceStrengthTooltip}>{copy.evidenceStrength}</span>
                <strong>{feedback.verifier?.behavioral?.evidence || visibleFeedback.score}</strong>
              </div>
              <div>
                <span title={copy.emotionalRigidityTooltip}>{copy.emotionalRigidity}</span>
                <strong>{100 - (feedback.verifier?.behavioral?.emotionalControl || 50)}</strong>
              </div>
              <div>
                <span title={copy.manipulationTacticsTooltip}>{copy.manipulationTactics}</span>
                <strong>{feedback.verifier?.signals?.incentives ? copy.flagged : copy.scanning}</strong>
              </div>
            </div>
          ) : null}
        </section>
      </aside>

      <main className="uthynkConversationPanel">
        <div className="conversationHeader">
          <div>
            <div className="panelLabel">{copy.liveConversation}</div>
            <h1>{visibleChallenge.prompt}</h1>
          </div>
          <div className="threadMeta">
            <span>{visibleChallenge.category}</span>
            <span>{visibleDifficulty}</span>
            <span>{visiblePressure}</span>
            {ageBand !== "18_plus" ? <span>{ageBandLabel(ageBand)}</span> : null}
            {!profile?.id ? <span>{Math.max(0, 3 - freePassUsed)} free left</span> : null}
          </div>
        </div>

        <section className="thinkingLensPanel">
          <div className="panelLabel">{copy.chooseThinkingLens}</div>
          <div className="thinkingLensOptions" role="radiogroup" aria-label={copy.chooseThinkingLens}>
            {thinkingLenses.map((lens) => (
              <button
                key={lens.id}
                type="button"
                role="radio"
                aria-checked={thinkingLens === lens.id}
                className={thinkingLens === lens.id ? "active" : ""}
                onClick={() => setThinkingLens(lens.id)}
              >
                {copy[lens.labelKey]}
              </button>
            ))}
          </div>
        </section>

        <section className="thinkingToolsPanel">
          <div className="thinkingToolsHeader">
            <div className="panelLabel">{toolsCopy.section}</div>
            <div className="thinkingToolTabs" role="tablist" aria-label={toolsCopy.section}>
              {[
                { id: "challenge", label: toolsCopy.challenge },
                { id: "followUp", label: toolsCopy.followUp },
                { id: "lab", label: toolsCopy.lab },
                { id: "timeline", label: toolsCopy.timeline },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={thinkingToolTab === tab.id}
                  className={thinkingToolTab === tab.id ? "active" : ""}
                  onClick={() =>
                    setThinkingToolTab(tab.id as "challenge" | "followUp" | "lab" | "timeline")
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {thinkingToolTab === "challenge" ? (
            <article className="thinkingToolPane">
              <span>{copy.contradictionPrompt}</span>
              <p>{strongestOpposingCase}</p>
            </article>
          ) : null}

          {thinkingToolTab === "followUp" ? (
            <article className="thinkingToolPane">
              <span>{copy.recursiveFollowUp}</span>
              <p>{visibleFeedback.followUp}</p>
            </article>
          ) : null}

          {thinkingToolTab === "lab" ? (
            <div className="reasoningSteps compactReasoningSteps">
              <article>
                <span>Step 1</span>
                <strong>{toolsCopy.position}</strong>
                <p>{evaluatedClaim || response || copy.stateClaim}</p>
              </article>
              <article>
                <span>Step 2</span>
                <strong>{toolsCopy.support}</strong>
                <p>{visibleFeedback.strengths.join(", ") || copy.evidenceEmpty}</p>
              </article>
              <article>
                <span>Step 3</span>
                <strong>{toolsCopy.opposition}</strong>
                <p>{strongestOpposingCase}</p>
              </article>
              <article>
                <span>Step 4</span>
                <strong>{toolsCopy.assumptions}</strong>
                <p>{visibleFeedback.weaknesses.join(", ") || visibleFeedback.analysis}</p>
              </article>
            </div>
          ) : null}

          {thinkingToolTab === "timeline" ? (
            <div className="timelineRail thinkingTimelineRail">
              {timeline.map((item) => (
                <article key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <label className="responseLabel" htmlFor="response">
          {copy.continueWithUthynk}
        </label>

        <textarea
          id="response"
          className="textarea responseBox conversationInput"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder={copy.placeholder}
        />

        {error ? <p className="panelNote">{error}</p> : null}
        {!profile?.id && freePassUsed >= 3 ? (
          <div className="freePassGate">
            <strong>Create a free beta profile to continue.</strong>
            <span>
              You used your 3 free UThynk challenges. Sign up to save memory,
              streaks, traits, and future sessions.
            </span>
            <Link className="btn btnPrimary" href="/login?reason=free-pass">
              Create Profile
            </Link>
          </div>
        ) : null}

        <div className="reasoningActions">
          <button
            className="btn btnPrimary"
            type="button"
            disabled={loading || !response.trim() || (!profile?.id && freePassUsed >= 3)}
            onClick={analyzeReasoning}
          >
            {loading ? copy.sending : copy.send}
          </button>

          <button
            className="btn"
            type="button"
            onMouseDown={startVoiceInput}
            onMouseUp={stopVoiceInput}
            onTouchStart={startVoiceInput}
            onTouchEnd={stopVoiceInput}
          >
            {copy.holdToTalk}
          </button>
        </div>

        {latestReward ? (
          <section className="growthReward" aria-live="polite">
            <div>
              <span>+{latestReward.xp} {copy.insightXp}</span>
              <strong>{copy.rewardPattern}: {localizeText(latestReward.pattern, language)}</strong>
            </div>
            <p>{copy.improved}: {copy.evidenceStrength} +{latestReward.evidenceDelta}</p>
          </section>
        ) : null}

        <div className="conversationThread" aria-live="polite">
          {conversation.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`messageBubble ${item.role === "user" ? "userBubble" : "uthynkBubble"}`}
            >
              <span>{item.role === "user" ? copy.userLabel : "UThynk"}</span>
              <p>
                {item.content === uiCopy.en.welcome
                  ? copy.welcome
                  : localizeText(item.content, language) || item.content}
              </p>
            </div>
          ))}

          {streamingText ? (
            <div className="messageBubble uthynkBubble liveBubble">
              <span>{copy.liveReasoning}</span>
              <p>{streamingText}</p>
            </div>
          ) : null}
        </div>

      </main>

      <aside className="uthynkSidePanel uthynkRightPanel">
        <div className="rightRailTabs" role="tablist" aria-label="UThynk side panel">
          {[
            { id: "categories", label: copy.categoryTab },
            { id: "insights", label: copy.insightsTab },
            { id: "analysis", label: copy.analysisTab },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={rightTab === tab.id ? "active" : ""}
              aria-selected={rightTab === tab.id}
              onClick={() => setRightTab(tab.id as "categories" | "insights" | "analysis")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {rightTab === "categories" ? (
          <section>
            <div className="panelLabel">{copy.categories}</div>
            <p className="categoryHelper">
              Choose a category to load a new active challenge.
            </p>
            <div className="categoryPills">
              {visibleCategoryLinks.map((item) => (
                <button
                  className={challenge.category === item.category ? "active" : ""}
                  key={item.category}
                  aria-pressed={challenge.category === item.category}
                  onClick={() => selectCategory(item.category)}
                  type="button"
                >
                  <span>{item.label}</span>
                  <small>{challenge.category === item.category ? "Active" : "Switch"}</small>
                </button>
              ))}
            </div>
            <Link className="categoryLessonsLink" href={`/lessons/${slugifyCategory(challenge.category)}`}>
              Open {visibleChallenge.category} questions
            </Link>
            <Link className="categoryLessonsLink secondary" href="/lessons">
              View all lesson categories
            </Link>
          </section>
        ) : null}

        {rightTab === "insights" ? (
          <section>
            <div className="panelLabel">{copy.didYouKnow}</div>
            <div className="cognitionFeed">
              {cognitionFeedByLanguage[language].map((item) => (
                <article key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {rightTab === "analysis" ? (
          <section>
            <div className="panelLabel">{copy.claimEvaluation}</div>
            <div className="logicGrid sideAnalysisGrid">
              <div><span>{copy.counterargument}</span><p>{visibleFeedback.contrarian}</p></div>
              <div><span>{copy.recursiveFollowUp}</span><p>{visibleFeedback.followUp}</p></div>
              <div><span>{copy.strongestOpposingCase}</span><p>{strongestOpposingCase}</p></div>
            </div>
          </section>
        ) : null}

      </aside>
    </section>
  );
}

export default function ReasoningPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const copy = uiCopy[language];
  const helpCopy = onboardingCopy[language];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedLanguage = localStorage.getItem("uthynk-language");

    if (storedLanguage === "en" || storedLanguage === "es" || storedLanguage === "fr") {
      setLanguage(storedLanguage);
    }

    if (localStorage.getItem("uthynk-onboarding-dismissed") !== "true") {
      setShowOnboarding(true);
    }
  }, []);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);

    if (typeof window !== "undefined") {
      localStorage.setItem("uthynk-language", nextLanguage);
    }
  }

  function closeOnboarding() {
    setShowOnboarding(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("uthynk-onboarding-dismissed", "true");
    }
  }

  return (
    <main className="appShell reasoningShell">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          <img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo" />
          <span className="brandCopy">
            <strong>UThynk</strong>
            <small>Better thinking. <em>Better decisions.</em></small>
          </span>
        </Link>

        <div className="topControls">
          <nav className="appNav" aria-label="Reasoning navigation">
            <Link href="/">{copy.home}</Link>
            <Link href="/lessons">Lessons</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/feedback">Feedback</Link>
            <Link href="/login">Sign in</Link>
          </nav>

          <button
            className="helpButton"
            type="button"
            onClick={() => setShowOnboarding(true)}
          >
            {helpCopy.reopen}
          </button>

          <label className="languageSelectLabel topLanguageSelect">
            <span>{copy.adaptiveLanguage}</span>
            <select
              aria-label={copy.adaptiveLanguage}
              className="languageSelect"
              value={language}
              onChange={(event) => changeLanguage(event.target.value as Language)}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <Suspense
        fallback={
          <section className="card reasoningMain" style={{ marginTop: 18 }}>
            <div className="panelLabel">{copy.loadingSession}</div>
            <p className="panelNote">{copy.restoredHistory}</p>
          </section>
        }
      >
        <ReasoningExperience language={language} />
      </Suspense>

      {showOnboarding ? (
        <div className="onboardingOverlay" role="presentation">
          <section
            className="onboardingModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="uthynk-onboarding-title"
          >
            <div className="onboardingHero">
              <div>
                <span className="panelLabel">UThynk</span>
                <h2 id="uthynk-onboarding-title">{helpCopy.title}</h2>
                <p>{helpCopy.intro}</p>
              </div>
              <button
                className="modalCloseButton"
                type="button"
                aria-label="Close"
                onClick={closeOnboarding}
              >
                ×
              </button>
            </div>

            <div className="onboardingSteps">
              {helpCopy.steps.map((step, index) => (
                <article key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>

            <div className="onboardingFooter">
              <button className="btn btnPrimary" type="button" onClick={closeOnboarding}>
                {helpCopy.close}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

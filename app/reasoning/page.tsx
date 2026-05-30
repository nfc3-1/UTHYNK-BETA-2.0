"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { challenges, getChallengeById, type Challenge } from "@/lib/challenges";
import {
  cognitionFeedByLanguage,
  languageOptions,
  localizeChallenge,
  localizeText,
  type Language,
  uiCopy,
} from "@/lib/reasoningI18n";

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
    const nextUnseen = challenges.find((item) => !seenIds.includes(item.id));

    return nextUnseen || challenges[seenIds.length % challenges.length];
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
  const [feedback, setFeedback] = useState({
    ...initialFeedback,
    trait: challenge.trait,
  });

  const [conversation, setConversation] = useState<any[]>([
    {
      role: "uthynk",
      content:
        "Welcome back. I remember your previous reasoning patterns. Let's continue sharpening your thinking.",
    },
  ]);
  const copy = uiCopy[language];
  const visibleChallenge = localizeChallenge(challenge, language);
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

    return matchingChallenge
      ? localizeChallenge(matchingChallenge, language).category
      : category;
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
    setProfile(storedProfile ? JSON.parse(storedProfile) : null);

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
      score >= 85 ? "advanced" : score >= 70 ? "intermediate" : "starter";
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
      }

      setConversation((prev) => [
        ...prev,
        {
          role: "user",
          content: response,
        },
      ]);

      const res = await fetch("/api/reasoning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          category: challenge.category,
          challenge: visibleChallenge.prompt,
          language,
          response,
          conversationId: conversationIdRef.current,
          sessionId: sessionIdRef.current,
          userId: activeProfile?.id,
          stream: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
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

      setFeedback({ ...data, trait: data.trait || challenge.trait });

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

      if (data.score >= 85) {
        setDifficulty('advanced');
        setPressure('High');
      } else if (data.score >= 70) {
        setDifficulty('intermediate');
        setPressure('Moderate');
      } else {
        setDifficulty('starter');
        setPressure('Low');
      }

      const nextChallenge = selectNextChallenge(challenge, data.score);
      setChallenge(nextChallenge);
      setDifficulty(nextChallenge.difficulty);
      setResponse(data.followUp || '');

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

  return (
    <section className="uthynkReasoningLayout">
      <aside className="uthynkSidePanel uthynkLeftPanel">
        <div className="panelLabel">{copy.identity}</div>
        <div className="identityStack">
          <div>
            <span>{copy.rank}</span>
            <strong>{localizeText(profile?.rank || "Observer", language)}</strong>
          </div>
          <div>
            <span>{copy.streak}</span>
            <strong>{profile?.streak || 0} {copy.streakDays}</strong>
          </div>
          <div>
            <span>{copy.trait}</span>
            <strong>{localizeText(profile?.primary_trait, language) || visibleFeedback.trait}</strong>
          </div>
          <div>
            <span>{copy.progression}</span>
            <strong>{progressionState.value}</strong>
          </div>
        </div>

        <div className="progressBar" aria-label={copy.identityProgression}>
          <div
            className="progressFill uthynkProgressFill"
            style={{ width: `${progressionState.percent}%` }}
          />
        </div>

        <div className="traitList">
          {visibleFeedback.strengths.map((item) => (
            <span key={item}>{item}</span>
          ))}
          {visibleFeedback.weaknesses.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <section className="logicScores">
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
          </div>
        </div>

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

        <div className="reasoningActions">
          <button
            className="btn btnPrimary"
            type="button"
            disabled={loading || !response.trim()}
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

        <section className="contradictionStrip">
          <div>
            <span>{copy.contradictionPrompt}</span>
            <p>{strongestOpposingCase}</p>
          </div>
          <div>
            <span>{copy.recursiveFollowUp}</span>
            <p>{visibleFeedback.followUp}</p>
          </div>
        </section>

        <section className="claimEvaluationInline">
          <div className="panelLabel">{copy.claimEvaluation}</div>
          <div className="logicGrid">
            <div><span>{copy.claim}</span><p>{response || copy.stateClaim}</p></div>
            <div><span>{copy.evidence}</span><p>{visibleFeedback.strengths.join(", ") || copy.evidenceEmpty}</p></div>
            <div><span>{copy.counterargument}</span><p>{visibleFeedback.contrarian}</p></div>
            <div><span>{copy.contradictionAnalysis}</span><p>{visibleFeedback.weaknesses.join(", ")}</p></div>
            <div><span>{copy.strongestOpposingCase}</span><p>{strongestOpposingCase}</p></div>
          </div>
        </section>

        <section className="reasoningTimeline">
          <div className="panelLabel">{copy.reasoningTimeline}</div>
          <div className="timelineRail">
            {timeline.map((item) => (
              <article key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
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
            <div className="categoryPills">
              {visibleCategoryLinks.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
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
  const copy = uiCopy[language];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedLanguage = localStorage.getItem("uthynk-language");

    if (storedLanguage === "en" || storedLanguage === "es" || storedLanguage === "fr") {
      setLanguage(storedLanguage);
    }
  }, []);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);

    if (typeof window !== "undefined") {
      localStorage.setItem("uthynk-language", nextLanguage);
    }
  }

  return (
    <main className="appShell reasoningShell">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          UThynk
        </Link>

        <div className="topControls">
          <nav className="appNav" aria-label="Reasoning navigation">
            <Link href="/">{copy.home}</Link>
            <Link href="/profile">{copy.identity}</Link>
            <Link href="/dashboard">{copy.progress}</Link>
          </nav>

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
    </main>
  );
}

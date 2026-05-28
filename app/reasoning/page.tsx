"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { challenges, getChallengeById, type Challenge } from "@/lib/challenges";

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

const cognitionFeed = [
  {
    title: "Manipulation pattern",
    text: "Urgency narrows attention. When a prompt demands speed, ask who benefits from you skipping verification.",
  },
  {
    title: "Strategic insight",
    text: "A strong move preserves options. If an answer commits early, test the reversible path first.",
  },
  {
    title: "Historical contradiction",
    text: "Many confident public narratives survive by hiding inconvenient timelines. Sequence the facts before judging motive.",
  },
  {
    title: "Bias example",
    text: "Availability bias makes the vivid example feel typical. Ask for the base rate before trusting the story.",
  },
  {
    title: "Probability prompt",
    text: "Replace certainty with odds: what would make this 30%, 60%, or 90% likely?",
  },
];

const categoryLinks = Array.from(
  new Set(challenges.map((challenge) => challenge.category))
);

function ReasoningExperience() {
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

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ');

      setResponse(transcript);
    };

    recognitionRef.current = recognition;
  }, [challenge.id]);

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
          challenge: challenge.prompt,
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
    feedback.contrarian || "What would a careful opponent say is missing from your reasoning?";
  const timeline = [
    {
      title: "Session continuity",
      text: `${conversation.length} reasoning turns in this thread. Current pressure: ${pressure}.`,
    },
    {
      title: "Prior contradiction",
      text: feedback.contrarian,
    },
    {
      title: "Evolving insight",
      text: feedback.analysis,
    },
    {
      title: "Recursive follow-up",
      text: feedback.followUp,
    },
  ];

  return (
    <section className="uthynkReasoningLayout">
      <aside className="uthynkSidePanel uthynkLeftPanel">
        <div className="panelLabel">Identity</div>
        <div className="identityStack">
          <div>
            <span>Rank</span>
            <strong>{profile?.rank || "Observer"}</strong>
          </div>
          <div>
            <span>Streak</span>
            <strong>{profile?.streak || 0} days</strong>
          </div>
          <div>
            <span>Trait</span>
            <strong>{profile?.primary_trait || feedback.trait}</strong>
          </div>
          <div>
            <span>Progression</span>
            <strong>{profile?.reasoning_score || feedback.score}</strong>
          </div>
        </div>

        <div className="progressBar" aria-label="Identity progression">
          <div
            className="progressFill uthynkProgressFill"
            style={{ width: `${Math.min(100, profile?.reasoning_score || feedback.score)}%` }}
          />
        </div>

        <div className="traitList">
          {feedback.strengths.map((item) => (
            <span key={item}>{item}</span>
          ))}
          {feedback.weaknesses.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </aside>

      <main className="uthynkConversationPanel">
        <div className="conversationHeader">
          <div>
            <div className="panelLabel">Live UThynk Conversation</div>
            <h1>{challenge.prompt}</h1>
          </div>
          <div className="threadMeta">
            <span>{challenge.category}</span>
            <span>{difficulty}</span>
            <span>{pressure}</span>
          </div>
        </div>

        <div className="conversationThread" aria-live="polite">
          {conversation.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`messageBubble ${item.role === "user" ? "userBubble" : "uthynkBubble"}`}
            >
              <span>{item.role === "user" ? "You" : "UThynk"}</span>
              <p>{item.content}</p>
            </div>
          ))}

          {streamingText ? (
            <div className="messageBubble uthynkBubble liveBubble">
              <span>UThynk reasoning live</span>
              <p>{streamingText}</p>
            </div>
          ) : null}
        </div>

        <section className="contradictionStrip">
          <div>
            <span>Contradiction prompt</span>
            <p>{strongestOpposingCase}</p>
          </div>
          <div>
            <span>Recursive follow-up</span>
            <p>{feedback.followUp}</p>
          </div>
        </section>

        <label className="responseLabel" htmlFor="response">
          Continue with UThynk
        </label>

        <textarea
          id="response"
          className="textarea responseBox conversationInput"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Make a claim, add evidence, test an assumption, or respond by voice."
        />

        {error ? <p className="panelNote">{error}</p> : null}

        <div className="reasoningActions">
          <button
            className="btn btnPrimary"
            type="button"
            disabled={loading || !response.trim()}
            onClick={analyzeReasoning}
          >
            {loading ? 'UThynk is reasoning...' : 'Send to UThynk'}
          </button>

          <button
            className="btn"
            type="button"
            onMouseDown={startVoiceInput}
            onMouseUp={stopVoiceInput}
            onTouchStart={startVoiceInput}
            onTouchEnd={stopVoiceInput}
          >
            Hold To Talk
          </button>
        </div>

        <section className="reasoningTimeline">
          <div className="panelLabel">Reasoning Timeline</div>
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
        <section>
          <div className="panelLabel">Categories</div>
          <div className="categoryPills">
            {categoryLinks.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section>
          <div className="panelLabel">Did You Know?</div>
          <div className="cognitionFeed">
            {cognitionFeed.map((item) => (
              <article key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="logicSystem">
          <div className="panelLabel">Logic Arguments</div>
          <div className="logicGrid">
            <div><span>Claim</span><p>{response || "State the position you want UThynk to evaluate."}</p></div>
            <div><span>Evidence</span><p>{feedback.strengths.join(", ") || "Support the claim with examples, data, or observation."}</p></div>
            <div><span>Counterargument</span><p>{feedback.contrarian}</p></div>
            <div><span>Contradiction analysis</span><p>{feedback.weaknesses.join(", ")}</p></div>
            <div><span>Strongest opposing case</span><p>{strongestOpposingCase}</p></div>
          </div>
        </section>

        <section className="logicScores">
          <div><span>Logic quality</span><strong>{feedback.score}</strong></div>
          <div><span>Evidence strength</span><strong>{feedback.verifier?.behavioral?.evidence || feedback.score}</strong></div>
          <div><span>Emotional rigidity</span><strong>{100 - (feedback.verifier?.behavioral?.emotionalControl || 50)}</strong></div>
          <div><span>Manipulation tactics</span><strong>{feedback.verifier?.signals?.incentives ? "Flagged" : "Scanning"}</strong></div>
        </section>
      </aside>
    </section>
  );
}

export default function ReasoningPage() {
  return (
    <main className="appShell reasoningShell">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          UThynk
        </Link>

        <nav className="appNav" aria-label="Reasoning navigation">
          <Link href="/">Home</Link>
          <Link href="/profile">Identity</Link>
          <Link href="/dashboard">Progress</Link>
        </nav>
      </header>

      <Suspense
        fallback={
          <section className="card reasoningMain" style={{ marginTop: 18 }}>
            <div className="panelLabel">Loading UThynk Session</div>
            <p className="panelNote">Restoring your cognitive history...</p>
          </section>
        }
      >
        <ReasoningExperience />
      </Suspense>
    </main>
  );
}

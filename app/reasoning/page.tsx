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
  weaknesses: ["needs incentive analysis", "clarify the next step"],
};

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
  const [feedback, setFeedback] = useState({
    ...initialFeedback,
    trait: challenge.trait,
  });

  const [conversation, setConversation] = useState<any[]>([
    {
      role: "coach",
      content:
        "Welcome back. I remember your previous reasoning patterns. Let's continue sharpening your thinking.",
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const conversationIdRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === 'undefined') return;

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
      let profile: any = null;

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("uthynk-profile");
        profile = stored ? JSON.parse(stored) : null;
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
          userId: profile?.id,
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
        localStorage.setItem("uthynk-last-completed-date", today);
        document.cookie = `uthynk-profile=${encodeURIComponent(
          JSON.stringify(nextProfile)
        )}; path=/; max-age=2592000; SameSite=Lax`;
      }

      const coachMessage = `${data.analysis}\n\nPushback: ${data.contrarian}\n\nNext Challenge: ${data.followUp}`;

      setConversation((prev) => [
        ...prev,
        {
          role: "coach",
          content: coachMessage,
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

  return (
    <section className="reasoningGrid">
      <article className="card reasoningMain">
        <div className="panelLabel">
          Adaptive Cognitive Session - {challenge.category}
        </div>

        <h1>{challenge.prompt}</h1>

        <p className="panelNote">
          The coach remembers previous reasoning patterns, escalates difficulty dynamically,
          and continuously adapts pressure levels.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 18,
            flexWrap: 'wrap',
          }}
        >
          <div className="rewardCard">
            <strong>{difficulty.toUpperCase()}</strong>
            <span>Adaptive Difficulty</span>
          </div>

          <div className="rewardCard">
            <strong>{pressure}</strong>
            <span>Cognitive Pressure</span>
          </div>

          <div className="rewardCard">
            <strong>{feedback.trait}</strong>
            <span>Evolving Trait</span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 12,
            marginBottom: 20,
            maxHeight: 340,
            overflowY: 'auto',
          }}
        >
          {conversation.map((item, index) => (
            <div
              key={index}
              className="coachBlock"
              style={{
                border:
                  item.role === 'coach'
                    ? '1px solid rgba(94,234,212,0.25)'
                    : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span>
                {item.role === 'coach' ? 'UThynk Coach' : 'You'}
              </span>
              <p>{item.content}</p>
            </div>
          ))}

          {streamingText ? (
            <div className="coachBlock highlightBlock">
              <span>Streaming Coach Response</span>
              <p>{streamingText}</p>
            </div>
          ) : null}
        </div>

        <label className="responseLabel" htmlFor="response">
          Continue the reasoning session
        </label>

        <textarea
          id="response"
          className="textarea responseBox"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Respond by typing or use voice input below."
        />

        {error ? <p className="panelNote">{error}</p> : null}

        <div className="reasoningActions">
          <button
            className="btn btnPrimary"
            type="button"
            disabled={loading || !response.trim()}
            onClick={analyzeReasoning}
          >
            {loading ? 'Coach is Thinking...' : 'Continue Adaptive Loop'}
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

          <Link className="btn" href="/">
            Home
          </Link>
        </div>
      </article>

      <aside className="card coachPanel">
        <div className="panelLabel">Live Cognitive Evolution</div>

        <div className="rewardCard">
          <strong>+{feedback.xp} XP</strong>
          <span>Reasoning Score: {feedback.score}</span>
          <span>Trait Evolution Active</span>
        </div>

        <div className="progressBar" aria-label="Reasoning evolution">
          <div
            className="progressFill"
            style={{ width: `${feedback.score}%` }}
          />
        </div>

        <div className="coachBlock highlightBlock">
          <span>Identity Reinforcement</span>
          <p>
            Your reasoning identity evolves continuously based on strategic depth,
            emotional control, incentive awareness, and intellectual flexibility.
          </p>
        </div>

        <div className="feedbackGrid">
          <div>
            <strong>Strengths</strong>
            {feedback.strengths?.map((item) => (
              <small key={item}>{item}</small>
            ))}
          </div>

          <div>
            <strong>Pressure Areas</strong>
            {feedback.weaknesses?.map((item) => (
              <small key={item}>{item}</small>
            ))}
          </div>
        </div>
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
            <div className="panelLabel">Loading Adaptive Session</div>
            <p className="panelNote">Restoring your cognitive history...</p>
          </section>
        }
      >
        <ReasoningExperience />
      </Suspense>
    </main>
  );
}

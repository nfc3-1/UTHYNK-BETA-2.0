"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getChallengeById } from "@/lib/challenges";

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
  const challenge = useMemo(
    () => getChallengeById(searchParams.get("id")),
    [searchParams]
  );

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

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
  }, []);

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
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          category: challenge.category,
          challenge: challenge.prompt,
          response,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reasoning analysis failed.");
        return;
      }

      setFeedback({ ...data, trait: data.trait || challenge.trait });

      const coachMessage = `${data.analysis}\n\nPushback: ${data.contrarian}\n\nNext Challenge: ${data.followUp}`;

      let progressive = '';

      for (const char of coachMessage) {
        progressive += char;
        setStreamingText(progressive);

        await new Promise((resolve) => setTimeout(resolve, 5));
      }

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

      setResponse(data.followUp || '');
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
          Adaptive Cognitive Session · {challenge.category}
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

"use client";

import { Suspense, useMemo, useState } from "react";
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
  const [error, setError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedback, setFeedback] = useState({
    ...initialFeedback,
    trait: challenge.trait,
  });

  async function analyzeReasoning() {
    try {
      setLoading(true);
      setError("");

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
      setHasSubmitted(true);
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
          Daily Challenge · {challenge.category} · {challenge.difficulty}
        </div>

        <h1>{challenge.prompt}</h1>

        <p className="panelNote">
          Think first. Then UThynk challenges your assumptions, identifies blind
          spots, and gives you one sharper follow-up.
        </p>

        <label className="responseLabel" htmlFor="response">
          Your response
        </label>

        <textarea
          id="response"
          className="textarea responseBox"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Write your first answer. Include your reasoning, tradeoffs, and next step."
        />

        {error ? <p className="panelNote">{error}</p> : null}

        <div className="reasoningActions">
          <button
            className="btn btnPrimary"
            type="button"
            disabled={loading || !response.trim()}
            onClick={analyzeReasoning}
          >
            {loading ? "Coach is Thinking..." : "Send to AI Coach"}
          </button>

          <Link className="btn" href="/">
            Back to Home
          </Link>
        </div>
      </article>

      <aside className="card coachPanel">
        <div className="panelLabel">AI Coach Chat</div>

        <div className="coachBlock">
          <span>UThynk Coach</span>
          <p>
            {hasSubmitted
              ? "I reviewed your answer. Here is the most important feedback."
              : "Answer the challenge and I will respond like a reasoning coach, not a generic chatbot."}
          </p>
        </div>

        {hasSubmitted ? (
          <>
            <div className="coachBlock">
              <span>Your Reasoning Check</span>
              <p>{feedback.analysis}</p>
            </div>

            <div className="coachBlock highlightBlock">
              <span>Pushback</span>
              <p>{feedback.contrarian}</p>
            </div>

            <div className="coachBlock">
              <span>Next Question</span>
              <p>{feedback.followUp}</p>
            </div>
          </>
        ) : (
          <div className="coachBlock highlightBlock">
            <span>Coach Rule</span>
            <p>
              UThynk will not just agree with you. It will steelman the other
              side, test assumptions, and make your thinking sharper.
            </p>
          </div>
        )}

        <div className="feedbackGrid">
          <div>
            <strong>Strengths</strong>
            {feedback.strengths?.map((item) => (
              <small key={item}>{item}</small>
            ))}
          </div>

          <div>
            <strong>Watch</strong>
            {feedback.weaknesses?.map((item) => (
              <small key={item}>{item}</small>
            ))}
          </div>
        </div>

        <div className="rewardCard">
          <strong>+{hasSubmitted ? feedback.xp : 0} XP</strong>
          <span>Reasoning Score: {hasSubmitted ? feedback.score : "--"}</span>
          <span>Trait Focus: {feedback.trait}</span>
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
          <Link href="/profile">Profile</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <Suspense
        fallback={
          <section className="card reasoningMain" style={{ marginTop: 18 }}>
            <div className="panelLabel">Loading Challenge</div>
            <p className="panelNote">Preparing your reasoning session...</p>
          </section>
        }
      >
        <ReasoningExperience />
      </Suspense>
    </main>
  );
}

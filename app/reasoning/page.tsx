"use client";

import { useMemo, useState } from "react";
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

export default function ReasoningPage() {
  const searchParams = useSearchParams();
  const challenge = useMemo(
    () => getChallengeById(searchParams.get("id")),
    [searchParams]
  );

  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    } catch {
      setError("Unable to analyze reasoning right now.");
    } finally {
      setLoading(false);
    }
  }

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

      <section className="reasoningGrid">
        <article className="card reasoningMain">
          <div className="panelLabel">
            Daily Challenge · {challenge.category} · {challenge.difficulty}
          </div>

          <h1>{challenge.prompt}</h1>

          <p className="panelNote">
            The AI coach analyzes logic, assumptions, emotional reasoning, and
            strategic thinking.
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
              disabled={loading}
              onClick={analyzeReasoning}
            >
              {loading ? "Analyzing..." : "Analyze My Reasoning"}
            </button>

            <Link className="btn" href="/">
              Back to Home
            </Link>
          </div>
        </article>

        <aside className="card coachPanel">
          <div className="panelLabel">AI Reasoning Feedback</div>

          <div className="coachBlock">
            <span>Analysis</span>
            <p>{feedback.analysis}</p>
          </div>

          <div className="coachBlock highlightBlock">
            <span>Contrarian Challenge</span>
            <p>{feedback.contrarian}</p>
          </div>

          <div className="coachBlock">
            <span>Follow-Up</span>
            <p>{feedback.followUp}</p>
          </div>

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
            <strong>+{feedback.xp} XP</strong>
            <span>Reasoning Score: {feedback.score}</span>
            <span>Trait Increased: {feedback.trait}</span>
          </div>
        </aside>
      </section>
    </main>
  );
}

import Link from "next/link";

const challenge = {
  category: "Workplace Strategy",
  prompt:
    "A coworker takes credit for your work in front of leadership. What do you do next?",
};

const aiReview = {
  analysis:
    "A strong answer should protect your reputation without reacting emotionally or escalating too early.",
  contrarian:
    "What if confronting them immediately makes you look insecure, while a calm evidence-based follow-up strengthens your position?",
  followUp:
    "How would you make leadership aware of your contribution while preserving trust and leverage?",
  strengths: ["strategic restraint", "long-term reputation awareness"],
  weaknesses: ["needs incentive analysis", "avoid assuming intent too quickly"],
};

export default function ReasoningPage() {
  return (
    <main className="appShell reasoningShell">
      <header className="appTop card">
        <Link href="/" className="appBrandText">UThynk</Link>
        <nav className="appNav" aria-label="Reasoning navigation">
          <Link href="/">Home</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <section className="reasoningGrid">
        <article className="card reasoningMain">
          <div className="panelLabel">Daily Challenge · {challenge.category}</div>
          <h1>{challenge.prompt}</h1>
          <p className="panelNote">
            Write your first response. The AI coach then challenges your assumptions,
            tests your logic, and pushes a stronger second answer.
          </p>

          <label className="responseLabel" htmlFor="response">
            Your first answer
          </label>
          <textarea
            id="response"
            className="textarea responseBox"
            placeholder="Example: I would stay calm, document my contribution, and follow up with leadership after the meeting..."
          />

          <div className="reasoningActions">
            <button className="btn btnPrimary" type="button">
              Analyze My Reasoning
            </button>
            <Link className="btn" href="/">
              Back to Home
            </Link>
          </div>
        </article>

        <aside className="card coachPanel">
          <div className="panelLabel">AI Coach Preview</div>

          <div className="coachBlock">
            <span>Analysis</span>
            <p>{aiReview.analysis}</p>
          </div>

          <div className="coachBlock highlightBlock">
            <span>Contrarian Challenge</span>
            <p>{aiReview.contrarian}</p>
          </div>

          <div className="coachBlock">
            <span>Follow-Up</span>
            <p>{aiReview.followUp}</p>
          </div>

          <div className="feedbackGrid">
            <div>
              <strong>Strengths</strong>
              {aiReview.strengths.map((item) => <small key={item}>{item}</small>)}
            </div>
            <div>
              <strong>Watch</strong>
              {aiReview.weaknesses.map((item) => <small key={item}>{item}</small>)}
            </div>
          </div>

          <div className="rewardCard">
            <strong>+45 XP</strong>
            <span>Trait increased: Tactical Thinking</span>
          </div>
        </aside>
      </section>
    </main>
  );
}

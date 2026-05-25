import Image from "next/image";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { getDailyChallenge } from "@/lib/challenges";

const challenge = getDailyChallenge();

const PROFILE_STATS = [
  { label: "Rank", value: "Analyst" },
  { label: "Streak", value: "4 day streak" },
  { label: "Reasoning Score", value: "74" },
  { label: "Primary Trait", value: challenge.trait },
];

const FOCUS_AREAS = [
  {
    title: "Workplace Strategy",
    desc: "Power dynamics, timing, negotiation, and reputation control.",
    challengeId: "work-credit",
  },
  {
    title: "Financial Judgment",
    desc: "Risk, opportunity cost, incentives, and long-term thinking.",
    challengeId: "luxury-car",
  },
  {
    title: "Media Manipulation",
    desc: "Framing, emotional triggers, weak evidence, and persuasion tactics.",
    challengeId: "viral-headline",
  },
  {
    title: "Logic Under Pressure",
    desc: "Reason clearly when speed, stress, or uncertainty distort judgment.",
    challengeId: "logic-pressure",
  },
  {
    title: "Social Intelligence",
    desc: "Status, emotional control, persuasion, and interpersonal dynamics.",
    challengeId: "friend-conflict",
  },
  {
    title: "Strategic Thinking",
    desc: "Tradeoffs, second-order effects, leverage, and positioning.",
    challengeId: "business-risk",
  },
  {
    title: "Philosophy of History",
    desc: "Competing narratives, historical interpretation, and bias detection.",
    challengeId: "history-narrative",
  },
  {
    title: "Worldview & Cultures",
    desc: "Understand intelligent disagreement across cultures and beliefs.",
    challengeId: "worldview-disagreement",
  },
  {
    title: "Applied Ethics",
    desc: "Reason through difficult moral tradeoffs without emotional shortcuts.",
    challengeId: "applied-ethics-tradeoff",
  },
  {
    title: "Creative Thinking",
    desc: "Break mental ruts, reframe problems, and generate new angles.",
    challengeId: "creative-reframe",
  },
  {
    title: "Street Lessons",
    desc: "Read incentives, manipulation, risk, and real-world human behavior.",
    challengeId: "street-incentives",
  },
  {
    title: "Literature & Wisdom",
    desc: "Analyze timeless human patterns through stories and character choices.",
    challengeId: "literature-character",
  },
];

export default function Home() {
  return (
    <>
      <AuthGate />

      <main className="appShell">
        <header className="appTop card">
          <Link href="/" className="appBrand" aria-label="UThynk Home">
            <Image
              src="/brand/uthynk-logo.png"
              alt="UThynk"
              width={150}
              height={44}
              priority
            />
            <span>Adaptive AI Reasoning Coach</span>
          </Link>

          <nav className="appNav" aria-label="Main navigation">
            <Link href={`/reasoning?id=${challenge.id}`}>
              Continue Session
            </Link>
            <Link href="/profile">Identity</Link>
            <Link href="/dashboard">Progress</Link>
            <Link href="/store">Premium</Link>
          </nav>
        </header>

        <section className="appHero card">
          <div className="heroCopy">
            <div className="eyebrow">
              Adaptive cognition • Recursive reasoning • Live coaching
            </div>

            <h1>Train your thinking like a skill.</h1>

            <p>
              UThynk is an adaptive reasoning coach that remembers your thinking patterns,
              escalates challenge difficulty, tracks cognitive growth, and pushes back on weak assumptions.
            </p>

            <div className="heroActions">
              <Link
                className="btn btnPrimary"
                href={`/reasoning?id=${challenge.id}`}
              >
                Continue Cognitive Session
              </Link>

              <Link className="btn" href={`/reasoning?id=${challenge.id}`}>
                Resume AI Conversation
              </Link>
            </div>
          </div>

          <div className="challengePreview">
            <div className="panelLabel">Adaptive Coach Session</div>

            <h2>{challenge.prompt}</h2>

            <p>
              The AI coach remembers previous reasoning patterns and adjusts challenge intensity over time.
            </p>

            <div className="progressBar" aria-label="Cognitive progression">
              <div className="progressFill" style={{ width: '74%' }} />
            </div>

            <p className="panelNote">
              Current cognitive pressure: Moderate · Trait evolution active
            </p>

            <Link
              className="btn btnPrimary"
              href={`/reasoning?id=${challenge.id}`}
            >
              Begin Adaptive Loop
            </Link>
          </div>
        </section>

        <section className="appGrid">
          <aside className="card statPanel">
            <div className="panelLabel">Evolving Identity</div>

            <div className="statList">
              {PROFILE_STATS.map((stat) => (
                <div className="statItem" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>

            <div className="progressBar" aria-label="Rank progress">
              <div className="progressFill" style={{ width: '74%' }} />
            </div>

            <p className="panelNote">
              Your reasoning identity evolves continuously based on decision quality,
              emotional control, and strategic depth.
            </p>
          </aside>

          <section className="card methodPanel">
            <div className="panelLabel">Adaptive Coach System</div>

            <div className="methodSteps">
              <div>
                <strong>1</strong>
                <span>Respond by text or voice.</span>
              </div>

              <div>
                <strong>2</strong>
                <span>The AI coach critiques assumptions and reasoning patterns.</span>
              </div>

              <div>
                <strong>3</strong>
                <span>Difficulty escalates dynamically based on your performance.</span>
              </div>

              <div>
                <strong>4</strong>
                <span>Your cognitive profile evolves over time.</span>
              </div>
            </div>
          </section>

          <section className="card focusPanel">
            <div className="panelLabel">Cognitive Training Areas</div>

            <div className="focusGrid">
              {FOCUS_AREAS.map((area) => (
                <Link
                  href={`/reasoning?id=${area.challengeId}`}
                  className="focusCard"
                  key={area.title}
                >
                  <strong>{area.title}</strong>
                  <span>{area.desc}</span>
                </Link>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

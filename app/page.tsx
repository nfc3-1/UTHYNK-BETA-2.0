import Image from "next/image";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { getDailyChallenge } from "@/lib/challenges";

const challenge = getDailyChallenge();

const PROFILE_STATS = [
  { label: "Rank", value: "Analyst" },
  { label: "Streak", value: "1 day" },
  { label: "Reasoning Score", value: "72" },
  { label: "Primary Trait", value: challenge.trait },
];

const FOCUS_AREAS = [
  {
    title: "Workplace Strategy",
    desc: "Practice power dynamics, reputation, timing, and calm execution.",
    challengeId: "work-credit",
  },
  {
    title: "Financial Judgment",
    desc: "Evaluate risk, opportunity cost, incentives, and long-term value.",
    challengeId: "luxury-car",
  },
  {
    title: "Media Manipulation",
    desc: "Spot framing, emotional triggers, weak evidence, and persuasion tactics.",
    challengeId: "viral-headline",
  },
  {
    title: "Logic Under Pressure",
    desc: "Challenge assumptions, avoid bias, and reason clearly when it matters.",
    challengeId: "logic-pressure",
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
            <span>AI Reasoning Coach</span>
          </Link>

          <nav className="appNav" aria-label="Main navigation">
            <Link href={`/reasoning?id=${challenge.id}`}>
              Daily Challenge
            </Link>
            <Link href="/profile">Profile</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/store">Premium</Link>
          </nav>
        </header>

        <section className="appHero card">
          <div className="heroCopy">
            <div className="eyebrow">
              Train judgment. Challenge assumptions. Build discipline.
            </div>

            <h1>Think sharper. Decide better.</h1>

            <p>
              UThynk is an AI-powered reasoning coach built to sharpen judgment,
              expose blind spots, and train better decision-making through daily
              real-world challenges.
            </p>

            <div className="heroActions">
              <Link
                className="btn btnPrimary"
                href={`/reasoning?id=${challenge.id}`}
              >
                Start Thinking
              </Link>

              <Link className="btn" href={`/reasoning?id=${challenge.id}`}>
                Take Today’s Challenge
              </Link>
            </div>
          </div>

          <div className="challengePreview">
            <div className="panelLabel">Today’s Challenge</div>

            <h2>{challenge.prompt}</h2>

            <p>
              Answer once. Get challenged. Refine your thinking. Earn progress.
            </p>

            <Link
              className="btn btnPrimary"
              href={`/reasoning?id=${challenge.id}`}
            >
              Begin AI Reasoning Loop
            </Link>
          </div>
        </section>

        <section className="appGrid">
          <aside className="card statPanel">
            <div className="panelLabel">Cognitive Profile</div>

            <div className="statList">
              {PROFILE_STATS.map((stat) => (
                <div className="statItem" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>

            <div className="progressBar" aria-label="Rank progress">
              <div className="progressFill" />
            </div>

            <p className="panelNote">
              Progress now tracks reasoning growth, not passive lesson completion.
            </p>
          </aside>

          <section className="card methodPanel">
            <div className="panelLabel">How UThynk Works</div>

            <div className="methodSteps">
              <div>
                <strong>1</strong>
                <span>Respond to a real-world scenario.</span>
              </div>

              <div>
                <strong>2</strong>
                <span>
                  AI evaluates logic, assumptions, and blind spots.
                </span>
              </div>

              <div>
                <strong>3</strong>
                <span>
                  You get a contrarian challenge and follow-up.
                </span>
              </div>

              <div>
                <strong>4</strong>
                <span>
                  Your XP, rank, and cognitive profile update.
                </span>
              </div>
            </div>
          </section>

          <section className="card focusPanel">
            <div className="panelLabel">Training Areas</div>

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

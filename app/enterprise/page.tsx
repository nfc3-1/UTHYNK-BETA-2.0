"use client";

import Link from "next/link";

const teams = [
  {
    name: "Leadership Cohort",
    reasoning: 81,
    engagement: 92,
    growth: "+14%",
  },
  {
    name: "Sales Team",
    reasoning: 73,
    engagement: 84,
    growth: "+8%",
  },
  {
    name: "Analyst Group",
    reasoning: 88,
    engagement: 89,
    growth: "+17%",
  },
];

export default function EnterprisePage() {
  return (
    <main className="appShell">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          <img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo" />
          <span className="brandCopy">
            <strong>UThynk Enterprise</strong>
            <small>Better thinking. <em>Better decisions.</em></small>
          </span>
        </Link>

        <nav className="appNav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/debate">Debate</Link>
        </nav>
      </header>

      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">Enterprise Intelligence</div>
          <h1>Organizational reasoning analytics.</h1>
          <p>
            UThynk Enterprise measures reasoning quality, engagement, and cognitive growth across teams.
          </p>
        </div>

        <div className="challengePreview">
          <div className="panelLabel">Enterprise Objective</div>
          <p>
            Build higher-quality decision-making cultures through adaptive reasoning systems.
          </p>
        </div>
      </section>

      <section className="card methodPanel" style={{ marginTop: 18 }}>
        <div className="panelLabel">Cohort Intelligence</div>

        <div className="methodSteps">
          {teams.map((team) => (
            <div key={team.name}>
              <strong>{team.name}</strong>
              <span>
                Reasoning {team.reasoning} · Engagement {team.engagement} · Growth {team.growth}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

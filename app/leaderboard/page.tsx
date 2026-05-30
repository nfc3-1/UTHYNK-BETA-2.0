"use client";

import Link from "next/link";

const leaderboard = [
  {
    username: "StrategicMind",
    rank: "Architect",
    xp: 8420,
    streak: 41,
    trait: "Strategic Thinking",
  },
  {
    username: "LogicBuilder",
    rank: "Strategist",
    xp: 5310,
    streak: 23,
    trait: "Bias Detection",
  },
  {
    username: "CalmReason",
    rank: "Analyst",
    xp: 2140,
    streak: 12,
    trait: "Emotional Control",
  },
];

export default function LeaderboardPage() {
  return (
    <main className="appShell">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          <img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo" />
          <span className="brandCopy">
            <strong>UThynk</strong>
            <small>Better thinking. <em>Better decisions.</em></small>
          </span>
        </Link>

        <nav className="appNav">
          <Link href="/">Home</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      </header>

      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">Competitive Intelligence</div>
          <h1>Cognitive Rankings</h1>
          <p>
            UThynk tracks reasoning growth, consistency, and cognitive progression across users.
          </p>
        </div>

        <div className="challengePreview">
          <div className="panelLabel">Global Status</div>
          <h2>Master of Thought</h2>
          <p>
            Reserved for elite long-term reasoning performance and consistency.
          </p>
        </div>
      </section>

      <section className="card methodPanel" style={{ marginTop: 18 }}>
        <div className="panelLabel">Top Cognitive Profiles</div>

        <div className="methodSteps">
          {leaderboard.map((user) => (
            <div key={user.username}>
              <strong>{user.username}</strong>
              <span>
                {user.rank} · {user.xp} XP · {user.streak} day streak · {user.trait}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

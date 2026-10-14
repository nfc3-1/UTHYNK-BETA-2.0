"use client";

import RestrictedNavLinks from '@/components/RestrictedNavLinks';
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
          <RestrictedNavLinks />
          <Link href="/profile">Profile</Link>
        </nav>
      </header>

      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">Demo preview</div>
          <h1>Sample Participation Board</h1>
          <p>
            These fictional profiles, XP totals, and streaks illustrate a possible participation board. They are not real users, cognitive rankings, or measured learning gains.
          </p>
        </div>

        <div className="challengePreview">
          <div className="panelLabel">Example rank</div>
          <h2>Master of Thought</h2>
          <p>
            Ranks reflect participation XP, not validated reasoning ability.
          </p>
        </div>
      </section>

      <section className="card methodPanel" style={{ marginTop: 18 }}>
        <div className="panelLabel">Fictional profiles — demo data</div>

        <div className="methodSteps">
          {leaderboard.map((user) => (
            <div key={user.username}>
              <span><b>{user.username} (demo)</b></span>
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

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "uthynk-profile";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        setData(json);
        return;
      }

      const profile = JSON.parse(stored);

      const res = await fetch(`/api/dashboard?userId=${profile.id}`);
      const json = await res.json();
      setData(json);
    }

    loadDashboard();
  }, []);

  const profile = data?.profile;
  const sessions = data?.sessions || [];

  return (
    <main className="appShell">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          UThynk
        </Link>

        <nav className="appNav">
          <Link href="/">Home</Link>
          <Link href="/reasoning">Challenge</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      </header>

      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">Cognitive Analytics</div>
          <h1>Your reasoning patterns.</h1>
          <p>
            UThynk tracks decision quality, streaks, cognitive traits, and long-term reasoning growth.
          </p>
        </div>

        <div className="challengePreview">
          <div className="panelLabel">Current Standing</div>

          <h2>{profile?.rank || "Observer"}</h2>

          <p>
            Primary Trait: {profile?.primary_trait || "Analytical"}
          </p>

          <div className="rewardCard">
            <strong>{profile?.xp || 0} XP</strong>
            <span>Streak: {profile?.streak || 0} days</span>
            <span>Reasoning Score: {profile?.reasoning_score || 70}</span>
          </div>
        </div>
      </section>

      <section className="appGrid">
        <aside className="card statPanel">
          <div className="panelLabel">Performance Metrics</div>

          <div className="statList">
            <div className="statItem">
              <span>Challenges Completed</span>
              <strong>{sessions.length}</strong>
            </div>

            <div className="statItem">
              <span>Average Reasoning</span>
              <strong>
                {sessions.length
                  ? Math.round(
                      sessions.reduce(
                        (sum: number, s: any) => sum + (s.reasoning_score || 0),
                        0
                      ) / sessions.length
                    )
                  : 70}
              </strong>
            </div>

            <div className="statItem">
              <span>Strongest Trait</span>
              <strong>{profile?.primary_trait || "Analytical"}</strong>
            </div>

            <div className="statItem">
              <span>Current Rank</span>
              <strong>{profile?.rank || "Observer"}</strong>
            </div>
          </div>
        </aside>

        <section className="card methodPanel">
          <div className="panelLabel">Recent Cognitive Sessions</div>

          <div className="methodSteps">
            {sessions.map((session: any) => (
              <div key={session.id}>
                <strong>{session.reasoning_score}</strong>
                <span>
                  {session.challenge_category} · {session.trait_detected}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card focusPanel">
          <div className="panelLabel">Behavioral Direction</div>

          <div className="focusGrid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="focusCard">
              <strong>Strategic Growth</strong>
              <span>
                Your reasoning trend is improving through repetition and contrarian challenge exposure.
              </span>
            </div>

            <div className="focusCard">
              <strong>Blind Spot Reduction</strong>
              <span>
                UThynk tracks recurring weaknesses to improve long-term judgment quality.
              </span>
            </div>

            <div className="focusCard">
              <strong>Cognitive Identity</strong>
              <span>
                Your progression is building a persistent reasoning profile over time.
              </span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

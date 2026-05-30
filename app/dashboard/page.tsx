"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getAdaptiveChallenges,
  getCoachingIntensity,
} from "@/lib/adaptive";

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
      setData({
        ...json,
        profile: {
          ...(profile || {}),
          ...(json.profile || {}),
          xp: json.profile?.xp ?? profile.xp,
          streak: json.profile?.streak ?? profile.streak,
          rank: json.profile?.rank ?? profile.rank,
          reasoning_score: json.profile?.reasoning_score ?? profile.reasoning_score,
          primary_trait: json.profile?.primary_trait ?? profile.primary_trait,
        },
      });
    }

    loadDashboard();
  }, []);

  const profile = data?.profile;
  const sessions = data?.sessions || [];

  const recommendations = useMemo(
    () => getAdaptiveChallenges(profile),
    [profile]
  );

  const coachingIntensity = getCoachingIntensity(
    profile?.streak,
    profile?.reasoning_score
  );

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
            <span>Coaching Mode: {coachingIntensity}</span>
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
                  {session.challenge_category} - {session.trait_detected}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card focusPanel">
          <div className="panelLabel">UThynk Recommendations</div>

          <div className="focusGrid" style={{ gridTemplateColumns: "1fr" }}>
            {recommendations.map((challenge) => (
              <Link
                key={challenge.id}
                href={`/reasoning?id=${challenge.id}`}
                className="focusCard"
              >
                <strong>{challenge.title}</strong>
                <span>
                  {challenge.category} - {challenge.difficulty}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

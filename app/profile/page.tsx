'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'uthynk-profile';

export default function Profile() {
  const [style, setStyle] = useState('balanced');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      const stored = localStorage.getItem(STORAGE_KEY);
      const profile = stored ? JSON.parse(stored) : null;
      const url = profile?.id ? `/api/dashboard?userId=${profile.id}` : '/api/dashboard';
      const res = await fetch(url);
      const json = await res.json();

      setData({
        ...json,
        profile: {
          ...(json.profile || {}),
          ...(profile || {}),
          xp: json.profile?.xp ?? profile?.xp,
          streak: json.profile?.streak ?? profile?.streak,
          rank: json.profile?.rank ?? profile?.rank,
          reasoning_score: json.profile?.reasoning_score ?? profile?.reasoning_score,
          primary_trait: json.profile?.primary_trait ?? profile?.primary_trait,
        },
      });
    }

    loadProfile();
  }, []);

  const profile = data?.profile || {};
  const sessions = data?.sessions || [];
  const traits = useMemo(() => {
    const counts = new Map<string, number>();

    sessions.forEach((session: any) => {
      if (!session.trait_detected) return;
      counts.set(session.trait_detected, (counts.get(session.trait_detected) || 0) + 1);
    });

    const dynamicTraits = Array.from(counts.entries()).map(([label, count]) => ({
      label,
      value: Math.min(100, 62 + count * 6),
    }));

    return dynamicTraits.length
      ? dynamicTraits
      : [{ label: profile.primary_trait || 'Analytical', value: profile.reasoning_score || 70 }];
  }, [profile.primary_trait, profile.reasoning_score, sessions]);
  const averageReasoning = sessions.length
    ? Math.round(
        sessions.reduce((sum: number, session: any) => sum + (session.reasoning_score || 0), 0) /
          sessions.length
      )
    : profile.reasoning_score || 70;

  return (
    <main className="appShell">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          UThynk
        </Link>

        <nav className="appNav">
          <Link href="/">Home</Link>
          <Link href="/reasoning">Challenge</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">Cognitive Profile</div>
          <h1>Track how you think.</h1>
          <p>
            UThynk measures reasoning growth, challenge consistency, and
            decision-making patterns over time.
          </p>
        </div>

        <div className="challengePreview">
          <div className="panelLabel">Current Identity</div>
          <h2>{profile.rank || 'Observer'}</h2>
          <p>
            Your strongest emerging trait is {profile.primary_trait || 'Analytical'}.
          </p>
          <div className="rewardCard">
            <strong>{profile.xp || 0} XP</strong>
            <span>Current streak: {profile.streak || 0} days</span>
          </div>
        </div>
      </section>

      <section className="appGrid">
        <aside className="card statPanel">
          <div className="panelLabel">Reasoning Metrics</div>

          <div className="statList">
            <div className="statItem">
              <span>Reasoning Score</span>
              <strong>{profile.reasoning_score || 70}</strong>
            </div>

            <div className="statItem">
              <span>Challenges Completed</span>
              <strong>{sessions.length}</strong>
            </div>

            <div className="statItem">
              <span>Average Reasoning</span>
              <strong>{averageReasoning}</strong>
            </div>

            <div className="statItem">
              <span>Growth Trend</span>
              <strong>{sessions.length > 1 ? 'Active' : 'Starting'}</strong>
            </div>
          </div>
        </aside>

        <section className="card methodPanel">
          <div className="panelLabel">Reasoning Traits</div>

          <div className="methodSteps">
            {traits.map((trait) => (
              <div key={trait.label}>
                <strong>{trait.value}</strong>
                <span>{trait.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card focusPanel">
          <div className="panelLabel">Challenge History</div>

          <div className="focusGrid" style={{ gridTemplateColumns: '1fr' }}>
            {sessions.slice(0, 5).map((session: any) => (
              <div className="focusCard" key={session.id}>
                <strong>{session.challenge_category || 'Reasoning Session'}</strong>
                <span>
                  {session.reasoning_score || 0} reasoning score - {session.trait_detected || 'Trait evolving'}
                </span>
              </div>
            ))}
            {!sessions.length ? (
              <div className="focusCard">
                <strong>No completed sessions yet</strong>
                <span>Complete a reasoning challenge to start building history.</span>
              </div>
            ) : null}
          </div>
        </section>
      </section>

      <section className="card methodPanel" style={{ marginTop: 18 }}>
        <div className="panelLabel">Challenge Intensity</div>

        <div className="methodSteps">
          <label>
            <input
              type="radio"
              checked={style === 'gentle'}
              onChange={() => setStyle('gentle')}
            />{' '}
            Gentle Reflection
          </label>

          <label>
            <input
              type="radio"
              checked={style === 'balanced'}
              onChange={() => setStyle('balanced')}
            />{' '}
            Balanced Challenge
          </label>

          <label>
            <input
              type="radio"
              checked={style === 'strong'}
              onChange={() => setStyle('strong')}
            />{' '}
            Strong Challenge
          </label>
        </div>
      </section>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  getAdaptiveChallenges,
  getCoachingIntensity,
} from '@/lib/adaptive';

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
  const recommendations = useMemo(() => getAdaptiveChallenges(profile), [profile]);
  const coachingIntensity = getCoachingIntensity(profile.streak, profile.reasoning_score);
  const identityLabels = [
    profile.primary_trait || 'Analytical Thinker',
    sessions.length >= 3 ? 'Evidence Builder' : 'Question Assumptions',
    averageReasoning >= 80 ? 'Strategic Pattern Spotter' : 'Growth in Progress',
  ];

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
          <Link href="/lessons">Lessons</Link>
          <Link href="/reasoning">Reasoning</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/store">Store</Link>
        </nav>
      </header>

      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">Profile</div>
          <h1>{profile.rank || 'Observer'}</h1>
          <p>
            Your identity, progress, traits, and session history now live in one place.
            UThynk tracks who your thinking is becoming, not just what you scored.
          </p>
          <div className="profileIdentityTags">
            {identityLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>

        <div className="challengePreview">
          <div className="panelLabel">Growth Snapshot</div>
          <h2>{profile.primary_trait || 'Analytical Thinker'}</h2>
          <p>
            Coaching mode: {coachingIntensity}. Your next sessions should strengthen
            evidence, adaptability, and strategic restraint.
          </p>
          <div className="profileMetricStrip">
            <div>
              <strong>{profile.xp || 0}</strong>
              <span>XP</span>
            </div>
            <div>
              <strong>{profile.streak || 0}</strong>
              <span>day streak</span>
            </div>
            <div>
              <strong>{profile.reasoning_score || 70}</strong>
              <span>score</span>
            </div>
          </div>
        </div>
      </section>

      <section className="appGrid">
        <aside className="card statPanel">
          <div className="panelLabel">Overview</div>

          <div className="statList">
            <div className="statItem">
              <span>Current identity</span>
              <strong>{profile.primary_trait || 'Analytical'}</strong>
            </div>

            <div className="statItem">
              <span>Completed</span>
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
          <div className="panelLabel">Traits</div>

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
          <div className="panelLabel">Recommended Next</div>

          <div className="focusGrid" style={{ gridTemplateColumns: '1fr' }}>
            {recommendations.slice(0, 4).map((challenge) => (
              <Link
                href={`/reasoning?id=${challenge.id}`}
                className="focusCard"
                key={challenge.id}
              >
                <strong>{challenge.title}</strong>
                <span>{challenge.category} - {challenge.difficulty}</span>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <section className="appGrid profileLowerGrid">
        <section className="card focusPanel">
          <div className="panelLabel">Session History</div>

          <div className="focusGrid" style={{ gridTemplateColumns: '1fr' }}>
            {sessions.slice(0, 6).map((session: any) => (
              <div className="focusCard" key={session.id}>
                <strong>{session.trait_detected || 'Trait evolving'}</strong>
                <span>
                  {session.challenge_category || 'Reasoning Session'} - {session.reasoning_score || 0}
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

        <section className="card methodPanel">
          <div className="panelLabel">Challenge Intensity</div>

          <div className="methodSteps">
            {[
              ['gentle', 'Gentle Reflection'],
              ['balanced', 'Balanced Challenge'],
              ['strong', 'Strong Challenge'],
            ].map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  checked={style === value}
                  onChange={() => setStyle(value)}
                />{' '}
                {label}
              </label>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

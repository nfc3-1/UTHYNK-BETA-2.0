'use client';

import Link from 'next/link';
import { useState } from 'react';

const traits = [
  { label: 'Strategic Thinking', value: 78 },
  { label: 'Emotional Control', value: 72 },
  { label: 'Bias Detection', value: 69 },
  { label: 'Decision Discipline', value: 74 },
];

const recentChallenges = [
  'Workplace reputation conflict',
  'Luxury spending decision',
  'Media manipulation analysis',
];

export default function Profile() {
  const [style, setStyle] = useState('balanced');

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
          <h2>Analyst</h2>
          <p>
            Your strongest emerging trait is Strategic Thinking.
          </p>
          <div className="rewardCard">
            <strong>1,240 XP</strong>
            <span>Current streak: 4 days</span>
          </div>
        </div>
      </section>

      <section className="appGrid">
        <aside className="card statPanel">
          <div className="panelLabel">Reasoning Metrics</div>

          <div className="statList">
            <div className="statItem">
              <span>Reasoning Score</span>
              <strong>74</strong>
            </div>

            <div className="statItem">
              <span>Challenges Completed</span>
              <strong>31</strong>
            </div>

            <div className="statItem">
              <span>Strongest Category</span>
              <strong>Strategy</strong>
            </div>

            <div className="statItem">
              <span>Growth Trend</span>
              <strong>+12%</strong>
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
            {recentChallenges.map((challenge) => (
              <div className="focusCard" key={challenge}>
                <strong>{challenge}</strong>
                <span>
                  AI reasoning analysis stored for future progression tracking.
                </span>
              </div>
            ))}
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

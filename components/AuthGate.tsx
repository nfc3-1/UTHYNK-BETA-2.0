'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'uthynk-profile';

export default function AuthGate() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [ageBand, setAgeBand] = useState('18_plus');
  const [goal, setGoal] = useState('sharpen_reasoning');
  const [style, setStyle] = useState('balanced');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);

    if (existing) {
      setComplete(true);
    }
  }, []);

  async function continueIntoApp() {
    try {
      setLoading(true);

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          ageBand,
          onboardingGoal: goal,
          onboardingStyle: style,
          password,
        }),
      });

      const data = await res.json();

      if (data.profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.profile));
        setComplete(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (complete) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(7,10,25,0.82)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
      }}
    >
      <div className="card" style={{ width: 'min(620px,92vw)', padding: 30 }}>
        <div className="panelLabel">Cognitive Calibration</div>

        <h2 style={{ marginTop: 12 }}>Build your reasoning identity.</h2>

        <p className="panelNote">
          UThynk adapts coaching style, challenge intensity, and reasoning pressure based on your profile.
        </p>

        <div style={{ display: 'grid', gap: 14, marginTop: 20 }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="textarea"
            style={{ minHeight: 0, height: 54 }}
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="textarea"
            style={{ minHeight: 0, height: 54 }}
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password (production auth later)"
            className="textarea"
            style={{ minHeight: 0, height: 54 }}
          />

          <select
            value={ageBand}
            onChange={(e) => setAgeBand(e.target.value)}
            className="textarea"
            style={{ minHeight: 0, height: 54 }}
          >
            <option value="under_13">Under 13</option>
            <option value="13_17">13–17</option>
            <option value="18_plus">18+</option>
          </select>

          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="textarea"
            style={{ minHeight: 0, height: 54 }}
          >
            <option value="sharpen_reasoning">Sharpen my reasoning</option>
            <option value="career_growth">Improve career decisions</option>
            <option value="financial_judgment">Improve financial judgment</option>
            <option value="debate_skills">Become better at debate</option>
          </select>

          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="textarea"
            style={{ minHeight: 0, height: 54 }}
          >
            <option value="supportive">Supportive coaching</option>
            <option value="balanced">Balanced challenge</option>
            <option value="contrarian">Strong contrarian pushback</option>
          </select>
        </div>

        <button
          className="btn btnPrimary"
          style={{ marginTop: 22, width: '100%' }}
          onClick={continueIntoApp}
          disabled={!email || loading}
        >
          {loading ? 'Calibrating Profile...' : 'Begin Cognitive Training'}
        </button>
      </div>
    </div>
  );
}

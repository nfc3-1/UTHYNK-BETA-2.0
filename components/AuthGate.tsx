'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'uthynk-profile';

export default function AuthGate() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
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

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username }),
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
        background: 'rgba(7,10,25,0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
      }}
    >
      <div className="card" style={{ width: 'min(520px,92vw)', padding: 28 }}>
        <div className="panelLabel">Begin Cognitive Profile</div>

        <h2 style={{ marginTop: 12 }}>Create your reasoning identity.</h2>

        <p className="panelNote">
          UThynk tracks reasoning growth, cognitive traits, and progression over time.
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
        </div>

        <button
          className="btn btnPrimary"
          style={{ marginTop: 22, width: '100%' }}
          onClick={continueIntoApp}
          disabled={!email || loading}
        >
          {loading ? 'Building Profile...' : 'Start Thinking'}
        </button>
      </div>
    </div>
  );
}

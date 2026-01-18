'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import challenges from '@/data/challenges.json';
import categories from '@/data/categories.json';
import { mockThinkingFeedback } from '@/lib/mockAi';

type Challenge = {
  id: string;
  category: string; // category slug
  title: string;
  prompt: string;
  minutes?: number;
  xp?: number;
  difficulty?: string;
};

type Category = {
  slug: string;
  name: string;
};

export default function ThinkingSession({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = decodeURIComponent(params.id || '');

  const ch = useMemo(() => {
    return (challenges as Challenge[]).find((x) => String(x.id) === String(id)) || null;
  }, [id]);

  const cat = useMemo(() => {
    if (!ch) return null;
    return (categories as Category[]).find((c) => c.slug === ch.category) || null;
  }, [ch]);

  const [text, setText] = useState('');
  const [resp, setResp] = useState<null | {
    understanding: string;
    assumption: string;
    reframe: string;
    question: string;
  }>(null);

  if (!ch) {
    return (
      <main className="ppShell">
        <div className="card p-20">
          <h1 className="heroTitle">Challenge not found</h1>
          <p className="heroSub">That challenge doesn’t exist yet.</p>
          <div className="mt-16" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn btnPrimary" href="/">
              Go Home
            </Link>
            <button className="btn" onClick={() => router.back()}>
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  const minutes = ch.minutes ?? 3;
  const xp = ch.xp ?? 10;
  const difficulty = ch.difficulty ?? 'Standard';

  return (
    <main className="ppShell">
      <div className="col">
        {/* Header card */}
        <div className="card p-20">
          <div className="smallMuted">
            {cat?.name || 'Category'} · 🧠 Thinking Practice · ~{minutes} min
          </div>

          <h1 className="heroTitle" style={{ marginTop: 6 }}>
            {ch.title}
          </h1>

          <p className="heroSub">{ch.prompt}</p>

          <div className="mt-16" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className="badge">+{xp} XP</span>
            <span className="badge">{difficulty}</span>

            <Link className="btn" href={cat ? `/category/${encodeURIComponent(cat.slug)}` : '/'}>
              Back to Category
            </Link>

            <Link className="btn" href="/">
              All Categories
            </Link>
          </div>
        </div>

        {/* Input card */}
        <div className="card p-20">
          <div style={{ fontWeight: 900 }}>Your thinking</div>
          <div className="smallMuted mt-12">
            Write what comes to mind. You can change your thinking later.
          </div>

          <textarea
            className="textarea mt-12"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your thinking here…"
          />

          <div className="mt-16" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btnPrimary"
              onClick={() => setResp(mockThinkingFeedback(text, ch.prompt))}
              disabled={!text.trim()}
              title={!text.trim() ? 'Write something first' : 'Generate feedback'}
            >
              Get Thinking Feedback
            </button>

            <button
              className="btn"
              onClick={() => {
                setText('');
                setResp(null);
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Feedback card */}
        {resp && (
          <div className="card p-20">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontWeight: 900 }}>Thinking Feedback</div>
              <div className="smallMuted">Mock feedback (AI will be wired in Pass 3)</div>
            </div>

            <div className="divider" />

            <Section title="Understanding" text={resp.understanding} />
            <Section title="Thinking check" text={resp.assumption} />
            <Section title="Another way to look at it" text={resp.reframe} />
            <Section title="One good question" text={resp.question} />

            <div className="mt-16" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => setResp(mockThinkingFeedback(text, ch.prompt))}>
                Another angle
              </button>

              <button
                className="btn"
                onClick={() =>
                  setResp({
                    ...resp,
                    question:
                      "What’s the strongest counterexample to your view—and what would it imply?",
                  })
                }
              >
                Go deeper
              </button>

              <button className="btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Rewrite my thinking
              </button>
            </div>
          </div>
        )}

        {/* Completion card */}
        <div className="card p-20">
          <div style={{ fontWeight: 900 }}>Completion</div>
          <div className="smallMuted mt-12">
            In Pass 2, we’ll record streak, Free Pass usage, and XP.
          </div>

          <div className="mt-16" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn btnPrimary" href="/daily">
              Try today’s Daily Challenge
            </Link>
            <Link className="btn" href="/stats">
              View Stats &amp; Titles
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-16">
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div className="smallMuted mt-12" style={{ fontSize: 13, lineHeight: 1.45 }}>
        {text}
      </div>
    </div>
  );
}

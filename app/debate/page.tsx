"use client";

import Link from "next/link";
import { useState } from "react";

const scenarios = [
  {
    title: "AI Regulation",
    positionA: "Governments should aggressively regulate AI development.",
    positionB: "Heavy regulation slows innovation and weakens competitiveness.",
  },
  {
    title: "Remote Work",
    positionA: "Remote work improves productivity and flexibility.",
    positionB: "In-person collaboration creates stronger long-term outcomes.",
  },
];

export default function DebatePage() {
  const [index, setIndex] = useState(0);

  const scenario = scenarios[index];

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
          <Link href="/teacher">Teacher</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/reasoning">Challenge</Link>
          <Link href="/leaderboard">Leaderboard</Link>
        </nav>
      </header>

      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">Debate Simulator</div>
          <h1>{scenario.title}</h1>
          <p>
            Train the ability to reason through competing intelligent perspectives.
          </p>
        </div>

        <div className="challengePreview">
          <div className="panelLabel">Reasoning Objective</div>
          <p>
            Steelman both positions before deciding which argument is stronger.
          </p>
        </div>
      </section>

      <section className="appGrid">
        <section className="card methodPanel">
          <div className="panelLabel">Position A</div>
          <div className="focusCard">
            <strong>{scenario.positionA}</strong>
          </div>
        </section>

        <section className="card methodPanel">
          <div className="panelLabel">Position B</div>
          <div className="focusCard">
            <strong>{scenario.positionB}</strong>
          </div>
        </section>

        <section className="card focusPanel">
          <div className="panelLabel">Reasoning Drill</div>

          <div className="focusGrid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="focusCard">
              <strong>Step 1</strong>
              <span>Argue the side you initially disagree with.</span>
            </div>

            <div className="focusCard">
              <strong>Step 2</strong>
              <span>Identify hidden assumptions on both sides.</span>
            </div>

            <div className="focusCard">
              <strong>Step 3</strong>
              <span>Decide which argument survives stronger scrutiny.</span>
            </div>
          </div>

          <button
            className="btn btnPrimary"
            style={{ marginTop: 18 }}
            onClick={() => setIndex((current) => (current + 1) % scenarios.length)}
          >
            Next Debate
          </button>
        </section>
      </section>
    </main>
  );
}

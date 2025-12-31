'use client';
import { useMemo, useState } from 'react';
import categories from '@/data/categories.json';
import dykItems from '@/data/did_you_know.json';
import Link from 'next/link';

function pickIndex(seed:number, len:number){
  return Math.abs(Math.floor(seed)) % Math.max(1,len);
}

export default function HomeShell(){
  // placeholder values (will be wired later)
  const streakDays = 3;
  const wisdomPoints = 120;
  const title = 'Curious Mind';
  const freePassLeft = 3;

  const [dykIdx, setDykIdx] = useState<number>(()=>{
    const s = Date.now() / 1000;
    return pickIndex(s, dykItems.length);
  });

  const currentDyk = useMemo(()=> dykItems[dykIdx % dykItems.length], [dykIdx]);

  const foundations = (categories as any[]).filter(c=>c.foundation);
  const rest = (categories as any[]).filter(c=>!c.foundation);

  return (
    <div className="row">
      {/* Left panel */}
      <aside className="col" style={{flex:'0 0 280px'}}>
        <div className="card p-18">
          <div className="badge">🔥 Streak: <b>{streakDays}</b> days</div>
          <div className="mt-12 smallMuted">Your current title</div>
          <div style={{fontSize:18, fontWeight:900, marginTop:4}}>{title}</div>

          <div className="mt-16 kpiRow">
            <div className="kpi">
              <span className="smallMuted">Wisdom Points</span>
              <b>🪙 {wisdomPoints}</b>
            </div>
            <div className="kpi">
              <span className="smallMuted">Free Pass</span>
              <b>🎟 {freePassLeft} left</b>
            </div>
          </div>

          <div className="progressBar" aria-label="Progress to next title">
            <div className="progressFill" />
          </div>
          <div className="smallMuted mt-12">Next title in ~120 XP</div>

          <div className="mt-16" style={{display:'flex', gap:10}}>
            <button className="btn btnPrimary" style={{flex:1}}>Start Thinking</button>
            <button className="btn" style={{flex:1}}>Continue</button>
          </div>
        </div>

        <div className="card p-18">
          <div style={{fontWeight:900}}>Today’s focus</div>
          <div className="smallMuted mt-12">Pick one: clarify, challenge, or create.</div>
          <div className="mt-16" style={{display:'grid', gap:10}}>
            <button className="btn">Clarify an assumption</button>
            <button className="btn">Steelman the other side</button>
            <button className="btn">Reframe the problem</button>
          </div>
        </div>
      </aside>

      {/* Center panel */}
      <section className="col" style={{flex:'1 1 auto'}}>
        <div className="card p-20">
          <h1 className="heroTitle">Learn how to think — not what to think.</h1>
          <p className="heroSub">
            Practice reasoning, perspective, and judgment across different ways of thinking.
            Start with the <b>Foundations</b> or explore anything that sparks your curiosity.
          </p>

          <div className="mt-16" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <span className="badge">🧠 Foundations emphasized</span>
            <span className="badge">⚡ Teen-friendly, no preaching</span>
            <span className="badge">🎯 Skill-based challenges</span>
          </div>
        </div>

        <div className="card p-20">
          <div className="mb-10" style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10, flexWrap:'wrap'}}>
            <div style={{fontWeight:900, fontSize:16}}>Foundations</div>
            <div className="smallMuted">Start here to build your thinking toolkit.</div>
          </div>
          <div className="grid">
            {foundations.map((c:any)=>(
              <CategoryTile key={c.id} c={c} emphasized />
            ))}
          </div>

          <div className="mb-10 mt-20" style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10, flexWrap:'wrap'}}>
            <div style={{fontWeight:900, fontSize:16}}>Explore</div>
            <div className="smallMuted">Different lenses, same goal: clearer thinking.</div>
          </div>
          <div className="grid">
            {rest.map((c:any)=>(
              <CategoryTile key={c.id} c={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Right panel */}
      <aside className="col" style={{flex:'0 0 280px'}}>
        <div className="card p-18">
          <div className="dykCard">
            <p className="dykTitle">Did you know?</p>
            <p className="dykText">{currentDyk}</p>
            <div className="dykFooter">
              <button className="btn" onClick={()=>setDykIdx(i=>i+1)}>Next</button>
              <Link href="/" className="smallMuted">Open mini-challenge →</Link>
            </div>
          </div>

          <div className="mt-16" style={{display:'grid', gap:10}}>
            <button className="btn">Quick Skill: Name 1 assumption</button>
            <button className="btn">Quick Skill: Strongest opposite view</button>
            <button className="btn">Quick Skill: Evidence check</button>
          </div>
        </div>

        <div className="card p-18">
          <div style={{fontWeight:900}}>What you’re building</div>
          <div className="smallMuted mt-12">
            A thinking habit. A clearer mind. A stronger inner compass.
          </div>
          <div className="mt-16">
            <div className="badge">🏆 Titles grow slowly</div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function CategoryTile({ c, emphasized }: { c:any; emphasized?: boolean }){
  const tag = emphasized ? 'Foundation' : 'Skill';
  return (
    <div className="tile" role="button" tabIndex={0} aria-label={`Open ${c.name}`}>
      <div className="tileTop">
        <div>
          <div className="tileName">{c.name}</div>
          <div className="tileHint">{emphasized ? 'Start here' : 'Explore a lens'}</div>
        </div>
        <div className="tileTag">{tag}</div>
      </div>

      <div className="tileOverlay" aria-hidden>
        <div className="overlayText">{c.synopsis}</div>
        <div className="overlayCta">
          <span>Hover synopsis</span>
          <span>Explore →</span>
        </div>
      </div>
    </div>
  );
}

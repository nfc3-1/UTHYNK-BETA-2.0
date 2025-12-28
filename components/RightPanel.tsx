'use client';
import { useMemo, useState } from 'react';
import dykItems from '@/data/did_you_know.json';
import Link from 'next/link';

function pickIndex(seed:number, len:number){
  return Math.abs(Math.floor(seed)) % Math.max(1,len);
}

export default function RightPanel(){
  const [idx, setIdx] = useState<number>(()=> pickIndex(Date.now()/1000, dykItems.length));
  const current = useMemo(()=> dykItems[idx % dykItems.length], [idx]);

  return (
    <div className="col">
      <div className="card p-18">
        <div className="dykCard">
          <p className="dykTitle">Did you know?</p>
          <p className="dykText">{current}</p>
          <div className="dykFooter">
            <button className="btn" onClick={()=>setIdx(i=>i+1)}>Next</button>
            <Link href="/daily" className="smallMuted">Open mini-challenge →</Link>
          </div>
        </div>

        <div className="mt-16" style={{display:'grid', gap:10}}>
          <Link className="btn" href="/daily">Quick Skill: Name 1 assumption</Link>
          <Link className="btn" href="/daily">Quick Skill: Strongest opposite view</Link>
          <Link className="btn" href="/daily">Quick Skill: Evidence check</Link>
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
    </div>
  );
}

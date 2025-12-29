'use client';
import challenges from '@/data/challenges.json';
import categories from '@/data/categories.json';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { mockThinkingFeedback } from '@/lib/mockAi';

export default function ThinkingSession({ params }: { params: { id: string } }) {
  const id = params.id;
  const ch = (challenges as any[]).find(x => x.id === id);

  const [text, setText] = useState('');
  const [resp, setResp] = useState<any>(null);

  const cat = useMemo(()=>{
    if (!ch) return null;
    return (categories as any[]).find(c => c.slug === ch.category) || null;
  }, [ch]);

  if (!ch) {
    return (
      <div className="card p-20">
        <h1 className="heroTitle">Challenge not found</h1>
        <p className="heroSub">That challenge doesn’t exist yet.</p>
        <div className="mt-16"><Link className="btn btnPrimary" href="/">Go Home</Link></div>
      </div>
    );
  }

  return (
    <div className="col">
      <div className="card p-20">
        <div className="smallMuted">{cat?.name || 'Category'} · 🧠 Thinking Practice · ~{ch.minutes} min</div>
        <h1 className="heroTitle" style={{marginTop:6}}>{ch.title}</h1>
        <p className="heroSub">{ch.prompt}</p>
        <div className="mt-16" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
          <span className="badge">+{ch.xp} XP</span>
          <span className="badge">{ch.difficulty}</span>
          <Link className="btn" href={cat ? `/category/${cat.slug}` : '/'}>Back to Category</Link>
        </div>
      </div>

      <div className="card p-20">
        <div style={{fontWeight:900}}>Your thinking</div>
        <div className="smallMuted mt-12">Write what comes to mind. You can change your thinking later.</div>
        <textarea className="textarea mt-12" value={text} onChange={(e)=>setText(e.target.value)} placeholder="Write your thinking here…" />
        <div className="mt-16" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
          <button className="btn btnPrimary" onClick={()=>setResp(mockThinkingFeedback(text, ch.prompt))}>Get Thinking Feedback</button>
          <button className="btn" onClick={()=>{ setText(''); setResp(null); }}>Reset</button>
        </div>
      </div>

      {resp && (
        <div className="card p-20">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10, flexWrap:'wrap'}}>
            <div style={{fontWeight:900}}>Thinking Feedback</div>
            <div className="smallMuted">Mock feedback (AI will be wired in Pass 3)</div>
          </div>

          <div className="divider" />

          <Section title="Understanding" text={resp.understanding} />
          <Section title="Thinking check" text={resp.assumption} />
          <Section title="Another way to look at it" text={resp.reframe} />
          <Section title="One good question" text={resp.question} />

          <div className="mt-16" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <button className="btn" onClick={()=>setResp(mockThinkingFeedback(text, ch.prompt))}>Another angle</button>
            <button className="btn" onClick={()=>setResp({...resp, question: "What’s the strongest counterexample to your view—and what would it imply?"})}>Go deeper</button>
            <button className="btn" onClick={()=>{ window.scrollTo({top:0, behavior:'smooth'}); }}>Rewrite my thinking</button>
          </div>
        </div>
      )}

      <div className="card p-20">
        <div style={{fontWeight:900}}>Completion</div>
        <div className="smallMuted mt-12">In Pass 2, we’ll record streak, Free Pass usage, and XP.</div>
        <div className="mt-16" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
          <Link className="btn btnPrimary" href="/daily">Try today’s Daily Challenge</Link>
          <Link className="btn" href="/stats">View Stats & Titles</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }){
  return (
    <div className="mt-16">
      <div style={{fontWeight:900}}>{title}</div>
      <div className="smallMuted mt-12" style={{fontSize:13, lineHeight:1.45}}>{text}</div>
    </div>
  );
}

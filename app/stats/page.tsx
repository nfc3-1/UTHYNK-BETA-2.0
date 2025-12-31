import titles from '@/data/titles.json';
import categories from '@/data/categories.json';
import Link from 'next/link';

export default function Stats(){
  // mock values
  const xp = 120;
  const streakDays = 3;
  const sessions = 14;
  const minutes = 28;

  const currentTitle = (titles as any[]).slice().reverse().find(t => xp >= t.min_xp) || (titles as any[])[0];
  const nextTitle = (titles as any[]).find(t => t.min_xp > xp) || null;

  return (
    <div className="col">
      <div className="card p-20">
        <h1 className="heroTitle">Your Thinking Journey</h1>
        <p className="heroSub">Progress grows through clarity, curiosity, and consistency — not speed.</p>
        <div className="mt-16" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
          <Link className="btn" href="/daily">Daily Challenge</Link>
          <Link className="btn" href="/profile">Thinking Style</Link>
        </div>
      </div>

      <div className="card p-20">
        <div className="smallMuted">Current title</div>
        <div style={{fontSize:22, fontWeight:900, marginTop:6}}>🏷️ {currentTitle.name}</div>
        <div className="smallMuted mt-12">{currentTitle.desc}</div>

        <div className="progressBar" aria-label="Progress to next title">
          <div className="progressFill" />
        </div>
        <div className="smallMuted mt-12">
          {nextTitle ? `Next title: ${nextTitle.name} (in ~${Math.max(0, nextTitle.min_xp - xp)} XP)` : "Top title reached."}
        </div>
      </div>

      <div className="card p-20">
        <div style={{fontWeight:900}}>Core stats</div>
        <div className="mt-16 kpiRow">
          <div className="kpi"><span className="smallMuted">🔥 Streak</span><b>{streakDays} days</b></div>
          <div className="kpi"><span className="smallMuted">🧠 Sessions</span><b>{sessions}</b></div>
          <div className="kpi"><span className="smallMuted">🪙 XP</span><b>{xp}</b></div>
          <div className="kpi"><span className="smallMuted">⏱️ Time</span><b>~{minutes} min</b></div>
        </div>
      </div>

      <div className="card p-20">
        <div style={{fontWeight:900}}>Category practice</div>
        <div className="smallMuted mt-12">Progress reflects practice, not mastery.</div>
        <div className="mt-16" style={{display:'grid', gap:10}}>
          {(categories as any[]).map((c:any)=>(
            <div key={c.slug} className="card p-16" style={{display:'flex', justifyContent:'space-between', gap:12}}>
              <div>
                <div style={{fontWeight:900}}>{c.name}</div>
                <div className="smallMuted">7 / 31 challenges explored</div>
              </div>
              <Link className="smallMuted" href={`/category/${c.slug}`}>Open →</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

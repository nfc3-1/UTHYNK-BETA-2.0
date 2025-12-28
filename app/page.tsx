import categories from '@/data/categories.json';
import CategoryTile from '@/components/CategoryTile';
import Link from 'next/link';

export default function HomePage(){
  const foundations = (categories as any[]).filter(c=>c.foundation);
  const rest = (categories as any[]).filter(c=>!c.foundation);

  // mock values (wired later)
  const streakDays = 3;
  const wisdomPoints = 120;
  const title = 'Curious Mind';
  const freePassLeft = 3;

  return (
    <div className="col">
      <div className="row">
        <section className="col" style={{flex:'1 1 auto'}}>
          <div className="card p-20">
            <h1 className="heroTitle">Learn how to think — not what to think.</h1>
            <p className="heroSub">
              Practice reasoning, perspective, and judgment across different ways of thinking.
              Start with the <b>Foundations</b> or explore anything that sparks your curiosity.
            </p>

            <div className="mt-16" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
              <span className="badge">🔥 Streak: <b>{streakDays}</b> days</span>
              <span className="badge">🪙 Wisdom Points: <b>{wisdomPoints}</b></span>
              <span className="badge">🏷️ Title: <b>{title}</b></span>
              <span className="badge">🎟 Free Pass: <b>{freePassLeft}</b> left</span>
            </div>

            <div className="mt-16" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
              <Link className="btn btnPrimary" href="/daily">Start Thinking</Link>
              <Link className="btn" href="/stats">View Progress</Link>
              <Link className="btn" href="/profile">Thinking Style</Link>
            </div>
          </div>

          <div className="card p-20">
            <div className="mb-10" style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10, flexWrap:'wrap'}}>
              <div style={{fontWeight:900, fontSize:16}}>Foundations</div>
              <div className="smallMuted">Start here to build your thinking toolkit.</div>
            </div>
            <div className="grid">
              {foundations.map((c:any)=>(<CategoryTile key={c.slug} c={c} />))}
            </div>

            <div className="mb-10 mt-20" style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10, flexWrap:'wrap'}}>
              <div style={{fontWeight:900, fontSize:16}}>Explore</div>
              <div className="smallMuted">Different lenses, same goal: clearer thinking.</div>
            </div>
            <div className="grid">
              {rest.map((c:any)=>(<CategoryTile key={c.slug} c={c} />))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

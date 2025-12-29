import categories from '@/data/categories.json';
import CategoryTile from '@/components/CategoryTile';
import Link from 'next/link';

export default function HomePage(){
  const list = (categories as any[]);

  // mock values (Pass 2 will make these real)
  const streakDays = 3;
  const wisdomPoints = 120;
  const title = 'Curious Mind';
  const freePassLeft = 3;
  const sessions = 14;

  return (
    <div className="row">
      {/* LEFT: Progress Dashboard (matches screenshot left card) */}
      <section className="col" style={{flex:'0 0 320px'}}>
        <div className="card p-20">
          <div style={{fontWeight:900, fontSize:16}}>Progress Dashboard</div>
          <div className="smallMuted mt-12">Keep your thinking habit alive.</div>

          <div className="mt-16" style={{display:'grid', gap:10}}>
            <div className="card p-16">
              <div className="smallMuted">🔥 Streak</div>
              <div style={{fontSize:20, fontWeight:900, marginTop:6}}>{streakDays} days</div>
            </div>
            <div className="card p-16">
              <div className="smallMuted">🧠 Sessions</div>
              <div style={{fontSize:20, fontWeight:900, marginTop:6}}>{sessions}</div>
            </div>
            <div className="card p-16">
              <div className="smallMuted">🪙 Wisdom Points</div>
              <div style={{fontSize:20, fontWeight:900, marginTop:6}}>{wisdomPoints}</div>
            </div>
            <div className="card p-16">
              <div className="smallMuted">🏷️ Title</div>
              <div style={{fontSize:18, fontWeight:900, marginTop:6}}>{title}</div>
            </div>
          </div>

          <div className="mt-16">
            <div className="badge">🎟 Free Pass: <b>{freePassLeft}</b> left</div>
          </div>

          <div className="mt-16" style={{display:'grid', gap:10}}>
            <Link className="btn btnPrimary" href="/daily">Start Today’s Challenge</Link>
            <Link className="btn" href="/stats">View Progress</Link>
          </div>
        </div>
      </section>

      {/* CENTER: Start Thinking + Categories (matches screenshot center card + grid below) */}
      <section className="col" style={{flex:'1 1 auto'}}>
        <div className="card p-20">
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div style={{
              width:44, height:44, borderRadius:16,
              background:'linear-gradient(180deg, rgba(240,199,94,0.95), rgba(240,199,94,0.45))',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 14px 28px rgba(240,199,94,0.12)'
            }}>
              <span style={{fontSize:22}}>🧠</span>
            </div>
            <div>
              <div style={{fontWeight:900, fontSize:20, lineHeight:1.1}}>Start Thinking</div>
              <div className="smallMuted" style={{marginTop:4}}>Learn how to think — not what to think.</div>
            </div>
          </div>

          <div className="mt-16" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <span className="badge">🧠 Thinking Practice · ~2 min</span>
            <span className="badge">Constructive challenge</span>
          </div>

          <div className="mt-16" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <Link className="btn btnPrimary" href="/daily">Begin!</Link>
            <Link className="btn" href="/profile">Thinking Style</Link>
          </div>
        </div>

        <div className="card p-20">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10, flexWrap:'wrap'}}>
            <div style={{fontWeight:900, fontSize:16}}>Categories</div>
            <div className="smallMuted">Hover for a short synopsis.</div>
          </div>

          <div className="mt-16 grid" style={{gridTemplateColumns:'repeat(3, minmax(0, 1fr))'}}>
            {list.map((c:any)=>(<CategoryTile key={c.slug} c={c} />))}
          </div>
        </div>
      </section>
    </div>
  );
}

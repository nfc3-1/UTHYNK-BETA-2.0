import categories from '@/data/categories.json';
import CategoryTile from '@/components/CategoryTile';
import Link from 'next/link';
import RightPanel from '@/components/RightPanel';

export default function HomePage(){
  const list = (categories as any[]);

  // mock values (Pass 2 will make these real)
  const streakDays = 3;
  const wisdomPoints = 120;
  const title = 'Curious Mind';
  const freePassLeft = 3;
  const sessions = 14;

  return (
    <div className="frameStage">
      <img className="frameImg" src="/home-frame.png" alt="UThynk home frame" />

      <div className="frameOverlay">
        {/* LEFT SIDEBAR */}
        <aside className="frameSidebar">
          <div className="framePanel framePad">
            <div className="brand" style={{marginBottom: 10}}>
              <div className="brandMark" style={{width:34,height:34,borderRadius:12}}><span>🧠</span></div>
              <div style={{fontWeight:900}}>UThynk</div>
            </div>
            <div style={{display:'grid', gap:10}}>
              <Link className="sidebarLink" href="/">🏠 Home</Link>
              <Link className="sidebarLink" href="/daily">🗓️ Daily</Link>
              <Link className="sidebarLink" href="/stats">🏆 Dashboard</Link>
              <Link className="sidebarLink" href="/profile">👤 Profile</Link>
              <Link className="sidebarLink" href="/login">🚪 Log In</Link>
            </div>
          </div>
        </aside>

        {/* CENTER */}
        <section className="frameMain">
          <div className="framePanel framePad">
            <div className="frameTitleRow">
              <div>
                <div className="frameTitle">Start Thinking</div>
                <div className="frameSub">Sharpen your mind with a quick learning challenge!</div>
              </div>
              <div className="badge">🪙 {wisdomPoints}</div>
            </div>

            <div className="frameCats" style={{marginTop: 12}}>
              {list.map((c:any)=>(<CategoryTile key={c.slug} c={c} />))}
            </div>

            <div className="frameBeginRow">
              <Link className="btn btnPrimary frameBeginBtn" href="/daily">Begin!</Link>
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <aside className="frameRight">
          <div className="framePanel framePad">
            <div style={{fontWeight:900, marginBottom: 10}}>Progress Dashboard</div>
            <div className="kpiRow">
              <div className="kpi"><span className="smallMuted">🔥 Streak</span><b>{streakDays} days</b></div>
              <div className="kpi"><span className="smallMuted">🧠 Sessions</span><b>{sessions}</b></div>
              <div className="kpi"><span className="smallMuted">🏷️ Title</span><b>{title}</b></div>
            </div>
            <div className="mt-16">
              <div className="badge">🎟 Free Pass: <b>{freePassLeft}</b> left</div>
            </div>
            <div className="mt-16" style={{display:'grid', gap:10}}>
              <Link className="btn btnPrimary" href="/daily">Daily Challenge</Link>
              <Link className="btn" href="/stats">View Progress</Link>
            </div>
          </div>

          <RightPanel />
        </aside>
      </div>
    </div>
  );
}

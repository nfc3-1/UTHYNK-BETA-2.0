import Link from 'next/link';
import RightPanel from '@/components/RightPanel';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="row">
      <aside className="col" style={{flex:'0 0 260px'}}>
        <nav className="card p-18">
          <div style={{fontWeight:900, marginBottom:10}}>Navigation</div>
          <div style={{display:'grid', gap:10}}>
            <Link className="sidebarLink" href="/">🏠 Home</Link>
            <Link className="sidebarLink" href="/daily">🗓️ Daily Challenge</Link>
            <Link className="sidebarLink" href="/stats">🏆 Stats & Titles</Link>
            <Link className="sidebarLink" href="/profile">👤 Profile</Link>
          </div>
          <div className="divider" />
          <div className="smallMuted">
            This is Pass 1 wiring (mock data).
          </div>
        </nav>
      </aside>

      <main style={{flex:'1 1 auto'}}>
        {children}
      </main>

      <aside className="col" style={{flex:'0 0 280px'}}>
        <RightPanel />
      </aside>
    </div>
  );
}

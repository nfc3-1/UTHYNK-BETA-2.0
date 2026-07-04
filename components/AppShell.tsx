import Link from 'next/link';
import { ReactNode } from 'react';
import RightPanel from '@/components/RightPanel';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="ppShell">
      <header className="ppTop">
        <div className="ppTopLeft">
          <div className="ppLogo">
            <img src="/logo.png" alt="UThynk" />
          </div>
          <nav className="ppNav">
            <Link href="/">Home</Link>
            <Link href="/daily">Daily</Link>
            <Link href="/lessons">Lessons</Link>
            <Link href="/teacher">Teacher</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/feedback">Feedback</Link>
            <Link href="/store">Store</Link>
          </nav>
        </div>

        <div className="ppTopRight">
          <span title="Help">?</span>
          <div className="ppCoins"><span>XP</span><span>350</span></div>
        </div>
      </header>

      <div className="ppBody">
        <aside className="card ppSide">
          <Link href="/">Home</Link>
          <Link href="/daily">Daily</Link>
          <Link href="/lessons">Lessons</Link>
          <Link href="/teacher">Teacher</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/feedback">Feedback</Link>
          <Link href="/store">Store</Link>
          <Link href="/login?mode=login&logout=1&force=1">Log Out</Link>
        </aside>

        <main className="card ppMain">
          {children}
        </main>

        <aside className="card ppRight">
          <RightPanel />
        </aside>
      </div>
    </div>
  );
}

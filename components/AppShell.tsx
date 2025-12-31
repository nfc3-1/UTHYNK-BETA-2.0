import Link from 'next/link';
import { ReactNode } from 'react';
import RightPanel from '@/components/RightPanel';

export default function AppShell({ children }:{ children: ReactNode }){
  return (
    <div className="ppShell">
      <header className="ppTop">
        <div className="ppTopLeft">
          <div className="ppLogo">
            <img src="/logo.png" alt="UThynk" />
          </div>
          <nav className="ppNav">
            <Link href="/"><span>🏠</span>Home</Link>
            <Link href="/stats"><span>📊</span>Dashboard</Link>
            <Link href="/store"><span>🛍️</span>Store</Link>
            <Link href="/profile"><span>👤</span>Profile</Link>
          </nav>
        </div>

        <div className="ppTopRight">
          <span title="Help">❔</span>
          <div className="ppCoins"><span>🪙</span><span>350</span></div>
        </div>
      </header>

      <div className="ppBody">
        <aside className="card ppSide">
          <Link href="/"><span>🏠</span>Home</Link>
          <Link href="/stats"><span>📊</span>Dashboard</Link>
          <Link href="/store"><span>🛍️</span>Store</Link>
          <Link href="/profile"><span>👤</span>Profile</Link>
          <Link href="/login"><span>🚪</span>Log Out</Link>
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

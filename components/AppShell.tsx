import Link from 'next/link';
import { ReactNode } from 'react';
import LocalizedNavLinks, { primaryNavItems } from '@/components/LocalizedNavLinks';
import RightPanel from '@/components/RightPanel';

const sideNavItems = [
  ...primaryNavItems,
  { href: '/login?mode=login&logout=1&force=1', key: 'logoutNav' as const },
];

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="ppShell">
      <header className="ppTop">
        <div className="ppTopLeft">
          <div className="ppLogo">
            <img src="/logo.png" alt="UThynk" />
          </div>
          <LocalizedNavLinks className="ppNav" />
        </div>

        <div className="ppTopRight">
          <span title="Help">?</span>
          <div className="ppCoins"><span>XP</span><span>350</span></div>
        </div>
      </header>

      <div className="ppBody">
        <aside className="card ppSide">
          <LocalizedNavLinks className="" items={sideNavItems} />
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

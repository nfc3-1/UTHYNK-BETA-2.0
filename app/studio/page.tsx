import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import StudioDashboard from '@/components/StudioDashboard';
import { getStudioAccess } from '@/lib/studioAuth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'UThynk Studio',
  description: "Nick's private UThynk operating system.",
  robots: {
    follow: false,
    index: false,
    nocache: true,
  },
};

export default async function StudioPage() {
  const access = await getStudioAccess();

  if (access.allowed === false && access.reason === 'unauthenticated') {
    redirect('/login?next=/studio');
  }

  if (access.allowed === false) {
    return (
      <main className="studioPage">
        <section className="studioUnauthorized">
          <div className="studioMark">U</div>
          <p>Private backend</p>
          <h1>Unauthorized access</h1>
          <span>
            UThynk Studio is Nick's private operating system. This area is not part of
            the public UThynk experience.
          </span>
        </section>
      </main>
    );
  }

  return (
    <main className="studioPage">
      <header className="studioHero">
        <div>
          <p>Private backend / Nick only</p>
          <h1>UThynk Studio</h1>
          <span>
            Campaign planning, brand video direction, content generation, saved assets,
            analytics, and weekly approvals for the UThynk operating system.
          </span>
        </div>
        <aside>
          <strong>No public access</strong>
          <span>No public links. No indexing. Admin role required.</span>
        </aside>
      </header>

      <StudioDashboard />
    </main>
  );
}

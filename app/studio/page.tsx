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
          <p>Private Studio / Weekly operating system</p>
          <h1>This Week at UThynk</h1>
          <span>
            Build next week's campaign, review the strongest posts, schedule the week,
            and learn what should be repeated next.
          </span>
        </div>
        <aside>
          <strong>Nick only</strong>
          <span>Private admin route. No public links or indexing.</span>
        </aside>
      </header>

      <StudioDashboard />
    </main>
  );
}


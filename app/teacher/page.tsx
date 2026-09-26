import { redirect } from 'next/navigation';
import { getAccountAccess, permits } from '@/lib/accessControl';
import Link from 'next/link';
import TeacherDashboard from '@/components/TeacherDashboard';
import LocalizedNavLinks from '@/components/LocalizedNavLinks';
import { getCategories, getQuestionsForCategory } from '@/lib/questionBank';

export const dynamic = 'force-dynamic';
export default async function TeacherPage() {
  const access = await getAccountAccess();
  if (!permits(access, 'teacher')) redirect(access.userId ? '/profile' : '/login?next=/teacher');
  const questionBank = Object.fromEntries(
    getCategories().map((category) => [category, getQuestionsForCategory(category)])
  );

  return (
    <main className="appShell teacherPage">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          <img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo" />
          <span className="brandCopy">
            <strong>UThynk</strong>
            <small>Better thinking. <em>Better decisions.</em></small>
          </span>
        </Link>

        <LocalizedNavLinks />
      </header>

      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">Teacher Backend V1 &mdash; built for pilot classrooms.</div>
          <h1>Teacher Dashboard</h1>
          <p>Assign reasoning challenges, track completion, and support student thinking growth.</p>
        </div>
      </section>

      <TeacherDashboard questionBank={questionBank} />
    </main>
  );
}

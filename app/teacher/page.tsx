import { redirect } from 'next/navigation';
import { getAccountAccess, permits } from '@/lib/accessControl';
import Link from 'next/link';
import TeacherDashboard from '@/components/TeacherDashboard';
import LocalizedNavLinks from '@/components/LocalizedNavLinks';
import { classroomCatalog } from '@/lib/classroom';
import { schoolCapabilities } from '@/lib/schoolAccess';

export const dynamic = 'force-dynamic';
export default async function TeacherPage() {
  const access = await getAccountAccess();
  if (!permits(access, 'teacher') && !(await schoolCapabilities(access)).schoolTeacher) redirect(access.userId ? '/profile' : '/login?next=/teacher');


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
          <div className="eyebrow">Your saved classroom records</div>
          <h1>Teacher Dashboard</h1>
          <p>Create classes, assign lessons and readings, and review actual learner responses.</p>
        </div>
      </section>

      <TeacherDashboard catalog={classroomCatalog().filter(item=>item.kind!=='reading'||permits(access,'thinking_paths'))} />
    </main>
  );
}

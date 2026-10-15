import BrandHome from '@/components/BrandHome';
import { redirect } from "next/navigation";
import LocalizedNavLinks from "@/components/LocalizedNavLinks";
import ClassroomDashboard from "@/components/ClassroomDashboard";
import { getAccountAccess } from "@/lib/accessControl";
export const dynamic = "force-dynamic";
export default async function LeaderboardPage() {
  const access = await getAccountAccess();
  if (!access.userId) redirect("/login?next=/leaderboard");
  return (
    <main className="appShell teacherPage">
      <header className="appTop card">
        <BrandHome />
        <LocalizedNavLinks />
      </header>
      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <h1>Class participation leaderboard</h1>
          <p>
            Actual completed classroom assignments. Only your classes are
            visible.
          </p>
        </div>
      </section>
      <ClassroomDashboard boardOnly />
    </main>
  );
}

import { redirect } from "next/navigation";
import LocalizedNavLinks from "@/components/LocalizedNavLinks";
import ClassroomDashboard from "@/components/ClassroomDashboard";
import { getAccountAccess } from "@/lib/accessControl";
export const dynamic = "force-dynamic";
export default async function ClassroomPage() {
  const access = await getAccountAccess();
  if (!access.userId) redirect("/login?next=/classroom");
  return (
    <main className="appShell teacherPage">
      <header className="appTop card">
        <strong>UThynk</strong>
        <LocalizedNavLinks />
      </header>
      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <h1>Your classroom</h1>
          <p>
            Join your teacher’s class, open assignments, and review saved
            responses and comments.
          </p>
        </div>
      </section>
      <ClassroomDashboard />
    </main>
  );
}

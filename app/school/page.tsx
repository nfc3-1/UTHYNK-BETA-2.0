import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccountAccess } from "@/lib/accessControl";
import { schoolCapabilities } from "@/lib/schoolAccess";
import LocalizedNavLinks from "@/components/LocalizedNavLinks";
import SchoolDashboard from "@/components/SchoolDashboard";
export const dynamic = "force-dynamic";
export default async function SchoolPage() {
  const access = await getAccountAccess();
  if (!access.userId) redirect("/login?next=/school");
  if (!(await schoolCapabilities(access)).schoolAdmin) redirect("/profile");
  return (
    <main className="appShell teacherPage">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          <img
            src="/brand/uthynk-wing-mark.svg"
            alt=""
            className="appBrandLogo"
          />
          <span className="brandCopy">
            <strong>UThynk</strong>
            <small>
              Better thinking. <em>Better decisions.</em>
            </small>
          </span>
        </Link>
        <LocalizedNavLinks />
      </header>
      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">Your authorized schools</div>
          <h1>School & district dashboard</h1>
          <p>
            Manage your schools and staff. Review actual class participation
            within your assigned scope.
          </p>
        </div>
      </section>
      <SchoolDashboard />
    </main>
  );
}

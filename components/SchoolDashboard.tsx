"use client";
import { useEffect, useState } from "react";
import { SchoolParticipationReport, DistrictParticipationReport } from "@/components/SchoolReports";
type District = { id: string; name: string; canManage: boolean };
type School = { id: string; name: string; district_id: string | null };
type Staff = {
  profile_id: string;
  name: string;
  role: string;
  active: boolean;
};
type SchoolClass = {
  id: string;
  title: string;
  teacher: string;
  learners: number;
  assignments: number;
  completed: number;
};
type Snapshot = {
  platformAdmin: boolean;
  districts: District[];
  districtAdmins: (Staff & { district_id: string })[];
  schools: School[];
  selected: string | null;
  staff: Staff[];
  classes: SchoolClass[];
};
export default function SchoolDashboard() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const [districtId, setDistrictId] = useState(""),
    [districtName, setDistrictName] = useState(""),
    [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState(""),
    [role, setRole] = useState("teacher"),
    [districtEmail, setDistrictEmail] = useState(""),
    [classId, setClassId] = useState("");
  async function load(schoolId = "") {
    const r = await fetch(
      "/api/schools" +
        (schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""),
      { cache: "no-store" },
    );
    const value = await r.json();
    if (!r.ok) throw new Error(value.error);
    setData(value);
  }
  useEffect(() => {
    let active = true;
    fetch("/api/schools", { cache: "no-store" })
      .then(async (r) => {
        const value = await r.json();
        if (!r.ok) throw new Error(value.error);
        if (active) setData(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function mutate(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const r = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const value = await r.json();
      if (!r.ok) throw new Error(value.error);
      await load(value.schoolId || data?.selected || "");
      setStatus("Saved.");
      setEmail("");
      setDistrictEmail("");
      setDistrictName("");
      setSchoolName("");
      setClassId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  const school = data?.schools.find((s) => s.id === data.selected);
  const managesDistrict = Boolean(
    data?.platformAdmin ||
      data?.districts.find((d) => d.id === school?.district_id)?.canManage,
  );
  const allowedDistricts = data?.districts.filter((d) => d.canManage) || [];
  return (
    <section className="teacherShell">
      {error && <p role="alert">{error}</p>}
      {status && <p role="status">{status}</p>}
      {!data && !error && <p role="status">Loading your schools…</p>}
      {data && (
        <>
          <section className="card teacherPanel" style={{ marginTop: 18 }}>
            <h2>
              {data.platformAdmin ? "Platform overview" : "Your school access"}
            </h2>
            <p>
              {data.platformAdmin
                ? "Your platform-owner role can manage all schools. School and district roles remain limited to their assigned organizations."
                : "Only schools covered by your active administrator assignment appear here."}
            </p>
            <label className="teacherField">
              School
              <select
                value={data.selected || ""}
                disabled={busy}
                onChange={async (e) => {
                  setError(""); setEmail(""); setRole("teacher"); setClassId("");
                  setData(null);
                  try {
                    await load(e.target.value);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <option value="" disabled>
                  Select a school
                </option>
                {data.schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.district_id
                      ? ` — ${data.districts.find((d) => d.id === s.district_id)?.name || ""}`
                      : " — Independent school"}
                  </option>
                ))}
              </select>
            </label>
            {!data.schools.length && (
              <p>
                No schools are assigned yet. A platform or district
                administrator must set up the school and its staff.
              </p>
            )}
          </section>
          {(data.platformAdmin || allowedDistricts.length > 0) && data.districts.length > 0 && <DistrictParticipationReport key={data.districts.filter(d => data.platformAdmin || d.canManage).map(d => d.id).join(':')} districts={data.districts.filter(d => data.platformAdmin || d.canManage)} />}
          {(data.platformAdmin || allowedDistricts.length > 0) && (
            <details className="card teacherPanel" style={{ marginTop: 18 }}>
            <summary>Organization setup</summary>
            <section className="teacherTwoColumn">
              {data.platformAdmin && (
                <form
                  className="card teacherPanel"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void mutate({
                      action: "create_district",
                      name: districtName,
                    });
                  }}
                >
                  <h2>Create a district</h2>
                  <label className="teacherField">
                    District name
                    <input
                      maxLength={120}
                      value={districtName}
                      onChange={(e) => setDistrictName(e.target.value)}
                    />
                  </label>
                  <button
                    className="btn"
                    disabled={busy || !districtName.trim()}
                  >
                    Create District
                  </button>
                </form>
              )}
              <form
                className="card teacherPanel"
                onSubmit={(e) => {
                  e.preventDefault();
                  void mutate({
                    action: "create_school",
                    districtId: districtId || null,
                    name: schoolName,
                  });
                }}
              >
                <h2>Create a school</h2>
                <label className="teacherField">
                  District
                  <select
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                  >
                    <option value="">
                      {data.platformAdmin
                        ? "Independent school"
                        : "Choose your district"}
                    </option>
                    {allowedDistricts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="teacherField">
                  School name
                  <input
                    maxLength={120}
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                </label>
                <button
                  className="btn"
                  disabled={
                    busy ||
                    !schoolName.trim() ||
                    (!data.platformAdmin && !districtId)
                  }
                >
                  Create School
                </button>
              </form>
            </section>
            </details>
          )}
          {school && (
            <section className="card teacherPanel" style={{ marginTop: 18 }}>
              <h2>{school.name}</h2>
              <SchoolParticipationReport school={school} classes={data.classes} />
              <p className="teacherMuted">Individual answers, comments, and enrollment codes remain in the teacher’s classroom.</p>
              {!data.classes.length ? (
                <p>No classes have been assigned to this school.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Teacher</th>
                      <th>Learners</th>
                      <th>Assignments</th>
                      <th>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.classes.map((c) => (
                      <tr key={c.id}>
                        <th>{c.title}</th>
                        <td>{c.teacher}</td>
                        <td>{c.learners}</td>
                        <td>{c.assignments}</td>
                        <td>{c.completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <details><summary>School staff and access</summary>
              <h3>School staff</h3>
              {!data.staff.length && <p>No staff have been added.</p>}
              {data.staff.map((s) => (
                <p key={s.profile_id}>
                  {s.name} ·{" "}
                  {s.role === "school_admin"
                    ? "School administrator"
                    : "Teacher"}{" "}
                  · {s.active ? "Active" : "Removed"}{" "}
                  <button
                    className="btn"
                    disabled={
                      busy || (s.role === "school_admin" && !managesDistrict)
                    }
                    onClick={() =>
                      void mutate({
                        action: "school_staff",
                        schoolId: school.id,
                        profileId: s.profile_id,
                        role: s.role,
                        active: !s.active,
                      })
                    }
                  >
                    {s.active ? "Remove access" : "Restore access"}
                  </button>
                </p>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void mutate({
                    action: "school_staff",
                    schoolId: school.id,
                    email,
                    role,
                  });
                }}
              >
                <h3>Add or update a registered staff member</h3>
                <label className="teacherField">
                  Staff email
                  <input
                    type="email"
                    autoComplete="off"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="teacherField">
                  School role
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="teacher">Teacher</option>
                    {managesDistrict && (
                      <option value="school_admin">School administrator</option>
                    )}
                  </select>
                </label>
                <p>
                  A teacher can manage their own classes in this school. A
                  school administrator can see this school’s class totals and
                  manage its teachers.
                </p>
                <button className="btn" disabled={busy || !email.trim()}>
                  Save School Access
                </button>
              </form>
              {data.platformAdmin && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void mutate({
                      action: "place_class",
                      schoolId: school.id,
                      classId,
                    });
                  }}
                >
                  <h3>Place an existing independent class</h3>
                  <p>
                    Add the teacher to this school first. Placing a class makes
                    its participation totals visible to this school’s
                    administrators. Existing school classes cannot be
                    transferred here.
                  </p>
                  <label className="teacherField">
                    Class ID
                    <input
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      required
                    />
                  </label>
                  <button className="btn" disabled={busy || !classId.trim()}>
                    Place Class in {school.name}
                  </button>
                </form>
              )}
              </details>
            </section>
          )}
          {data.platformAdmin && (
            <form
              className="card teacherPanel"
              style={{ marginTop: 18 }}
              onSubmit={(e) => {
                e.preventDefault();
                void mutate({
                  action: "district_admin",
                  districtId,
                  email: districtEmail,
                });
              }}
            >
              <h2>District administrator access</h2>
              <p>
                District administrators can manage schools and school staff only
                within the district you select. This does not grant platform
                administration.
              </p>
              <label className="teacherField">
                District
                <select
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                >
                  <option value="">Choose a district</option>
                  {data.districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="teacherField">
                Administrator email
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={districtEmail}
                  onChange={(e) => setDistrictEmail(e.target.value)}
                />
              </label>
              <button
                className="btn"
                disabled={busy || !districtId || !districtEmail.trim()}
              >
                Save District Access
              </button>
              {data.districtAdmins.map((a) => (
                <p key={`${a.district_id}:${a.profile_id}`}>
                  {a.name} ·{" "}
                  {data.districts.find((d) => d.id === a.district_id)?.name} ·{" "}
                  {a.active ? "Active" : "Removed"}{" "}
                  <button
                    className="btn"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void mutate({
                        action: "district_admin",
                        districtId: a.district_id,
                        profileId: a.profile_id,
                        active: !a.active,
                      })
                    }
                  >
                    {a.active ? "Remove access" : "Restore access"}
                  </button>
                </p>
              ))}
            </form>
          )}
        </>
      )}
    </section>
  );
}

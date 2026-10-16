"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ClassroomProgress } from '@/components/SchoolReports';
import AssessmentBreakdown from "@/components/AssessmentBreakdown";
type Target = { id: string; kind: string; title: string; category: string };
export default function ClassroomDashboard({
  teacher = false,
  boardOnly = false,
  catalog = [],
}: {
  teacher?: boolean;
  boardOnly?: boolean;
  catalog?: Target[];
}) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [classId, setClassId] = useState("");
  const [title, setTitle] = useState(""),
    [code, setCode] = useState(""),
    [name, setName] = useState(""),
    [target, setTarget] = useState(""),
    [due, setDue] = useState("");
  const [review, setReview] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const commentKey = `${classId}:${review}`;
  const comment = commentDrafts[commentKey] || "";
  const setComment = (value: string) => setCommentDrafts(drafts => ({ ...drafts, [commentKey]: value }));
  const [schoolId, setSchoolId] = useState('');
  const view = teacher ? "teaching" : boardOnly ? "all" : "learning";
  async function load(selected = "") {
    const r = await fetch(
      `/api/classroom?view=${view}` + (selected ? `&classId=${encodeURIComponent(selected)}` : ""),
      { cache: "no-store" },
    );
    const value = await r.json();
    if (!r.ok) throw new Error(value.error);
    setData(value);
    setClassId(value.selected || "");
  }
  useEffect(() => {
    let active = true;
    fetch(`/api/classroom?view=${view}`, { cache: "no-store" })
      .then(async (r) => {
        const value = await r.json();
        if (!r.ok) throw new Error(value.error);
        if (active) {
          setData(value);
          setClassId(value.selected || "");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [view]);
  async function mutate(body: any) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, classId }),
      });
      const value = await r.json();
      if (!r.ok) throw new Error(value.error);
      await load(value.classId || classId);
      if (body.action === "comment") setComment("");
      setTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  const active = data?.classes.find((c: any) => c.id === classId);
  const selected = data?.submissions.find(
    (s: any) => `${s.assignment_id}:${s.learner_id}` === review,
  );
  const memberName = (id: string) =>
    data?.members.find((m: any) => m.profile_id === id)?.display_name ||
    (data?.manage ? "Former class member" : "Your response");
  return (
    <section className="teacherShell">
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Loading saved classroom records…</p>}
      {!boardOnly && (
        <details className="card teacherPanel" open={data && !data.classes.length ? true : undefined}>
          <summary>{teacher ? 'Set up a class' : 'Join a class'}</summary>
        <div className="teacherTwoColumn">
          {teacher && (
            <section className="card teacherPanel">
              <h2>Create a class</h2>
              <label className="teacherField">
                Class name
                <input
                  value={title}
                  maxLength={100}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="teacherField">
                School
                <select value={schoolId} onChange={e => setSchoolId(e.target.value)}>
                  <option value="">{data?.canCreateIndependent ? 'Independent class (not assigned to a school)' : 'Choose your school'}</option>
                  {(data?.teachingSchools || []).map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <button
                className="btn btnPrimary"
                disabled={busy || !title.trim() || !data || (!schoolId && data.canCreateIndependent === false)}
                onClick={() => mutate({ action: "create_class", title, schoolId: schoolId || null })}
              >
                Create Class
              </button>
            </section>
          )}
          {!teacher && <section className="card teacherPanel">
            <h2>Join a class</h2>
            <p>
              Use the code supplied by your teacher. Your display name is
              visible within this class.
            </p>
            <label className="teacherField">
              Class code
              <input
                value={code}
                maxLength={12}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <label className="teacherField">
              Display name
              <input
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              className="btn"
              disabled={busy || !code.trim() || !name.trim()}
              onClick={() => mutate({ action: "join", code, name })}
            >
              Join Class
            </button>
          </section>}
        </div>
        </details>
      )}
      {data && (
        <section className="card teacherPanel" style={{ marginTop: 18 }}>
          <label className="teacherField">
            Your classes
            <select
              value={classId}
              disabled={busy}
              onChange={async (e) => {
                setError(""); setBusy(true); setReview("");
                try {
                  await load(e.target.value);
                  setReview("");
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Class could not be loaded.",
                  );
                } finally { setBusy(false); }
              }}
            >
              <option value="" disabled>
                Select a class
              </option>
              {data.classes.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          {!data.classes.length && (
            <p>
              No classes yet.{" "}
              {boardOnly
                ? "Join a class to view its participation board."
                : teacher ? "Create a class to begin assigning work." : "Enter your teacher’s code to join a class."}
            </p>
          )}
          {active && (
            <>
              <h2>{active.title}</h2>
              <button className="btn" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await load(classId); } catch (e) { setError(e instanceof Error ? e.message : "Refresh failed."); } finally { setBusy(false); } }}>Refresh records</button>
              {!boardOnly && <ClassroomProgress key={classId} data={data} classId={classId} />}
              {data.manage && active.join_code && !boardOnly && (
                <p>
                  Class ID: <code>{active.id}</code><br />
                  Enrollment code: <strong>{active.join_code}</strong> ·{" "}
                  <Link href="/classroom">Learner classroom</Link>
                </p>
              )}
              {!boardOnly && data.manage && (
                <section className="teacherSubPanel">
                  <h3>Assign an existing lesson or reading</h3>
                  <label className="teacherField">
                    Lesson or reading
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    >
                      <option value="">Choose a lesson or reading</option>
                      {catalog.map((t) => (
                        <option
                          key={`${t.kind}:${t.id}`}
                          value={`${t.kind}:${t.id}`}
                        >
                          {t.category} — {t.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="teacherField">
                    Due date (optional)
                    <input
                      type="date"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </label>
                  <button
                    className="btn btnPrimary"
                    disabled={busy || !target}
                    onClick={() => {
                      const [kind, ...id] = target.split(":");
                      void mutate({
                        action: "assign",
                        kind,
                        targetId: id.join(":"),
                        dueDate: due,
                      });
                    }}
                  >
                    Assign Lesson
                  </button>
                </section>
              )}
              {!boardOnly && (
                <section className="teacherSubPanel">
                  <h3>Assignments</h3>
                  {!data.assignments.length && (
                    <p>No assignments have been saved for this class.</p>
                  )}
                  {data.assignments.map((a: any) => {
                    const submission = data.submissions.find(
                      (s: any) => s.assignment_id === a.id,
                    );
                    return (
                      <article key={a.id} className="focusCard">
                        <strong>{a.title}</strong>
                        <span>
                          {a.due_date ? `Due ${a.due_date}` : "No due date"} ·{" "}
                          {data.manage
                            ? `${data.submissions.filter((s: any) => s.assignment_id === a.id && s.completed_at && data.members.some((m: any) => m.profile_id === s.learner_id && m.active)).length} / ${data.members.filter((m: any) => m.active).length} learners completed`
                            : submission?.completed_at
                              ? "Completed"
                              : submission
                                ? "In progress"
                                : "Not started"}
                        </span>
                        <Link
                          className="btn"
                          href={`/classroom/assignments/${a.id}`}
                        >
                          Open Assignment
                        </Link>
                      </article>
                    );
                  })}
                </section>
              )}
              {!boardOnly && data.manage && (
                <section className="teacherSubPanel">
                  <h3>Enrolled learners</h3>
                  {!data.members.length && (
                    <p>
                      No learners have joined yet. Share your enrollment code.
                    </p>
                  )}
                  {data.members.map((m: any) => (
                    <p key={m.profile_id}>
                      {m.display_name}{" "}
                      <button
                        className="btn"
                        disabled={busy}
                        onClick={() =>
                          mutate({
                            action: m.active
                              ? "remove_member"
                              : "restore_member",
                            learnerId: m.profile_id,
                          })
                        }
                      >
                        {m.active ? "Remove from class" : "Restore access"}
                      </button>
                    </p>
                  ))}
                </section>
              )}
              {!boardOnly && (
                <section className="teacherSubPanel">
                  <h3>
                    {data.manage
                      ? "Learner submissions"
                      : "Your saved submissions"}
                  </h3>
                  {!data.submissions.length && (
                    <p>No answers have been submitted yet.</p>
                  )}
                  {data.submissions.map((s: any) => (
                    <button
                      className="btn"
                      key={`${s.assignment_id}:${s.learner_id}`}
                      onClick={() =>
                        setReview(`${s.assignment_id}:${s.learner_id}`)
                      }
                    >
                      {memberName(s.learner_id)} ·{" "}
                      {
                        data.assignments.find(
                          (a: any) => a.id === s.assignment_id,
                        )?.title
                      }{" "}
                      · {s.completed_at ? "Completed" : "In progress"}
                    </button>
                  ))}
                  {selected && (
                    <article className="teacherSubPanel">
                      <h4>{memberName(selected.learner_id)}</h4>
                      <strong>First answer</strong>
                      <p style={{ whiteSpace: "pre-wrap" }}>
                        {selected.first_answer}
                      </p>
                      <strong>Perspective expansion</strong>
                      <p>{selected.perspective}</p>
                      <strong>Secondary question</strong>
                      <p>{selected.secondary_question}</p>
                      <strong>Second answer</strong>
                      <p style={{ whiteSpace: "pre-wrap" }}>
                        {selected.second_answer || "Not submitted yet"}
                      </p>
                      <strong>Final synthesis</strong>
                      <p>{selected.synthesis || "Not completed yet"}</p>
                      <AssessmentBreakdown
                        assessment={selected.assessment}
                        language="en"
                      />
                      {data.comments
                        .filter(
                          (c: any) =>
                            c.assignment_id === selected.assignment_id &&
                            c.learner_id === selected.learner_id,
                        )
                        .map((c: any) => (
                          <p key={c.id}>
                            <strong>Teacher comment:</strong> {c.body}
                          </p>
                        ))}
                      {data.manage && (
                        <>
                          <label className="teacherField">
                            Teacher comment
                            <textarea
                              value={comment}
                              maxLength={4000}
                              onChange={(e) => setComment(e.target.value)}
                            />
                          </label>
                          <button
                            className="btn"
                            disabled={busy || !comment.trim()}
                            onClick={() =>
                              mutate({
                                action: "comment",
                                assignmentId: selected.assignment_id,
                                learnerId: selected.learner_id,
                                comment,
                              })
                            }
                          >
                            Save Comment
                          </button>
                        </>
                      )}
                    </article>
                  )}
                </section>
              )}
              <section className="teacherSubPanel">
                <h3>Class participation leaderboard</h3>
                <p>
                  Completed assignments only. This is participation, not a
                  ranking of intelligence or reasoning ability.
                </p>
                {!data.leaderboard.length && <p>No enrolled learners yet.</p>}
                <ol>
                  {data.leaderboard.map((p: any, i: number) => (
                    <li key={`${p.name}:${i}`}>
                      {p.name} — {p.completed} completed{" "}
                      {p.completed === 1 ? "assignment" : "assignments"}
                    </li>
                  ))}
                </ol>
                <Link href="/classroom">Open your classroom</Link>
              </section>
            </>
          )}
        </section>
      )}
    </section>
  );
}

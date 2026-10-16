'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getStoredLanguageValue, UTHYNK_LANGUAGE_EVENT, type Language } from '@/lib/reasoningI18n';
import { schoolReportCopy } from '@/lib/schoolReportCopy';
import { participation, progressRows, nextAssignment, schoolRows, schoolTotals, type AssignmentRecord, type MemberRecord, type SubmissionRecord, type SchoolClassRecord } from '@/lib/schoolReports';
import styles from './SchoolWorkspaces.module.css';

function useReportLanguage() {
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => { try { setLanguage(getStoredLanguageValue()); } catch { setLanguage('en'); } };
    sync(); window.addEventListener('storage', sync); window.addEventListener(UTHYNK_LANGUAGE_EVENT, sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(UTHYNK_LANGUAGE_EVENT, sync); };
  }, []);
  return language;
}
function Metrics({ items }: { items: [string, string | number][] }) {
  return <dl className={styles.metrics}>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function ClassroomProgress({ data, classId }: { classId: string; data: { manage: boolean; viewerId: string; members: MemberRecord[]; assignments: AssignmentRecord[]; submissions: SubmissionRecord[] } }) {
  const language = useReportLanguage(), c = schoolReportCopy[language];
  const [assignmentId, setAssignmentId] = useState('');
  const assignments = useMemo(() => assignmentId ? data.assignments.filter(a => a.id === assignmentId) : data.assignments, [assignmentId, data.assignments]);
  const rows = useMemo(() => progressRows(assignments, data.manage ? data.members : [{ profile_id: data.viewerId, display_name: '', active: true }], data.submissions), [assignments, data.manage, data.members, data.submissions, data.viewerId]);
  const counts = participation(rows);
  const roster = [...new Map(data.members.filter(m => m.active).map(m => [m.profile_id, m])).values()];
  const rowsByLearner = new Map<string, typeof rows>();
  rows.forEach(row => { const group = rowsByLearner.get(row.learnerId) || []; group.push(row); rowsByLearner.set(row.learnerId, group); });
  const next = !data.manage ? nextAssignment(rows) : undefined;
  const query = new URLSearchParams({ classId, view: data.manage ? 'teaching' : 'learning', language });
  if (assignmentId) query.set('assignmentId', assignmentId);
  return <section className={styles.report} aria-label={data.manage ? c.classProgress : c.myProgress}>
    <h3>{data.manage ? c.classProgress : c.myProgress}</h3>
    <p className="teacherMuted">{c.participationNote}</p>
    {data.manage && <label className="teacherField">{c.filter}<select value={assignmentId} onChange={e => setAssignmentId(e.target.value)}><option value="">{c.allAssignments}</option>{data.assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>}
    <Metrics items={[
      ...(data.manage ? [[c.activeLearners, roster.length] as [string, number]] : []),
      [data.manage ? c.opportunities : c.total, counts.total], [c.completed, counts.completed], [c.inProgress, counts.inProgress], [c.notStarted, counts.notStarted],
    ]} />
    {!data.assignments.length ? <p>{c.noAssignments}</p> : data.manage && !roster.length ? <p>{c.noLearners}</p> : <>
      {!data.manage && <div className={styles.next}>{next ? <><h4>{c.next}</h4><p>{next.assignment}</p><Link className="btn" href={`/classroom/assignments/${next.assignmentId}`}>{next.status === 'inProgress' ? c.resume : c.start}</Link></> : <p>{c.caughtUp}</p>}</div>}
      {data.manage && <div className={styles.tableWrap}><table><caption>{c.scope}</caption><thead><tr><th scope="col">{c.learner}</th><th scope="col">{c.completed}</th><th scope="col">{c.inProgress}</th><th scope="col">{c.notStarted}</th></tr></thead><tbody>{roster.map(member => {
        const progress = participation(rowsByLearner.get(member.profile_id) || []);
        return <tr key={member.profile_id}><th scope="row">{member.display_name}</th><td>{progress.completed}</td><td>{progress.inProgress}</td><td>{progress.notStarted}</td></tr>;
      })}</tbody></table></div>}
      <a className="btn" href={`/api/classroom/report?${query}`} download>{c.download}</a>
    </>}
    {!data.manage && <p className="teacherMuted">{c.personalNote}</p>}
  </section>;
}

export function SchoolParticipationReport({ school, classes }: { school: { id: string; name: string }; classes: SchoolClassRecord[] }) {
  const language = useReportLanguage(), c = schoolReportCopy[language];
  const totals = schoolTotals(schoolRows(school, classes));
  const query = new URLSearchParams({ schoolId: school.id, format: 'csv', language });
  return <section className={styles.report} aria-label={c.schoolProgress}><h3>{c.schoolProgress}</h3>
    <Metrics items={[[c.enrollments, totals.enrollments], [c.assignments, totals.assignments], [c.opportunities, totals.opportunities], [c.completed, totals.completed], [c.rate, totals.completionRate === null ? '—' : `${totals.completionRate.toFixed(1)}%`]]} />
    <p className="teacherMuted">{c.rosterNote} {c.participationNote} {c.dateNote}</p>
    <a className="btn" href={`/api/schools/report?${query}`} download>{c.download}</a>
  </section>;
}

type DistrictReport = { label: string; totals: ReturnType<typeof schoolTotals>; schools: ({ id: string; name: string } & ReturnType<typeof schoolTotals>)[] };
export function DistrictParticipationReport({ districts }: { districts: { id: string; name: string }[] }) {
  const language = useReportLanguage(), c = schoolReportCopy[language];
  const [districtId, setDistrictId] = useState(districts[0]?.id || '');
  const [report, setReport] = useState<DistrictReport | null>(null), [error, setError] = useState(false), [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!districtId) return;
    const controller = new AbortController();
    setReport(null); setError(false);
    fetch(`/api/schools/report?districtId=${encodeURIComponent(districtId)}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('Report unavailable'); return response.json(); })
      .then(value => { if (!controller.signal.aborted) setReport(value); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [districtId, revision]);
  const query = new URLSearchParams({ districtId, format: 'csv', language });
  return <section className={`card teacherPanel ${styles.report}`} aria-label={c.districtProgress}>
    <h2>{c.districtProgress}</h2><label className="teacherField">{c.chooseDistrict}<select value={districtId} onChange={e => setDistrictId(e.target.value)}>{districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    <button className="btn" onClick={() => setRevision(v => v + 1)}>{c.refresh}</button>
    {error ? <p role="alert">{c.failed}</p> : !report ? <p role="status">{c.loading}</p> : <>
      <h3>{report.label}</h3><Metrics items={[[c.enrollments, report.totals.enrollments], [c.opportunities, report.totals.opportunities], [c.completed, report.totals.completed], [c.rate, report.totals.completionRate === null ? '—' : `${report.totals.completionRate.toFixed(1)}%`]]} />
      <div className={styles.tableWrap}><table><caption>{c.districtProgress}</caption><thead><tr><th scope="col">{c.school}</th><th scope="col">{c.enrollments}</th><th scope="col">{c.opportunities}</th><th scope="col">{c.completed}</th></tr></thead><tbody>{report.schools.map(s => <tr key={s.id}><th scope="row">{s.name}</th><td>{s.enrollments}</td><td>{s.opportunities}</td><td>{s.completed}</td></tr>)}</tbody></table></div>
      {!report.totals.classes && <p>{c.noClasses}</p>}<p className="teacherMuted">{c.rosterNote} {c.participationNote}</p><a className="btn" href={`/api/schools/report?${query}`} download>{c.download}</a>
    </>}
  </section>;
}

import type { Language } from './reasoningI18n';
import { schoolReportCopy } from './schoolReportCopy';

export type AssignmentRecord = { id: string; title: string; due_date?: string | null };
export type SubmissionRecord = { assignment_id: string; learner_id: string; first_answer?: string; completed_at?: string | null };
export type MemberRecord = { profile_id: string; display_name: string; active: boolean };
export type WorkStatus = 'completed' | 'inProgress' | 'notStarted';
export type ProgressRow = { learnerId: string; learner: string; assignmentId: string; assignment: string; dueDate: string; status: WorkStatus; completedAt: string };
export type Participation = { total: number; completed: number; inProgress: number; notStarted: number; completionRate: number | null };
export type SchoolClassRecord = { id: string; title: string; teacher: string; learners: number; assignments: number; completed: number };
export type SchoolReportRow = { schoolId: string; school: string; classId: string; classroom: string; teacher: string; enrollments: number; assignments: number; opportunities: number; completed: number };

export function workStatus(submission?: SubmissionRecord): WorkStatus {
  if (submission?.completed_at) return 'completed';
  return submission?.first_answer?.trim() ? 'inProgress' : 'notStarted';
}

export function progressRows(assignments: AssignmentRecord[], members: MemberRecord[], submissions: SubmissionRecord[]): ProgressRow[] {
  const saved = new Map(submissions.map(s => [`${s.assignment_id}:${s.learner_id}`, s]));
  const roster = [...new Map(members.filter(m => m.active).map(m => [m.profile_id, m])).values()];
  return roster.flatMap(member => assignments.map(assignment => {
    const submission = saved.get(`${assignment.id}:${member.profile_id}`);
    return { learnerId: member.profile_id, learner: member.display_name, assignmentId: assignment.id, assignment: assignment.title,
      dueDate: assignment.due_date || '', status: workStatus(submission), completedAt: submission?.completed_at || '' };
  }));
}

export function participation(rows: Pick<ProgressRow, 'status'>[]): Participation {
  const counts = { total: rows.length, completed: 0, inProgress: 0, notStarted: 0, completionRate: null as number | null };
  rows.forEach(row => counts[row.status]++);
  counts.completionRate = counts.total ? 100 * counts.completed / counts.total : null;
  return counts;
}

export function nextAssignment(rows: ProgressRow[]) {
  return rows.filter(row => row.status !== 'completed').sort((a, b) =>
    Number(b.status === 'inProgress') - Number(a.status === 'inProgress') ||
    (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || a.assignment.localeCompare(b.assignment)
  )[0];
}

export function schoolRows(school: { id: string; name: string }, classes: SchoolClassRecord[]): SchoolReportRow[] {
  return classes.map(c => ({ schoolId: school.id, school: school.name, classId: c.id, classroom: c.title, teacher: c.teacher,
    enrollments: c.learners, assignments: c.assignments, opportunities: c.learners * c.assignments, completed: c.completed }));
}

export function schoolTotals(rows: SchoolReportRow[]) {
  const counts = rows.reduce((total, row) => ({ classes: total.classes + 1, enrollments: total.enrollments + row.enrollments,
    assignments: total.assignments + row.assignments, opportunities: total.opportunities + row.opportunities, completed: total.completed + row.completed }),
  { classes: 0, enrollments: 0, assignments: 0, opportunities: 0, completed: 0 });
  return { ...counts, completionRate: counts.opportunities ? 100 * counts.completed / counts.opportunities : null };
}

// Quote every cell and neutralize spreadsheet formulas, including those preceded by whitespace.
export function csvCell(value: string | number) {
  const text = String(value).replace(/\u0000/g, '');
  const safe = /^[\s]*[=+\-@]|^[\t\r\n]/u.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
function csv(rows: (string | number)[][]) { return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n'; }

export function progressCsv(rows: ProgressRow[], language: Language, classroom: string, personal = false, generatedAt = new Date().toISOString()) {
  const c = schoolReportCopy[language];
  const headers = [c.classroom, ...(!personal ? [c.learner, c.learnerReference] : []), c.assignment, c.due, c.status, c.completedAt, c.generatedAt];
  return csv([headers, ...rows.map(row => [classroom, ...(!personal ? [row.learner, row.learnerId] : []), row.assignment, row.dueDate, c[row.status], row.completedAt, generatedAt])]);
}

export function schoolCsv(rows: SchoolReportRow[], language: Language, generatedAt = new Date().toISOString()) {
  const c = schoolReportCopy[language];
  return csv([[c.school, c.classroom, c.teacher, c.enrollments, c.assignments, c.opportunities, c.completed, c.rate, c.generatedAt], ...rows.map(row =>
    [row.school, row.classroom, row.teacher, row.enrollments, row.assignments, row.opportunities, row.completed,
      row.opportunities ? (100 * row.completed / row.opportunities).toFixed(1) + '%' : '', generatedAt])]);
}

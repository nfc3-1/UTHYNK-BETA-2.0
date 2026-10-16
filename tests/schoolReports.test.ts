import { describe, expect, it } from 'vitest';
import { progressRows, participation, nextAssignment, schoolRows, schoolTotals, progressCsv, schoolCsv, csvCell } from '../lib/schoolReports';
import { schoolReportCopy } from '../lib/schoolReportCopy';
const assignments = [{ id: 'a', title: 'Reading A', due_date: '2026-10-20' }, { id: 'b', title: 'Reading B' }];
const members = [{ profile_id: 'one', display_name: 'Learner One', active: true }, { profile_id: 'two', display_name: 'Learner Two', active: true }, { profile_id: 'old', display_name: 'Former learner', active: false }];
const submissions = [{ assignment_id: 'a', learner_id: 'one', completed_at: '2026-10-16T12:00:00Z' }, { assignment_id: 'b', learner_id: 'one', first_answer: 'Saved answer' }, { assignment_id: 'a', learner_id: 'old', completed_at: '2026-10-16T12:00:00Z' }, { assignment_id: 'other-class', learner_id: 'two', completed_at: '2026-10-16T12:00:00Z' }];

describe('objective participation reports', () => {
  it('counts actual states on the current roster, excluding former members and unrelated assignments', () => {
    const rows = progressRows(assignments, [...members, members[0]], submissions);
    expect(rows).toHaveLength(4);
    expect(participation(rows)).toEqual({ total: 4, completed: 1, inProgress: 1, notStarted: 2, completionRate: 25 });
    expect(JSON.stringify(rows)).not.toContain('Former learner'); expect(JSON.stringify(rows)).not.toContain('other-class');
    expect(nextAssignment(rows.filter(r => r.learnerId === 'one'))?.assignmentId).toBe('b');
    expect(nextAssignment(rows.filter(r => r.status === 'completed'))).toBeUndefined();
  });
  it('does not turn no opportunities into a zero learning score, and weights school totals by opportunities', () => {
    expect(participation([]).completionRate).toBeNull(); expect(schoolTotals([]).completionRate).toBeNull();
    const rows = schoolRows({ id: 'school', name: 'School' }, [
      { id: 'a', title: 'Small', teacher: 'A', learners: 1, assignments: 1, completed: 1 },
      { id: 'b', title: 'Large', teacher: 'B', learners: 9, assignments: 1, completed: 0 },
    ]);
    expect(schoolTotals(rows)).toMatchObject({ opportunities: 10, completed: 1, enrollments: 10, completionRate: 10 });
    expect(schoolCsv(rows, 'en')).not.toMatch(/score|grade|ability/i);
  });
  it.each(['en','es','fr'] as const)('exports localized statuses, never answers or invented observations, in %s', language => {
    const rows = progressRows(assignments, members, submissions), c = schoolReportCopy[language];
    const csv = progressCsv(rows, language, 'Class');
    expect(csv).toContain(c.completed); expect(csv).toContain(c.inProgress); expect(csv).toContain(c.notStarted);
    expect(csv).not.toContain('Saved answer'); expect(csv).not.toContain('first_answer');
    const own = progressCsv(rows.filter(r => r.learnerId === 'one'), language, 'Class', true);
    expect(own).not.toContain('Learner One'); expect(own).not.toContain('Learner Two');
    expect(Object.keys(c).sort()).toEqual(Object.keys(schoolReportCopy.en).sort());
  });
  it('escapes CSV quotes, multiline names, and spreadsheet-formula injection', () => {
    expect(csvCell('Quoted "name"')).toBe('"Quoted ""name"""');
    for (const value of ['=1+1',' +SUM(A1:A2)','\t@SUM(A1)','\n-1','\r=CMD()']) expect(csvCell(value)).toBe('"\'' + value + '"');
    expect(csvCell('ordinary\nname')).toBe('"ordinary\nname"');
  });
});

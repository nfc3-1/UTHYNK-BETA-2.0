import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClassroomProgress, SchoolParticipationReport, DistrictParticipationReport } from '../components/SchoolReports';
import { schoolReportCopy } from '../lib/schoolReportCopy';
vi.mock('next/link', () => ({ default: 'a' }));
let page: ReactTestRenderer;
afterEach(() => { if (page) act(() => page.unmount()); vi.unstubAllGlobals(); });
function language(value: string) {
  const events = new EventTarget();
  vi.stubGlobal('window', { localStorage: { getItem: () => value }, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) });
}
const assignments = [{ id: 'a', title: 'New passage' }, { id: 'b', title: 'Another passage' }];
const base = { manage: false, viewerId: 'me', members: [], assignments, submissions: [{ assignment_id: 'a', learner_id: 'me', first_answer: 'Saved' }] };
describe('school workspaces', () => {
  it.each(['en','es','fr'] as const)('shows the student’s next real assignment and a personal export in %s', l => {
    language(l); act(() => { page = create(<ClassroomProgress data={base} classId="class" />); });
    expect(JSON.stringify(page.toJSON())).toContain(schoolReportCopy[l].next);
    const links = page.root.findAllByType('a'); expect(links.some(a => a.props.href === '/classroom/assignments/a')).toBe(true);
    expect(links.some(a => a.props.href.includes('view=learning') && a.props.href.includes('language=' + l))).toBe(true);
    expect(page.root.findAllByType('table')).toHaveLength(0);
  });
  it('filters teacher counts and export together without attributing former learner work', () => {
    language('en'); act(() => { page = create(<ClassroomProgress classId="class" data={{ ...base, manage: true, members: [{ profile_id: 'me', display_name: 'Current learner', active: true }, { profile_id: 'former', display_name: 'Former learner', active: false }] }} />); });
    act(() => page.root.findByType('select').props.onChange({ target: { value: 'b' } }));
    expect(JSON.stringify(page.toJSON())).not.toContain('Former learner');
    expect(page.root.findAllByType('a').some(a => a.props.href.includes('assignmentId=b') && a.props.href.includes('view=teaching'))).toBe(true);
    expect(page.root.findAllByType('tbody')[0].findAllByType('td').map(td => td.children.join(''))).toEqual(['0','0','1']);
  });
  it('shows an unmeasured empty school and a real scoped download link', () => {
    language('en'); act(() => { page = create(<SchoolParticipationReport school={{ id: 'authorized', name: 'School' }} classes={[]} />); });
    expect(JSON.stringify(page.toJSON())).toContain('—');
    expect(page.root.findByType('a').props.href).toContain('schoolId=authorized');
    expect(JSON.stringify(page.toJSON())).not.toMatch(/IQ|grade|baseline score/);
  });
  it('loads the selected district, connects its export, and hides stale results after denial', async () => {
    language('en'); let denied = false; const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => { calls.push(url); const district = new URL(url, 'http://localhost').searchParams.get('districtId');
      return denied ? Response.json({ error: 'Denied' }, { status: 403 }) : Response.json({ label: 'District ' + district, schools: [{ id: 'school-' + district, name: 'School ' + district, enrollments: 2, completed: 1, opportunities: 2 }], totals: { classes: 1, enrollments: 2, opportunities: 2, completed: 1, completionRate: 50 } });
    });
    await act(async () => { page = create(<DistrictParticipationReport districts={[{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]} />); });
    expect(JSON.stringify(page.toJSON())).toContain('School a');
    await act(async () => { page.root.findByType('select').props.onChange({ target: { value: 'b' } }); });
    expect(calls).toEqual(['/api/schools/report?districtId=a','/api/schools/report?districtId=b']);
    expect(JSON.stringify(page.toJSON())).toContain('School b'); expect(JSON.stringify(page.toJSON())).not.toContain('School a');
    expect(page.root.findByType('a').props.href).toContain('districtId=b');
    denied = true; await act(async () => { page.root.findByType('button').props.onClick(); });
    expect(page.root.findAllByType('a')).toHaveLength(0); expect(page.root.findByProps({ role: 'alert' })).toBeTruthy();
  });

});

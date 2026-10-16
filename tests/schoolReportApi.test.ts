import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as classroomReport } from '../app/api/classroom/report/route';
import { GET as schoolReport } from '../app/api/schools/report/route';
const state = vi.hoisted(() => ({ user: 'learner' as string | null, manage: false, scope: 'school', revoked: false, classDenied: false, snapshots: vi.fn(), rpc: vi.fn() }));
vi.mock('../lib/auth', () => ({ getServerSessionUser: async () => null }));
vi.mock('../lib/accessControl', () => ({ getAccountAccess: async () => ({ userId: state.user, role: 'user', sections: [] }) }));
vi.mock('../lib/supabaseAdmin', () => ({ supabaseAdmin: { rpc: (...args: unknown[]) => state.rpc(...args) } }));
vi.mock('../lib/classroom', async original => {
  const actual = await original<any>();
  return { ...actual, classroomActor: async () => { if (!state.user) throw new actual.ClassroomError('Sign in', 401); return { userId: state.user, role: 'user', sections: [] }; }, classroomSnapshot: state.snapshots };
});
const classId = '11111111-1111-4111-8111-111111111111';
beforeEach(() => {
  state.user = 'learner'; state.manage = false; state.scope = 'school'; state.revoked = false; state.classDenied = false;
  vi.clearAllMocks();
  state.snapshots.mockImplementation(async () => {
    if (state.classDenied) { const { ClassroomError } = await import('../lib/classroom'); throw new ClassroomError('Class access denied', 403); }
    return { manage: state.manage, classes: [{ id: classId, title: 'Class', join_code: 'SECRET-CODE' }], members: [{ profile_id: 'learner', display_name: '=DANGEROUS()', active: true }],
      assignments: [{ id: 'a', title: 'Reading', due_date: null }], submissions: [
        { assignment_id: 'a', learner_id: 'learner', first_answer: 'PRIVATE ANSWER', completed_at: null },
        { assignment_id: 'a', learner_id: 'other', first_answer: 'OTHER PRIVATE ANSWER', completed_at: '2026-10-16' },
      ], comments: [{ body: 'PRIVATE COMMENT' }] };
  });
  state.rpc.mockImplementation(async (_name, args) => {
    const school = args.requested_school || 'a';
    if (school === 'c' || (state.scope === 'school' && school === 'b') || (state.revoked && school === 'b')) return { data: null, error: { code: '42501' } };
    return { data: { platformAdmin: false, selected: school,
      districts: [{ id: 'district', name: 'District', canManage: state.scope === 'district' }],
      schools: state.scope === 'district' ? [{ id: 'a', name: 'School A', district_id: 'district' }, { id: 'b', name: 'School B', district_id: 'district' }] : [{ id: 'a', name: 'School A', district_id: 'district' }],
      staff: [{ name: 'PRIVATE STAFF ENTRY' }], districtAdmins: [{ name: 'PRIVATE ADMIN ENTRY' }],
      classes: [{ id: school + '-class', title: 'Class ' + school, teacher: 'Assigned teacher', learners: 2, assignments: 2, completed: school === 'a' ? 2 : 1, first_answer: 'PRIVATE ANSWER', join_code: 'SECRET-CODE' }],
    }, error: null };
  });
});
const request = (path: string) => new Request('http://localhost' + path);
describe('report endpoints preserve classroom and organization boundaries', () => {
  it('requires authentication, including CSV downloads', async () => {
    state.user = null;
    for (const response of [await classroomReport(request('/api/classroom/report?classId=' + classId)), await schoolReport(request('/api/schools/report?schoolId=a&format=csv'))]) {
      expect(response.status).toBe(401); expect(response.headers.get('cache-control')).toBe('private, no-store');
    }
    expect(state.snapshots).not.toHaveBeenCalled(); expect(state.rpc).not.toHaveBeenCalled();
  });
  it('exports only the verified learner’s participation and rejects forged report roles', async () => {
    const response = await classroomReport(request(`/api/classroom/report?classId=${classId}&userId=other&role=admin&language=fr`));
    expect(response.status).toBe(200); expect(response.headers.get('content-type')).toContain('text/csv');
    expect(state.snapshots).toHaveBeenCalledWith(expect.objectContaining({ userId: 'learner' }), classId, 'learning');
    const csv = await response.text(); expect(csv).toContain('Première réponse enregistrée'); expect(csv).not.toContain('PRIVATE'); expect(csv).not.toContain('SECRET'); expect(csv).not.toContain('other');
    expect((await classroomReport(request(`/api/classroom/report?classId=${classId}&view=teaching`))).status).toBe(403);
    state.classDenied = true; expect((await classroomReport(request(`/api/classroom/report?classId=${classId}`))).status).toBe(403);
  });
  it('exports the teacher’s active roster safely and rejects assignments outside the class', async () => {
    state.manage = true;
    const response = await classroomReport(request(`/api/classroom/report?classId=${classId}&view=teaching&assignmentId=a`));
    expect(await response.text()).toContain("'=DANGEROUS()");
    expect((await classroomReport(request(`/api/classroom/report?classId=${classId}&view=teaching&assignmentId=foreign`))).status).toBe(404);
    expect((await classroomReport(request(`/api/classroom/report?classId=${classId}&view=admin`))).status).toBe(400);
  });
  it('keeps school reports aggregate-only and denies another school or district', async () => {
    const response = await schoolReport(request('/api/schools/report?schoolId=a'));
    const value = await response.json(); expect(value.totals).toMatchObject({ enrollments: 2, opportunities: 4, completed: 2, completionRate: 50 });
    expect(JSON.stringify(value)).not.toMatch(/PRIVATE|SECRET|first_answer|staff|join_code/);
    expect((await schoolReport(request('/api/schools/report?schoolId=b'))).status).toBe(403);
    expect((await schoolReport(request('/api/schools/report?districtId=district'))).status).toBe(403);
    const csv = await schoolReport(request('/api/schools/report?schoolId=a&format=csv&language=es'));
    expect(csv.headers.get('content-disposition')).toContain('uthynk-school-participation.csv'); expect(await csv.text()).toContain('Entregas posibles');
  });
  it('reauthorizes every district school and fails the entire report after revocation', async () => {
    state.scope = 'district';
    const response = await schoolReport(request('/api/schools/report?districtId=district'));
    const value = await response.json(); expect(value.schools.map((s: any) => s.id)).toEqual(['a','b']);
    expect(value.totals).toMatchObject({ opportunities: 8, completed: 3, completionRate: 37.5 });
    expect(state.rpc.mock.calls.every(call => call[1].actor === 'learner')).toBe(true);
    expect((await schoolReport(request('/api/schools/report?districtId=other'))).status).toBe(403);
    state.revoked = true; const denied = await schoolReport(request('/api/schools/report?districtId=district&format=csv'));
    expect(denied.status).toBe(403); expect(await denied.text()).not.toContain('School A');
  });
  it('rejects ambiguous scopes and unsupported formats or languages', async () => {
    for (const suffix of ['', '?schoolId=a&districtId=district', '?schoolId=a&format=html', '?schoolId=a&language=unknown']) expect((await schoolReport(request('/api/schools/report' + suffix))).status).toBe(400);
  });
});

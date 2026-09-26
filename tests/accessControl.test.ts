import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAccountAccess, permits, type AccountAccess } from '../lib/accessControl';
import { POST } from '../app/api/admin/access/route';
import TeacherPage from '../app/teacher/page';
import AccessPage from '../app/admin/access/page';

const state = vi.hoisted(() => ({ role: 'user', grants: {} as Record<string, string>, signedIn: true, identityValid: true, rpc: vi.fn() }));
vi.mock('../lib/auth', () => ({ getServerSessionUser: async () => state.signedIn ? { id: 'profile', auth_user_id: 'auth' } : null }));
vi.mock('../lib/supabaseAdmin', () => ({ supabaseAdmin: {
  auth: { admin: { getUserById: async () => ({ data: { user: state.identityValid ? { id: 'auth' } : null }, error: null }) } },
  from: (table: string) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === 'user_profiles' ? { id: 'profile', auth_user_id: 'auth' } : { role: state.role, section_grants: state.grants, auth_user_id: 'auth' }, error: null }) }) }) }),
  rpc: (...args: unknown[]) => state.rpc(...args),
} }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
afterEach(() => { state.role = 'user'; state.grants = {}; state.signedIn = true; state.identityValid = true; state.rpc.mockReset(); });
describe('server access enforcement', () => {
  for (const role of ['user','teacher','admin'] as const) it(`enforces page access for ${role}`, async () => {
    state.role = role;
    if (role === 'user') await expect(TeacherPage()).rejects.toThrow('redirect:');
    else expect(await TeacherPage()).toBeTruthy();
    if (role !== 'admin') await expect(AccessPage()).rejects.toThrow('redirect:');
    else expect(await AccessPage()).toBeTruthy();
  });
  it('isolates section grants and applies revocation without stale caching', async () => {
    state.grants = { teacher: 'now' };
    expect(permits(await getAccountAccess(), 'teacher')).toBe(true);
    expect(permits(await getAccountAccess(), 'studio')).toBe(false);
    state.grants = {};
    expect(permits(await getAccountAccess(), 'teacher')).toBe(false);
    const access: AccountAccess = { role: 'user', userId: 'x', sections: ['admin'] };
    expect(permits(access, 'admin')).toBe(false);
  });
  it('rejects missing or deleted Supabase identities', async () => {
    state.role = 'admin'; state.identityValid = false;
    expect(permits(await getAccountAccess(), 'admin')).toBe(false);
    state.identityValid = true; state.signedIn = false;
    expect(permits(await getAccountAccess(), 'teacher')).toBe(false);
  });
  for (const role of ['user','teacher']) it(`blocks manual privilege escalation by ${role}`, async () => {
    state.role = role;
    const response = await POST(new Request('http://localhost/api/admin/access', { method: 'POST', body: JSON.stringify({ role: 'admin' }) }));
    expect(response.status).toBe(403); expect(state.rpc).not.toHaveBeenCalled();
  });
  it('allows an admin to grant and revoke via the atomic database mutation', async () => {
    state.role = 'admin'; state.rpc.mockResolvedValue({ error: null });
    for (const sections of [['teacher'], []]) {
      const response = await POST(new Request('http://localhost/api/admin/access', { method: 'POST', headers: { origin: 'http://localhost' }, body: JSON.stringify({ userId: '11111111-1111-1111-1111-111111111111', role: 'user', sections }) }));
      expect(response.status).toBe(200);
      expect(state.rpc).toHaveBeenLastCalledWith('save_account_access', { actor_id: 'profile', target_id: '11111111-1111-1111-1111-111111111111', next_role: 'user', next_sections: sections });
    }
  });
  it('rejects cross-origin admin mutations', async () => {
    state.role = 'admin';
    expect((await POST(new Request('http://localhost/api/admin/access', { method: 'POST', headers: { origin: 'https://evil.example' } }))).status).toBe(403);
    expect(state.rpc).not.toHaveBeenCalled();
  });
});

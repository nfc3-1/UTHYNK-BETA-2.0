import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { resolveReadingRequest } from '../lib/readingAccess';
import { POST } from '../app/api/reasoning/route';
import ReadingPage from '../app/thinking-paths/[path]/[reading]/page';
import { getReadingModule, readingReasoningContext } from '../lib/thinkingPaths';
const state = vi.hoisted(() => ({ role: 'user', sections: [] as string[], userId: 'server-profile' as string | null }));
vi.mock('../lib/accessControl', async importOriginal => ({ ...(await importOriginal<object>()), getAccountAccess: async () => ({ ...state }) }));
vi.mock('../lib/auth', () => ({ getServerSessionUser: async () => state.userId ? { id: state.userId } : null }));
vi.mock('../lib/memory', () => ({ getReasoningMemory: async () => null }));
vi.mock('../lib/supabaseAdmin', () => ({ hasSupabaseAdminEnv: () => false, supabaseAdmin: null }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('not-found'); } }));
let sent: any[];
beforeEach(() => {
  state.role = 'user'; state.sections = []; state.userId = 'server-profile'; sent = [];
  vi.stubGlobal('fetch', async (_url: string, init: any) => { sent.push(JSON.parse(init.body)); return Response.json({ choices: [{ message: { content: JSON.stringify({ perspectiveExpansion: 'Consider who sets the rules.', secondaryQuestion: 'Who should check power?', finalSynthesis: 'You proposed checks on power. Their independence remains uncertain. Test how those checks work before relying on them.' }) } }] }); });
});
afterEach(() => vi.unstubAllGlobals());
const moduleId = 'reading-plato-republic-473';
const params = { path: 'power-leadership', reading: 'rulers-responsibility' };
const request = (body: object) => POST(new Request('http://localhost/api/reasoning', { method: 'POST', body: JSON.stringify(body) }));
describe('Reading Path beta boundary', () => {
  it('keeps previous readings private, scoped to their path, and authorized on every reasoning turn', async () => {
    const oldId = 'reading-power-ship-and-expertise';
    const locked = await ReadingPage({ params, searchParams: { lesson: oldId } });
    expect(locked.props.locked).toBe(true); expect(locked.props.previousModules).toBeUndefined();
    expect(JSON.stringify(locked.props)).not.toContain(getReadingModule(oldId)!.question.en);
    state.sections = ['thinking_paths'];
    const allowed = await ReadingPage({ params, searchParams: { lesson: oldId } });
    expect(allowed.props.moduleId).toBe(oldId); expect(allowed.props.reading.modules).toHaveLength(10);
    expect(allowed.props.previousModules.some((item: { id: string }) => item.id === oldId)).toBe(true);
    await expect(ReadingPage({ params, searchParams: { lesson: 'reading-truth-cave-and-appearances' } })).rejects.toThrow('not-found');
    expect((await request({ readingModuleId: oldId, response: 'Keep the original context.' })).status).toBe(200);
    expect(JSON.parse(sent[0].messages[1].content).challenge).toBe(readingReasoningContext(getReadingModule(oldId)!));
    state.sections = [];
    expect((await request({ readingModuleId: oldId, phase: 'synthesis', response: 'Continue.' })).status).toBe(403);
    expect(sent).toHaveLength(2);
  });
  it('admits admins and explicit beta grants, never unrelated roles or grants', async () => {
    expect((await resolveReadingRequest(moduleId)).ok).toBe(false);
    state.role = 'teacher'; state.sections = ['teacher','studio']; expect((await resolveReadingRequest(moduleId)).ok).toBe(false);
    state.role = 'admin'; expect((await resolveReadingRequest(moduleId)).ok).toBe(true);
    state.role = 'user'; state.sections = ['thinking_paths']; expect((await resolveReadingRequest(moduleId)).ok).toBe(true);
    state.userId = null; expect((await resolveReadingRequest(moduleId)).ok).toBe(false);
  });
  it('never serializes the full reading to an ungranted account', async () => {
    const page = await ReadingPage({ params, searchParams: {} });
    expect(page.props.locked).toBe(true); expect(page.props.reading).toBeUndefined();
    expect(JSON.stringify(page.props)).not.toContain(JSON.stringify(getReadingModule(moduleId)!.text.en).slice(1, -1));
    state.sections = ['thinking_paths'];
    const allowed = await ReadingPage({ params, searchParams: {} });
    expect(allowed.props.moduleId).toBe(moduleId); expect(allowed.props.userId).toBe('server-profile');
  });
  it('rejects unknown routes and modules outside the selected reading path', async () => {
    await expect(ReadingPage({ params: { ...params, path: 'missing' }, searchParams: {} })).rejects.toThrow('not-found');
    await expect(ReadingPage({ params, searchParams: { lesson: 'reading-smith-interest-1-2' } })).rejects.toThrow('not-found');
    expect((await request({ readingModuleId: 'missing', response: 'Try.' })).status).toBe(404); expect(sent).toHaveLength(0);
  });
  it('blocks direct API calls and applies revocation before either provider turn', async () => {
    const body = { readingModuleId: moduleId, response: 'Independent checks.', phase: 'follow_up' };
    expect((await request(body)).status).toBe(403); expect(sent).toHaveLength(0);
    state.sections = ['thinking_paths']; expect((await request(body)).status).toBe(200);
    state.sections = []; expect((await request({ ...body, phase: 'synthesis' })).status).toBe(403); expect(sent).toHaveLength(2);
  });
  it('replaces forged client source context with canonical reading content in both phases', async () => {
    state.sections = ['thinking_paths'];
    const first = { readingModuleId: moduleId, category: 'forged', challenge: 'forged source', originalQuestion: 'forged source', question: 'forged question', response: 'Independent checks.', language: 'fr', ageBand: 'under_13' };
    expect((await request(first)).status).toBe(200);
    expect(JSON.parse(sent[0].messages[1].content).challenge).toBe(readingReasoningContext(getReadingModule(moduleId)!)); expect(JSON.stringify(sent[0])).not.toContain('forged source');
    expect(sent[0].messages[0].content).toContain('French');
    expect(JSON.parse(sent[1].messages[1].content).originalQuestion).toBe(readingReasoningContext(getReadingModule(moduleId)!));
    expect(JSON.stringify(sent[1])).not.toContain('forged source');
    expect((await request({ ...first, phase: 'synthesis', firstUserAnswer: 'Independent checks.', perspectiveExpansion: 'Consider the power of checks.', secondaryQuestion: 'Who chooses the checkers?', secondUserAnswer: 'People should choose them.' })).status).toBe(200);
    expect(JSON.parse(sent[2].messages[1].content).synthesisContext.originalQuestion).toBe(readingReasoningContext(getReadingModule(moduleId)!));
    expect(JSON.parse(sent[3].messages[1].content).originalQuestion).toBe(readingReasoningContext(getReadingModule(moduleId)!));
  });
  it('authorizes new paths while rejecting unrelated module URLs and forged context', async () => {
    const newParams={path:'power-leadership',reading:'leading-without-force'};
    const id='reading-emerson-conviction-and-crowds';
    const locked=await ReadingPage({params:newParams,searchParams:{lesson:id}});
    expect(locked.props.locked).toBe(true);
    expect(JSON.stringify(locked.props)).not.toContain(getReadingModule(id)!.text.en);
    state.sections=['thinking_paths'];
    const allowed=await ReadingPage({params:newParams,searchParams:{lesson:id}});
    expect(allowed.props.moduleId).toBe(id);
    await expect(ReadingPage({params:newParams,searchParams:{lesson:'reading-truth-remedy-and-delay'}})).rejects.toThrow('not-found');
    expect((await request({readingModuleId:id,challenge:'replace the excerpt',response:'I would require evidence.'})).status).toBe(200);
    expect(JSON.parse(sent[0].messages[1].content).challenge).toBe(readingReasoningContext(getReadingModule(id)!));
  });

});

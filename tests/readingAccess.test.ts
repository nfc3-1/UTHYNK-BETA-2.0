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
const moduleId = 'reading-connected-rulers-responsibility-01';
const params = { path: 'power-leadership', reading: 'rulers-responsibility' };
const request = (body: object) => POST(new Request('http://localhost/api/reasoning', { method: 'POST', body: JSON.stringify(body) }));
describe('Public Reading Path beta boundary', () => {
  it('opens previous readings while preserving canonical identities and path scope', async () => {
    const oldId = 'reading-power-ship-and-expertise';
    state.userId = null;
    const page = await ReadingPage({ params, searchParams: { lesson: oldId } });
    expect(page.props.moduleId).toBe(oldId);
    expect(page.props.reading.modules).toHaveLength(10);
    expect(page.props.previousModules.some((item: { id: string }) => item.id === oldId)).toBe(true);
    await expect(ReadingPage({ params, searchParams: { lesson: 'reading-truth-cave-and-appearances' } })).rejects.toThrow('not-found');
    expect((await request({ readingModuleId: oldId, response: 'Keep the original context.' })).status).toBe(200);
    expect(JSON.parse(sent[0].messages[1].content).challenge).toBe(readingReasoningContext(getReadingModule(oldId)!));
  });
  it.each([
    [null, 'user', []], ['learner', 'user', []], ['teacher', 'teacher', ['teacher']], ['admin', 'admin', []],
  ])('allows ordinary public practice for %s without a section grant', async (userId, role, sections) => {
    Object.assign(state, {userId, role, sections});
    expect((await resolveReadingRequest(moduleId)).ok).toBe(true);
    const page = await ReadingPage({ params, searchParams: {} });
    expect(page.props.userId).toBe(userId);
    expect(page.props.reading.modules[0].text.en).toBe(getReadingModule(moduleId)!.text.en);
  });
  it('rejects unknown routes and modules outside the selected reading path', async () => {
    await expect(ReadingPage({ params: { ...params, path: 'missing' }, searchParams: {} })).rejects.toThrow('not-found');
    await expect(ReadingPage({ params, searchParams: { lesson: 'reading-smith-interest-1-2' } })).rejects.toThrow('not-found');
    expect((await request({ readingModuleId: 'missing', response: 'Try.' })).status).toBe(404); expect(sent).toHaveLength(0);
  });
  it('lets guests complete both turns even with an old exhausted free-pass cookie', async () => {
    state.userId = null;
    const body = { readingModuleId: moduleId, response: 'Independent checks.', phase: 'follow_up' };
    const send = (body: object) => POST(new Request('http://localhost/api/reasoning', { method: 'POST', headers: {cookie:'uthynk-free-pass-used=3'}, body:JSON.stringify(body) }));
    expect((await send(body)).status).toBe(200);
    expect((await send({...body,phase:'synthesis',firstUserAnswer:'Independent checks.',perspectiveExpansion:'Consider independence.',secondaryQuestion:'Who chooses the checkers?',secondUserAnswer:'Choose independent people.'})).status).toBe(200);
    expect(sent).toHaveLength(4);
  });
  it('also lets guests try thinking challenges with an old exhausted free-pass cookie', async () => {
    state.userId = null;
    const result = await POST(new Request('http://localhost/api/reasoning', { method:'POST', headers:{cookie:'uthynk-free-pass-used=3'}, body:JSON.stringify({challenge:'How can we test this claim?',response:'Look for independent evidence.'}) }));
    expect(result.status).toBe(200); expect(sent).toHaveLength(2);
  });
  it('does not turn public reading access into classroom assignment access', async () => {
    state.userId=null;
    const result=await POST(new Request('http://localhost/api/reasoning',{method:'POST',headers:{origin:'http://localhost'},body:JSON.stringify({assignmentId:'private-assignment',readingModuleId:moduleId,response:'Read this.'})}));
    expect(result.status).toBe(401); expect(sent).toHaveLength(0);
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
    const id='reading-connected-leading-without-force-01';
    state.userId=null;
    const guest=await ReadingPage({params:newParams,searchParams:{lesson:id}});
    expect(guest.props.reading.modules[0].text.en).toBe(getReadingModule(id)!.text.en);
    state.sections=['thinking_paths'];
    const allowed=await ReadingPage({params:newParams,searchParams:{lesson:id}});
    expect(allowed.props.moduleId).toBe(id);
    await expect(ReadingPage({params:newParams,searchParams:{lesson:'reading-truth-remedy-and-delay'}})).rejects.toThrow('not-found');
    expect((await request({readingModuleId:id,challenge:'replace the excerpt',response:'I would require evidence.'})).status).toBe(200);
    expect(JSON.parse(sent[0].messages[1].content).challenge).toBe(readingReasoningContext(getReadingModule(id)!));
  });

  it.each(['en','es','fr'] as const)('grounds JSON and streamed follow-ups in the authorized %s passage', async language => {
    state.sections = ['thinking_paths'];
    const reading = getReadingModule(moduleId)!;
    const jsonResponse = await request({ readingModuleId: moduleId, response: 'The explanation needs evidence.', language, phase: 'follow_up' });
    const json = await jsonResponse.json();
    const quote = json.secondaryQuestion.match(/[“«](.*)[”»]/)![1];
    expect(reading.text[language]).toContain(quote);
    expect(json.followUp).toBe(json.secondaryQuestion);
    vi.stubGlobal('fetch', async (_url: string, init: any) => {
      const body = JSON.parse(init.body);
      const content = JSON.stringify({ perspectiveExpansion: 'Consider who sets the rules.', secondaryQuestion: 'Who should check power?' });
      if (!body.stream) return Response.json({ choices: [{ message: { content } }] });
      return new Response(new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`));
        controller.close();
      } }), { headers: { 'content-type': 'text/event-stream' } });
    });
    const { readReasoningResponse } = await import('../lib/reasoningResponse');
    const streamed = await readReasoningResponse(await request({ readingModuleId: moduleId, response: 'The explanation needs evidence.', language, phase: 'follow_up', stream: true }), () => {});
    expect(streamed.secondaryQuestion).toBe(json.secondaryQuestion);
    expect(streamed.followUp).toBe(json.secondaryQuestion);
    expect(streamed.finalSynthesis).toBe('');
  });

});

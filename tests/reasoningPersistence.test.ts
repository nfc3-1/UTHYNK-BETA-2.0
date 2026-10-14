import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../app/api/reasoning/route';
const db = vi.hoisted(() => ({ calls: [] as any[], canonical: vi.fn(), progress: vi.fn(), trait: vi.fn() }));
vi.mock('../lib/auth', () => ({ getServerSessionUser: async () => ({ id: 'learner-1' }) }));
vi.mock('../lib/memory', () => ({ getReasoningMemory: async () => null }));
vi.mock('../lib/canonicalPersistence', () => ({ persistCanonicalConversation: db.canonical, updateCanonicalUserProgress: db.progress, upsertCanonicalTrait: db.trait }));
vi.mock('../lib/supabaseAdmin', () => ({
  hasSupabaseAdminEnv: () => true,
  supabaseAdmin: {
    from(table: string) {
      const call: any = { table }; db.calls.push(call);
      const data = table === 'user_profiles'
        ? { id: 'learner-1', xp: 100, reasoning_score: 80, streak: 4, primary_trait: 'Evidence', updated_at: new Date().toISOString() }
        : { id: 'trait-1', trait_score: 50 };
      const query: any = {
        select() { return query; },
        eq(key: string, value: unknown) { call.filters = [...(call.filters || []), [key, value]]; return query; },
        single: async () => ({ data }),
        insert(value: unknown) { call.insert = value; return query; },
        update(value: unknown) { call.update = value; return query; },
        then(resolve: (value: unknown) => void) { resolve({ data }); },
      };
      return query;
    },
  },
}));
beforeEach(() => { db.calls.length = 0; vi.clearAllMocks(); });
afterEach(() => vi.unstubAllGlobals());
const context = { phase: 'synthesis', originalQuestion: 'Should we extend the rule?', firstUserAnswer: 'Test it in one class.', perspectiveExpansion: 'Consider different class sizes.', secondaryQuestion: 'How would you compare them?', secondUserAnswer: 'Compare similar classes before extending it.' };

describe('beta scoring persistence compatibility', () => {
  for (const score of [90, undefined]) it(`keeps XP, rank, history and user scoping without writing retired behavioral measurements (${score})`, async () => {
    vi.stubGlobal('fetch', async () => Response.json({ choices: [{ message: { content: JSON.stringify({ score, xp: 999, trait: 'Evidence', finalSynthesis: 'You proposed a comparison and retained it. Class size may affect attendance. Check comparable cases before extending a rule.' }) } }] }));
    const response = await POST(new Request('http://localhost/api/reasoning', { method: 'POST', body: JSON.stringify(context) }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.progression).toMatchObject({ xp: 152, rank: 'Observer', streak: 4, reasoningProfile: null, reasoningScore: score === undefined ? 80 : 82 });
    expect(db.calls.some(call => call.table === 'reasoning_profiles')).toBe(false);
    const update = db.calls.find(call => call.table === 'user_profiles' && call.update);
    expect(update.update.xp).toBe(152);
    expect(update.filters).toContainEqual(['id', 'learner-1']);
    expect(db.canonical).toHaveBeenCalledWith(expect.objectContaining({ userId: 'learner-1', claim: context.secondUserAnswer, feedback: expect.objectContaining({ xp: 52, assessment: expect.objectContaining({ status: 'provisional' }) }) }));
    expect(db.progress).toHaveBeenCalledWith(expect.objectContaining({ profileId: 'learner-1', xp: 152 }));
    expect(db.calls.find(call => call.table === 'reasoning_verifier_scores').insert.signals).toMatchObject({ status: 'retired', assessment: { rubricVersion: 'beta-v1', scoreSource: score === undefined ? 'unavailable' : 'model' } });
    if (score === undefined) expect(db.trait).not.toHaveBeenCalled();
  });
});

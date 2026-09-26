import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../app/api/studio/generate/route';
vi.mock('../lib/studioAuth', () => ({ getStudioAccess: async () => ({ allowed: true, user: { id: 'owner' } }) }));
vi.mock('../lib/telemetry', () => ({ trackServerEvent: async () => {} }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('Studio generation language', () => {
  for (const [language, name] of [['en','English'],['es','Spanish'],['fr','French'],['arbitrary','English']]) it(`validates ${language}`, async () => {
    let prompt = '';
    vi.stubGlobal('fetch', async (_url: string, options: any) => { prompt = JSON.parse(options.body).messages[0].content; return Response.json({ choices: [{ message: { content: '{"posts":[],"assets":[]}' } }] }); });
    const result = await POST(new Request('http://localhost/api/studio/generate', { method: 'POST', body: JSON.stringify({ language }) }));
    expect(result.status).toBe(200); expect(prompt).toContain(`entirely in ${name}`);
  });
  it('does not substitute English campaign text for a failed Spanish generation', async () => {
    vi.stubEnv('OPENAI_API_KEY','');
    const result = await POST(new Request('http://localhost/api/studio/generate', { method: 'POST', body: JSON.stringify({ language: 'es' }) }));
    expect(result.status).toBe(503); expect((await result.json()).error).toContain('No se pudo');
  });
});

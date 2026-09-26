import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import Lesson from '../components/LessonQuestionClient';
import { createChallengeSession, legacyChallengeSessionKey } from '../lib/challengeSession';
vi.mock('next/link', () => ({ default: 'a' }));
vi.mock('../lib/telemetry', () => ({ createTelemetryEvent: () => ({}), trackEvent() {} }));
let page: ReactTestRenderer;
let storage: Map<string,string>;
let requests: any[];
function mount() { act(() => { page = create(createElement(Lesson, { category: 'Epistemology', questions: ['What evidence matters?'] })); }); }
function setup() {
  storage = new Map(); requests = [];
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) || null, setItem: (key: string,value: string) => storage.set(key,value), removeItem: (key: string) => storage.delete(key) });
  vi.stubGlobal('window', { localStorage, addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, setTimeout() {} });
  vi.stubGlobal('fetch', async (url: string, init: any) => {
    if (url !== '/api/reasoning') return Response.json({});
    const body = JSON.parse(init.body); requests.push(body);
    return Response.json(body.phase === 'synthesis' ? { finalSynthesis: 'Tu as proposé une preuve et maintenu cette idée. Son coût reste incertain. Teste les hypothèses.' } : { perspectiveExpansion: 'Considera el coste.', secondaryQuestion: '¿Qué evidencia falta?' });
  });
}
function select(language: string) { act(() => page.root.findByType('select').props.onChange({ target: { value: language } })); }
function type(value: string) { act(() => page.root.findByType('textarea').props.onChange({ target: { value } })); }
async function submit() { await act(async () => { await page.root.findByProps({ className: 'btn btnPrimary' }).props.onClick(); }); }
afterEach(() => { if (page) act(() => page.unmount()); vi.unstubAllGlobals(); });
describe('lesson language persistence', () => {
  it('preserves first and second drafts across language changes, refresh and completion', async () => {
    setup(); mount(); type('First typed draft'); select('es');
    expect(page.root.findByType('textarea').props.value).toBe('First typed draft');
    act(() => page.unmount()); mount();
    expect(page.root.findByType('select').props.value).toBe('es');
    expect(page.root.findByType('textarea').props.value).toBe('First typed draft');
    await submit(); type('Second spoken draft'); select('fr');
    expect(page.root.findByType('textarea').props.value).toBe('Second spoken draft');
    await submit();
    expect(requests.map(request => request.language)).toEqual(['es','fr']);
    expect(requests[1].firstUserAnswer).toBe('First typed draft');
    expect(requests[1].secondUserAnswer).toBe('Second spoken draft');
    expect(requests[1].originalQuestion).toBe(requests[0].originalQuestion);
    act(() => page.unmount()); mount();
    expect(page.root.findAllByType('textarea')).toHaveLength(0);
    expect(requests).toHaveLength(2);
  });
  it('migrates a legacy Spanish session and does not resurrect it after explicit reset', () => {
    setup(); storage.set('uthynk-language','es');
    const session = { ...createChallengeSession({ ageBand: '18_plus', category: 'Epistemology', language: 'es', questionId: 'Epistemology-0', questionIndex: 0, originalQuestion: '¿Qué evidencia importa?', sessionId: 's', conversationId: 'c' }), activeAnswerDraft: 'Borrador guardado' };
    storage.set(legacyChallengeSessionKey(session),JSON.stringify(session)); mount();
    expect(page.root.findByType('textarea').props.value).toBe('Borrador guardado');
    act(() => page.root.findAllByType('button').find(button => button.props.onClick?.name === 'startNewChallenge')!.props.onClick());
    act(() => page.unmount()); mount();
    expect(page.root.findByType('textarea').props.value).toBe('');
  });
});

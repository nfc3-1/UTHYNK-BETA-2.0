import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import ReadingPathClient from '../components/ReadingPathClient';
import { thinkingPaths } from '../lib/thinkingPaths';
import { readingProgress } from '../lib/readingProgress';
vi.mock('next/link', () => ({ default: 'a' }));
vi.mock('../lib/telemetry', () => ({ createTelemetryEvent: () => ({}), trackEvent() {} }));
let page: ReactTestRenderer;
let storage: Map<string, string>;
let requests: any[];
const path = thinkingPaths[0];
const reading = path.readingPaths[0];
const module = reading.modules[0];
function mount(id = module.id) { act(() => { page = create(createElement(ReadingPathClient, { pathSlug: path.slug, pathTitle: path.title, reading, moduleId: id, userId: 'verified-user' })); }); }
function setup() {
  storage = new Map([['uthynk-profile', JSON.stringify({ id: 'stale-local-user', age_band: '13_17' })]]); requests = [];
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
  const events = new EventTarget();
  vi.stubGlobal('window', { localStorage, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events), setTimeout() {} });
  vi.stubGlobal('fetch', async (url: string, init: any) => {
    if (url !== '/api/reasoning') return Response.json({});
    const body = JSON.parse(init.body); requests.push(body);
    return Response.json(body.phase === 'synthesis' ? { finalSynthesis: 'You proposed checks on power. Who selects the checkers remains uncertain. Test their independence.' } : { perspectiveExpansion: 'Consider who checks the leader.', secondaryQuestion: 'Who chooses the checkers?' });
  });
}
function change(language: string) { act(() => page.root.findAllByType('select')[0].props.onChange({ target: { value: language } })); }
function type(value: string) { act(() => page.root.findByType('textarea').props.onChange({ target: { value } })); }
async function submit() { await act(async () => { await page.root.findAllByType('button').find(button => button.props.className === 'btn btnPrimary')!.props.onClick(); }); }
function saved() { return JSON.parse([...storage.entries()].find(([key]) => key.includes(module.id))![1]); }
afterEach(() => { if (page) act(() => page.unmount()); vi.unstubAllGlobals(); });
describe('Reading Path journey', () => {
  it('switches passage and question language without losing either draft or creating a fifth step', async () => {
    setup(); mount(); type('First draft'); change('es');
    const first = saved();
    expect(page.root.findByType('blockquote').children.join('')).toBe(module.text.es);
    expect(page.root.findByType('textarea').props.value).toBe('First draft');
    expect(first.userId).toBe('verified-user'); expect(first.questionId).toBe(module.id);
    expect(first.originalQuestion).toBe(module.question.en);
    act(() => page.unmount()); mount();
    expect(page.root.findByType('textarea').props.value).toBe('First draft');
    await submit(); type('Second draft'); change('fr');
    expect(page.root.findByType('blockquote').children.join('')).toBe(module.text.fr);
    expect(saved()).toMatchObject({ conversationId: first.conversationId, sessionId: first.sessionId, firstResponse: 'First draft', activeAnswerDraft: 'Second draft' });
    act(() => page.unmount()); mount();
    expect(page.root.findByType('textarea').props.value).toBe('Second draft');
    await submit();
    expect(page.root.findAllByType('textarea')).toHaveLength(0);
    expect(page.root.findByProps({ className: 'thinkingLabelLayer' }).findAllByType('span')).toHaveLength(4);
    expect(requests.map(request => request.readingModuleId)).toEqual([module.id, module.id]);
    expect(requests.map(request => request.language)).toEqual(['es','fr']);
    expect(requests[1]).toMatchObject({ firstUserAnswer: 'First draft', secondUserAnswer: 'Second draft', ageBand: '13_17' });
    expect(readingProgress(localStorage, module, 'verified-user', '13_17', 'en')).toBe('complete');
    expect(page.root.findAllByType('a').some(link => link.props.href.endsWith(`lesson=${reading.modules[1].id}`))).toBe(true);
    act(() => page.unmount()); mount(); change('en');
    expect(saved().completed).toBe(true); expect(page.root.findAllByType('textarea')).toHaveLength(0);
  });
  it('isolates progress across modules, signed-in identities, and age groups', () => {
    setup(); mount(); type('Saved reading thought');
    expect(readingProgress(localStorage, module, 'verified-user', '13_17', 'fr')).toBe('saved');
    expect(readingProgress(localStorage, module, 'stale-local-user', '13_17', 'fr')).toBe('untouched');
    expect(readingProgress(localStorage, module, 'verified-user', '18_plus', 'fr')).toBe('untouched');
    act(() => page.unmount()); mount(reading.modules[1].id);
    expect(page.root.findByType('textarea').props.value).toBe(''); type('Different reading');
    act(() => page.unmount()); mount(); expect(page.root.findByType('textarea').props.value).toBe('Saved reading thought');
  });
});

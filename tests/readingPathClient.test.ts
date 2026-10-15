import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import ReadingPathClient from '../components/ReadingPathClient';
import { thinkingPaths, getPreviousReadingModules } from '../lib/thinkingPaths';
import { readingProgress } from '../lib/readingProgress';
vi.mock('next/link', () => ({ default: 'a' }));
vi.mock('../lib/telemetry', () => ({ createTelemetryEvent: () => ({}), trackEvent() {} }));
let page: ReactTestRenderer;
let storage: Map<string, string>;
let requests: any[];
const path = thinkingPaths[0];
const reading = path.readingPaths[0];
const module = reading.modules[0];
const previousModules = getPreviousReadingModules(path.slug, reading.slug);
function mount(id = module.id, selected = reading) { act(() => { page = create(createElement(ReadingPathClient, { pathSlug: path.slug, pathTitle: path.title, reading: selected, previousModules: selected === reading ? previousModules : [], moduleId: id, userId: 'verified-user' })); }); }
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
function saved(id = module.id) { return JSON.parse([...storage.entries()].find(([key]) => key.includes(id))![1]); }
afterEach(() => { if (page) act(() => page.unmount()); vi.unstubAllGlobals(); });
describe('Reading Path journey', () => {
  it('restores an earlier reading’s two drafts across languages without transferring answers or completion to its replacement', async () => {
    setup();
    const old = previousModules.find(item => item.id === 'reading-power-ship-and-expertise')!;
    const replacement = reading.modules.find(item => item.id === 'reading-xenophon-cyrus-supplies')!;
    mount(old.id); type('Original first answer'); await submit(); type('Original second draft');
    const original = saved(old.id); change('es');
    act(() => page.unmount()); mount(old.id);
    expect(page.root.findByType('textarea').props.value).toBe('Original second draft');
    expect(saved(old.id)).toMatchObject({ sessionId: original.sessionId, conversationId: original.conversationId, firstResponse: 'Original first answer' });
    expect(page.root.findByType('aside').findByType('ol').findAllByType('li')).toHaveLength(10);
    expect(page.root.findByProps({ 'data-reading-passage': old.id }).findAllByType('p').map(p => p.children.join('')).join('\n\n')).toBe(old.text.es);
    act(() => page.unmount()); mount(replacement.id);
    expect(page.root.findByType('textarea').props.value).toBe(''); type('A new reading’s draft');
    expect(saved(replacement.id).sessionId).not.toBe(original.sessionId);
    act(() => page.unmount()); mount(old.id); change('fr');
    expect(page.root.findByType('textarea').props.value).toBe('Original second draft'); await submit();
    expect(requests.map(request => request.readingModuleId)).toEqual([old.id, old.id]);
    expect(requests[1].language).toBe('fr');
    expect(readingProgress(localStorage, old, 'verified-user', '13_17', 'en')).toBe('complete');
    expect(readingProgress(localStorage, replacement, 'verified-user', '13_17', 'en')).toBe('saved');
    expect(page.root.findAllByType('textarea')).toHaveLength(0);
    expect(page.root.findByProps({ className: 'thinkingLabelLayer' }).findAllByType('span')).toHaveLength(4);
    expect(page.root.findAllByType('a').some(link => link.props.href?.endsWith(`lesson=${reading.modules[0].id}`))).toBe(true);
  });
  it('keeps one shared header and places the four-step session beside the same reading progress list', () => {
    setup(); mount();
    expect(page.root.findAllByType('header')).toHaveLength(1);
    expect(page.root.findAllByType('main')).toHaveLength(1);
    expect(page.root.findAllByType('h1')).toHaveLength(1);
    expect(page.root.findAllByType('select')).toHaveLength(1);
    expect(page.root.findAllByProps({ className: 'lessonQuestionList' })).toHaveLength(0);
    const readingContent = page.root.findByType('article').parent!;
    expect(readingContent.findByType('textarea')).toBeTruthy();
    expect(readingContent.findAllByType('header')).toHaveLength(0);
    const passage = page.root.findByProps({ 'data-reading-passage': module.id });
    expect(passage.findAllByType('p')).toHaveLength(module.text.en.split('\n\n').length);
    expect(page.root.findByProps({ href: '#reading-thinking' })).toBeTruthy();
  });

  it('switches passage and question language without losing either draft or creating a fifth step', async () => {
    setup(); mount(); type('First draft'); change('es');
    const first = saved();
    expect(page.root.findByProps({ 'data-reading-passage': module.id }).findAllByType('p').map(paragraph => paragraph.children.join('')).join('\n\n')).toBe(module.text.es);
    expect(page.root.findByType('textarea').props.value).toBe('First draft');
    expect(first.userId).toBe('verified-user'); expect(first.questionId).toBe(module.id);
    expect(first.originalQuestion).toBe(module.question.en);
    act(() => page.unmount()); mount();
    expect(page.root.findByType('textarea').props.value).toBe('First draft');
    await submit(); type('Second draft'); change('fr');
    expect(page.root.findByProps({ 'data-reading-passage': module.id }).findAllByType('p').map(paragraph => paragraph.children.join('')).join('\n\n')).toBe(module.text.fr);
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
  it('restores the tenth part independently after navigating back to the first part', () => {
    setup(); const last = reading.modules[9]; mount(last.id); type('Tenth part draft'); change('es');
    expect(page.root.findByProps({ 'data-reading-passage': last.id }).findAllByType('p').map(paragraph => paragraph.children.join('')).join('\n\n')).toBe(last.text.es);
    expect(readingProgress(localStorage, last, 'verified-user', '13_17', 'fr')).toBe('saved');
    act(() => page.unmount()); mount(); type('First part draft');
    act(() => page.unmount()); mount(last.id); change('fr');
    expect(page.root.findByType('textarea').props.value).toBe('Tenth part draft');
    expect(page.root.findAllByType('a').some(link => link.props.href?.endsWith(`lesson=${last.id}`))).toBe(true);
  });

  it('restores the same canonical reading across different curated paths without creating another session', () => {
    setup(); const curated = path.readingPaths[1];
    const shared = reading.modules.find(item => curated.modules.some(other => other.id === item.id))!;
    mount(shared.id); type('A shared reading draft'); const before = saved(shared.id);
    act(() => page.unmount()); mount(shared.id, curated); change('fr');
    expect(page.root.findByType('textarea').props.value).toBe('A shared reading draft');
    expect(saved(shared.id)).toMatchObject({sessionId:before.sessionId,conversationId:before.conversationId,originalQuestion:shared.question.en});
    expect(page.root.findByType('aside').findByType('ol').findAllByType('li')).toHaveLength(10);
    expect(page.root.findAllByType('a').some(a => a.props.href?.includes(`/${curated.slug}?lesson=`))).toBe(true);
    expect(readingProgress(localStorage,shared,'verified-user','13_17','es')).toBe('saved');
  });
  it('runs a newly added reading through both answers and preserves language and completion', async () => {
    setup(); const curated = path.readingPaths[1]; const added = curated.modules[0];
    mount(added.id, curated); type('Independent judgment needs reasons'); change('es');
    await submit(); type('I would also listen to warranted criticism'); change('fr'); await submit();
    expect(requests.map(request => request.readingModuleId)).toEqual([added.id,added.id]);
    expect(page.root.findAllByType('textarea')).toHaveLength(0);
    expect(page.root.findByProps({className:'thinkingLabelLayer'}).findAllByType('span')).toHaveLength(4);
    expect(readingProgress(localStorage,added,'verified-user','13_17','en')).toBe('complete');
    act(() => page.unmount()); mount(added.id,curated);
    expect(page.root.findAllByType('textarea')).toHaveLength(0);
  });

});

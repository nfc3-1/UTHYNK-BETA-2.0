import BetaFeedbackNotice from '../components/BetaFeedbackNotice';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import Lesson from '../components/LessonQuestionClient';
import { challengeSessionKey, createChallengeSession, legacyChallengeSessionKey } from '../lib/challengeSession';
import bank from '../data/questions.json';
import { getLessonQuestion } from '../lib/lessonQuestions';
import { lessonSelectionKey } from '../lib/lessonSessionStorage';
import { localizeQuestion, setStoredLanguageValue } from '../lib/reasoningI18n';
vi.mock('next/link', () => ({ default: 'a' }));
vi.mock('../lib/telemetry', () => ({ createTelemetryEvent: () => ({}), trackEvent() {} }));
let page: ReactTestRenderer;
let storage: Map<string,string>;
let requests: any[];
const questions = bank.Epistemology.slice(0, 3);
function mount(items = questions) { act(() => { page = create(createElement(Lesson, { category: 'Epistemology', questions: items })); }); }
function questionText() { return page.root.findByType('h2').children.join(''); }
function savedSession() {
  return JSON.parse([...storage.entries()].find(([key]) => key.startsWith('uthynk-challenge:v3:'))![1]);
}
function setup() {
  storage = new Map(); requests = [];
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) || null, setItem: (key: string,value: string) => storage.set(key,value), removeItem: (key: string) => storage.delete(key) });
  const events = new EventTarget();
  vi.stubGlobal('window', { localStorage, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events), setTimeout() {} });
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
    const original = savedSession();
    expect(questionText()).toBe(localizeQuestion('Epistemology', 0, questions[0], 'es'));
    expect(original.originalQuestion).toBe(questions[0]);
    expect(page.root.findByType('textarea').props.value).toBe('First typed draft');
    act(() => page.unmount()); mount();
    expect(page.root.findByType('select').props.value).toBe('es');
    expect(page.root.findByType('textarea').props.value).toBe('First typed draft');
    await submit(); type('Second spoken draft'); select('fr');
    expect(questionText()).toBe(localizeQuestion('Epistemology', 0, questions[0], 'fr'));
    expect(page.root.findByType('textarea').props.value).toBe('Second spoken draft');
    expect(savedSession()).toMatchObject({ sessionId: original.sessionId, conversationId: original.conversationId, questionId: original.questionId, firstResponse: 'First typed draft', step: 'secondary_question' });
    act(() => page.unmount()); mount();
    expect(page.root.findByType('textarea').props.value).toBe('Second spoken draft');
    expect(page.root.findAllByProps({ className: 'thinkingLabelLayer' })[0].findAllByType('span')).toHaveLength(4);
    await submit();
    expect(requests.map(request => request.language)).toEqual(['es','fr']);
    expect(requests[1].firstUserAnswer).toBe('First typed draft');
    expect(requests[1].secondUserAnswer).toBe('Second spoken draft');
    expect(requests[1].originalQuestion).toBe(requests[0].originalQuestion);
    expect(requests[0].displayedQuestion).toBe(localizeQuestion('Epistemology', 0, questions[0], 'es'));
    expect(requests[1].questionId).toBe(original.questionId);
    act(() => page.unmount()); mount();
    expect(page.root.findAllByType('textarea')).toHaveLength(0);
    expect(requests).toHaveLength(2);
    select('en');
    expect(questionText()).toBe(questions[0]);
    expect(savedSession().step).toBe('final_synthesis');
    expect(savedSession().secondResponse).toBe('Second spoken draft');
    expect(page.root.findAllByType(BetaFeedbackNotice)).toHaveLength(1);
    expect(page.root.findByType(BetaFeedbackNotice).props.language).toBe('en');
    expect(page.root.findAllByType('textarea')).toHaveLength(0);
  });
  it('keeps historical scores in saved data without presenting them as learning evidence', () => {
    setup();
    const record = getLessonQuestion('Epistemology', questions[0])!;
    const old = { ...createChallengeSession({ ageBand: '18_plus', category: 'Epistemology', language: 'en', questionId: record.id, questionIndex: 0, originalQuestion: questions[0], sessionId: 'old-s', conversationId: 'old-c' }), completed: true, step: 'final_synthesis', firstResponse: 'Original answer', secondResponse: 'Original follow-up', finalSynthesis: 'Original synthesis', perspectiveExpansion: 'A new angle.', secondaryQuestion: 'What else?', growthIndicators: ['Score 88', 'Evidence', 'XP +52'] };
    storage.set(challengeSessionKey(old), JSON.stringify(old)); mount();
    expect(JSON.stringify(page.toJSON())).not.toContain('Score 88');
    expect(JSON.stringify(page.toJSON())).toContain('Original synthesis');
    expect(JSON.parse(storage.get(challengeSessionKey(old))!).growthIndicators).toContain('Score 88');
    expect(page.root.findAllByType('textarea')).toHaveLength(0);
    expect(requests).toHaveLength(0);
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
  it('restores the selected non-first question by ID even when the bank is reordered', () => {
    setup(); mount();
    act(() => page.root.findAllByProps({ className: 'lessonQuestion' })[0].props.onClick());
    type('Draft for question two');
    const before = savedSession();
    select('fr');
    act(() => page.unmount()); mount([...questions].reverse());
    expect(questionText()).toBe(localizeQuestion('Epistemology', 1, questions[1], 'fr'));
    expect(page.root.findByType('textarea').props.value).toBe('Draft for question two');
    expect(savedSession()).toMatchObject({ questionId: before.questionId, sessionId: before.sessionId, conversationId: before.conversationId });
    expect(requests).toHaveLength(0);
  });
  it.each(['under_13', '13_17', '18_plus'])('shows the actual scenario in every language for %s', ageBand => {
    setup(); storage.set('uthynk-profile', JSON.stringify({ age_band: ageBand })); mount();
    for (const language of ['en', 'es', 'fr'] as const) {
      select(language);
      expect(questionText()).toBe(localizeQuestion('Epistemology', 0, questions[0], language));
      expect(page.root.findAllByProps({ className: 'lessonQuestion' }).map(button => button.children.join('')))
        .toEqual(questions.slice(1).map((source, index) => localizeQuestion('Epistemology', index + 1, source, language)));
    }
  });
  it('reacts to the global language preference event without discarding answers or restarting', () => {
    setup(); mount(); type('Keep this answer'); const before = savedSession();
    act(() => setStoredLanguageValue('es'));
    expect(questionText()).toBe(localizeQuestion('Epistemology', 0, questions[0], 'es'));
    expect(page.root.findByType('textarea').props.value).toBe('Keep this answer');
    expect(savedSession()).toMatchObject({ sessionId: before.sessionId, conversationId: before.conversationId });
    storage.set('uthynk-language', 'fr');
    const event = new Event('storage'); Object.defineProperty(event, 'key', { value: 'uthynk-language' });
    act(() => { window.dispatchEvent(event); });
    expect(questionText()).toBe(localizeQuestion('Epistemology', 0, questions[0], 'fr'));
    expect(page.root.findByType('textarea').props.value).toBe('Keep this answer');
    expect(requests).toHaveLength(0);
  });
  it('keeps a global language change made while a reasoning response is pending', async () => {
    setup(); mount(); type('My position');
    let resolve: (response: Response) => void;
    vi.stubGlobal('fetch', () => new Promise<Response>(done => { resolve = done; }));
    let pending: Promise<void>;
    act(() => { pending = page.root.findByProps({ className: 'btn btnPrimary' }).props.onClick(); });
    act(() => setStoredLanguageValue('fr'));
    await act(async () => {
      resolve(Response.json({ perspectiveExpansion: 'Another angle.', secondaryQuestion: 'What would you verify?' }));
      await pending;
    });
    expect(savedSession()).toMatchObject({ language: 'fr', firstResponse: 'My position', step: 'secondary_question' });
    expect(questionText()).toBe(localizeQuestion('Epistemology', 0, questions[0], 'fr'));
  });
  it('migrates an old v3 index identity without losing the original question snapshot', () => {
    setup(); storage.set('uthynk-language', 'fr');
    const record = getLessonQuestion('Epistemology', questions[1])!;
    const old = { ...createChallengeSession({ ageBand: '18_plus', category: 'Epistemology', language: 'es', questionId: 'Epistemology-1', questionIndex: 1, originalQuestion: 'A historical question snapshot', sessionId: 'old-s', conversationId: 'old-c' }), activeAnswerDraft: 'Old draft' };
    storage.set(lessonSelectionKey(old), record.id);
    storage.set(challengeSessionKey(old), JSON.stringify(old)); mount();
    expect(page.root.findByType('textarea').props.value).toBe('Old draft');
    const migrated = JSON.parse(storage.get(challengeSessionKey({ ...old, questionId: record.id }))!);
    expect(migrated).toMatchObject({ questionId: record.id, originalQuestion: old.originalQuestion, language: 'fr', sessionId: 'old-s', conversationId: 'old-c' });
    expect(questionText()).toBe(record.translations.fr!.text);
  });
  it('recovers a non-first legacy session even before a selection pointer exists', () => {
    setup(); storage.set('uthynk-language', 'es');
    const old = { ...createChallengeSession({ ageBand: '18_plus', category: 'Epistemology', language: 'fr', questionId: 'Epistemology-2', questionIndex: 2, originalQuestion: questions[2], sessionId: 'legacy-s', conversationId: 'legacy-c' }), activeAnswerDraft: 'Legacy third draft' };
    storage.set(legacyChallengeSessionKey(old), JSON.stringify(old)); mount();
    expect(questionText()).toBe(localizeQuestion('Epistemology', 2, questions[2], 'es'));
    expect(page.root.findByType('textarea').props.value).toBe('Legacy third draft');
    expect(storage.get(lessonSelectionKey(old))).toBe(getLessonQuestion('Epistemology', questions[2])!.id);
  });
  it('persists voice drafts for the current question and ignores retired recognizers', () => {
    setup(); const recognizers: any[] = [];
    (window as any).SpeechRecognition = class {
      constructor() { recognizers.push(this); }
      stop() {}
    };
    mount();
    act(() => page.root.findAllByProps({ className: 'lessonQuestion' })[0].props.onClick());
    act(() => recognizers[0].onresult({ results: [[{ transcript: 'Spoken answer for question two' }]] }));
    expect(savedSession().questionId).toBe(getLessonQuestion('Epistemology', questions[1])!.id);
    select('es');
    act(() => recognizers[0].onresult({ results: [[{ transcript: 'Stale voice result' }]] }));
    expect(page.root.findByType('textarea').props.value).toBe('Spoken answer for question two');
    act(() => page.unmount()); mount();
    expect(page.root.findByType('textarea').props.value).toBe('Spoken answer for question two');
    expect(questionText()).toBe(localizeQuestion('Epistemology', 1, questions[1], 'es'));
  });
  it('retains a failed submission through language changes and refresh', async () => {
    setup(); mount(); type('Answer to retry'); const before = savedSession();
    vi.stubGlobal('fetch', async () => Response.json({ error: 'Try again' }, { status: 503 }));
    await submit(); select('fr'); act(() => page.unmount()); mount();
    expect(page.root.findByType('textarea').props.value).toBe('Answer to retry');
    expect(savedSession()).toMatchObject({ sessionId: before.sessionId, conversationId: before.conversationId, step: 'main_question' });
  });
  it('can watch, dismiss and reopen the guide without changing a challenge draft', () => {
    setup(); mount(); type('My own answer'); const before = savedSession();
    const next = page.root.findAllByType('button').find(button => button.children.join('') === 'Next step')!;
    act(() => next.props.onClick());
    const toggle = () => page.root.findAllByType('button').find(button => typeof button.props['aria-expanded'] === 'boolean')!;
    act(() => toggle().props.onClick()); act(() => toggle().props.onClick());
    expect(page.root.findByType('textarea').props.value).toBe('My own answer');
    expect(savedSession()).toEqual(before);
    expect(requests).toHaveLength(0);
  });
  it('does not expose one user or age band\'s answers to another', () => {
    setup(); storage.set('uthynk-profile', JSON.stringify({ id: 'user-a', age_band: '13_17' })); mount(); type('Private draft');
    act(() => page.unmount()); storage.set('uthynk-profile', JSON.stringify({ id: 'user-b', age_band: '13_17' })); mount();
    expect(page.root.findByType('textarea').props.value).toBe('');
    act(() => page.unmount()); storage.set('uthynk-profile', JSON.stringify({ id: 'user-a', age_band: '18_plus' })); mount();
    expect(page.root.findByType('textarea').props.value).toBe('');
    act(() => page.unmount()); storage.set('uthynk-profile', JSON.stringify({ id: 'user-a', age_band: '13_17' })); mount();
    expect(page.root.findByType('textarea').props.value).toBe('Private draft');
  });
});

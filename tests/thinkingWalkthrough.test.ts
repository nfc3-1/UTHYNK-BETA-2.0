import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import ThinkingWalkthrough, { VISUAL_GUIDE_DISMISSED } from '../components/ThinkingWalkthrough';

let page: ReactTestRenderer;
let storage: Map<string, string>;
function setup(reduce = false) {
  vi.useFakeTimers(); storage = new Map();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value) });
  vi.stubGlobal('window', { matchMedia: () => ({ matches: reduce, addEventListener() {}, removeEventListener() {} }) });
  vi.stubGlobal('document', { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} });
}
function mount(language: 'en' | 'es' | 'fr' = 'en') { act(() => { page = create(createElement(ThinkingWalkthrough, { language })); }); }
function click(label: string) { act(() => page.root.findAllByType('button').find(button => button.children.join('') === label)!.props.onClick()); }
function step() { return page.root.findAll(node => node.props['data-step'] !== undefined)[0].props['data-step']; }
afterEach(() => { if (page) act(() => page.unmount()); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('illustrated thinking walkthrough', () => {
  it('plays exactly four scenes, stops at the synthesis and can replay', () => {
    setup(); mount(); expect(step()).toBe(0);
    for (const expected of [1, 2, 3]) { act(() => { vi.advanceTimersByTime(6000); }); expect(step()).toBe(expected); }
    act(() => { vi.advanceTimersByTime(60000); }); expect(step()).toBe(3);
    expect(page.root.findAllByProps({ 'aria-current': 'step' })).toHaveLength(1);
    click('Replay'); expect(step()).toBe(0);
    act(() => { vi.advanceTimersByTime(6000); }); expect(step()).toBe(1);
  });
  it('pauses, supports manual navigation, and keeps demo state separate from user progress', () => {
    setup(); storage.set('uthynk-challenge:v3:guest:test', 'User answer'); mount();
    click('Pause'); act(() => { vi.advanceTimersByTime(12000); }); expect(step()).toBe(0);
    click('Next step'); expect(step()).toBe(1); click('Previous step'); expect(step()).toBe(0);
    expect(page.root.findAllByType('textarea')).toHaveLength(0);
    click('Start thinking');
    expect(storage.get(VISUAL_GUIDE_DISMISSED)).toBe('true');
    expect(storage.get('uthynk-challenge:v3:guest:test')).toBe('User answer');
    act(() => page.unmount()); mount(); expect(page.root.findAll(node => node.props['data-step'] !== undefined)).toHaveLength(0);
    click('Watch an example'); expect(step()).toBe(0);
  });
  it('does not autoplay for reduced motion and still allows all four steps', () => {
    setup(true); mount(); act(() => { vi.advanceTimersByTime(30000); }); expect(step()).toBe(0);
    for (const expected of [1, 2, 3]) { click('Next step'); expect(step()).toBe(expected); }
  });
  it.each([
    ['en', 'Give your answer', 'Should phones be allowed during class?'],
    ['es', 'Da tu respuesta', '¿Se deberían permitir los teléfonos durante la clase?'],
    ['fr', 'Donne ta réponse', 'Devrait-on autoriser les téléphones pendant les cours ?'],
  ] as const)('uses %s for the instructions and illustrated example', (language, heading, question) => {
    setup(); mount(language);
    expect(page.root.findByType('h3').children.join('')).toBe(heading);
    expect(JSON.stringify(page.toJSON())).toContain(question);
    expect(page.root.findAllByType('svg')).toHaveLength(1);
    expect(page.root.findByType('svg').props['aria-hidden']).toBe('true');
  });
});

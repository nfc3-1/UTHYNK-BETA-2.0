import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { LessonDiscoveryBanner, LessonLibraryGuide } from '../components/LessonDiscovery';
import LessonLanguageShell from '../components/LessonLanguageShell';
import { questionBank, slugifyCategory } from '../lib/questionBank';
import type { Language } from '../lib/reasoningI18n';

vi.mock('next/link', () => ({ default: 'a' }));
vi.mock('../lib/telemetry', () => ({ createTelemetryEvent: () => ({}), trackEvent() {} }));
let page: ReactTestRenderer;
const categories = Object.entries(questionBank).map(([category, questions]) => ({ category, count: questions.length, description: 'Practice with a question.' }));
afterEach(() => { if (page) act(() => page.unmount()); vi.unstubAllGlobals(); });

describe('finding lessons beyond the daily challenge', () => {
  it.each([
    ['en', 'Explore all lessons', 'daily challenge'],
    ['es', 'Explorar todas las lecciones', 'desafío diario'],
    ['fr', 'Explorer toutes les leçons', 'défi du jour'],
  ] as const)('shows a persistent %s route into the full library', (language, label, daily) => {
    act(() => { page = create(createElement(LessonDiscoveryBanner, { language, lessonCount: Object.values(questionBank).reduce((sum, questions) => sum + questions.length, 0), categoryCount: categories.length })); });
    const link = page.root.findByType('a');
    expect(link.props.href).toBe('/lessons');
    expect(link.children[0]).toBe(label);
    const content = JSON.stringify(page.toJSON());
    expect(content).toContain(daily);
    expect(content).toContain(String(Object.values(questionBank).reduce((sum, questions) => sum + questions.length, 0)));
    expect(content).toContain(String(categories.length));
    expect(page.root.findAllByType('button')).toHaveLength(0);
  });

  it.each(['en', 'es', 'fr'] as Language[])('explains category → question → thinking session in %s with a real category link', language => {
    act(() => { page = create(createElement(LessonLibraryGuide, { language, categories })); });
    expect(page.root.findAllByType('li')).toHaveLength(3);
    expect(page.root.findAllByType('svg')).toHaveLength(3);
    expect(page.root.findByType('a').props.href).toBe(`/lessons/${slugifyCategory(categories[0].category)}`);
    expect(page.root.findAllByType('button')).toHaveLength(0);
  });

  it('keeps all category choices visible alongside the guide, before and after a language change', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value) });
    vi.stubGlobal('window', { localStorage, dispatchEvent() {}, addEventListener() {}, removeEventListener() {} });
    vi.stubGlobal('fetch', async () => Response.json({}));
    act(() => { page = create(createElement(LessonLanguageShell, { categories })); });
    expect(page.root.findAllByProps({ className: 'card lessonCategoryCard' })).toHaveLength(categories.length);
    const paths = page.root.findAllByProps({ className: 'card lessonCategoryCard' }).map(card => card.props.href);
    act(() => page.root.findByType('select').props.onChange({ target: { value: 'es' } }));
    expect(page.root.findAllByProps({ className: 'card lessonCategoryCard' }).map(card => card.props.href)).toEqual(paths);
    expect(JSON.stringify(page.toJSON())).toContain('Cómo elegir una lección');
  });
});

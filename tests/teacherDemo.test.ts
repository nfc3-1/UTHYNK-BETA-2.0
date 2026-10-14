import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import TeacherDashboard from '../components/TeacherDashboard';

let page: ReactTestRenderer;
afterEach(() => { if (page) act(() => page.unmount()); vi.unstubAllGlobals(); });
const bank = { Epistemology: ['Which source would you trust?'] };
function button(text: string) { return page.root.findAllByType('button').find(node => node.children.join('') === text)!; }

describe('teacher demo boundaries', () => {
  it('labels restored data, generated results and local comments without losing demo records', () => {
    const saved = {
      classes: [{ id: 'class-1', name: 'Fictional class', classCode: 'UTH-DEMO', createdAt: '2026-10-14T00:00:00Z' }],
      assignments: [{ id: 'assignment-1', classId: 'class-1', category: 'Epistemology', question: bank.Epistemology[0], createdAt: '2026-10-14T00:00:00Z' }],
      comments: [],
    };
    const storage = new Map([['uthynk-teacher-v1', JSON.stringify(saved)]]);
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value) });
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    act(() => { page = create(createElement(TeacherDashboard, { questionBank: bank })); });
    const text = JSON.stringify(page.toJSON());
    expect(text).toContain('Fictional students and sample results');
    expect(text).toContain('Nothing is sent to students');
    expect(text).toContain('It cannot enroll students');
    expect(text).toContain('Sample Student Progress');
    expect(page.root.findByProps({ 'aria-label': 'Fictional student results' }).findAllByProps({ className: 'teacherProgressRow' })).toHaveLength(4);
    for (const row of page.root.findAllByProps({ className: 'teacherProgressRow' })) expect(row.findByType('strong').children.join('')).toContain('(demo)');
    act(() => page.root.findByType('textarea').props.onChange({ target: { value: 'Practice feedback only' } }));
    act(() => button('Save Demo Comment').props.onClick());
    const persisted = JSON.parse(storage.get('uthynk-teacher-v1')!);
    expect(persisted.classes).toEqual(saved.classes);
    expect(persisted.assignments).toEqual(saved.assignments);
    expect(persisted.comments[0].comment).toBe('Practice feedback only');
    expect(fetch).not.toHaveBeenCalled();
    act(() => page.unmount());
    act(() => { page = create(createElement(TeacherDashboard, { questionBank: bank })); });
    expect(JSON.stringify(page.toJSON())).toContain('Practice feedback only');
    expect(page.root.findAllByProps({ 'aria-label': 'Teacher demo notice' })).toHaveLength(1);
  });
});

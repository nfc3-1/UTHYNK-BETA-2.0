import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppNavigation from '../components/AppNavigation';
const state = vi.hoisted(() => ({ access: {} as any }));
vi.mock('next/link', () => ({ default: (p: any) => <a {...p} /> }));
beforeEach(() => {
  state.access = { userId: 'staff', role: 'admin' };
  vi.stubGlobal('fetch', async () => Response.json(state.access));
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn(), localStorage: { getItem: () => 'en' } });
});
afterEach(() => vi.unstubAllGlobals());
async function mount(language: 'en'|'es'|'fr' = 'en', props = {}) {
  let ui: ReturnType<typeof create>;
  await act(async () => { ui = create(<AppNavigation language={language} {...props} />); });
  return ui!;
}
describe('staff-only navigation disclosure', () => {
  it.each(['en','es','fr'] as const)('keeps every public destination outside the staff tools in %s', async language => {
    const ui = await mount(language);
    const details = ui.root.findByType('details');
    expect(details.findAllByType('a').map(a => a.props.href)).toEqual(['/teacher','/school','/studio','/admin/access']);
    const publicLinks = ui.root.findAllByType('a').filter(a => !details.findAllByType('a').includes(a)).map(a => a.props.href);
    expect(publicLinks).toEqual(expect.arrayContaining(['/','/daily','/lessons','/thinking-paths','/classroom','/profile','/store','/leaderboard','/feedback','/?guide=1','/about']));
    const summary = details.findByType('summary');
    expect(summary.props['aria-label']).toBeTruthy();
    expect(summary.findAllByType('svg')).toHaveLength(1);
    expect(summary.findAllByType('span')).toHaveLength(0);
    act(() => ui.unmount());
  });
  it.each([{}, {userId:'learner',role:'user'}, {role:'admin'}])('hides staff disclosure without verified staff access %j', async access => {
    state.access = access;
    const ui = await mount();
    expect(ui.root.findAllByType('details')).toHaveLength(0);
    expect(ui.root.findAllByType('a').filter(a => a.props.href === '/classroom')).toHaveLength(1);
    act(() => ui.unmount());
  });
  it.each([
    [{userId:'t',schoolTeacher:true}, ['/teacher']],
    [{userId:'s',schoolAdmin:true}, ['/school']],
    [{userId:'studio',sections:['studio']}, ['/studio']],
  ])('shows only assigned staff tools %j', async (access, expected) => {
    state.access = access;
    const ui = await mount();
    expect(ui.root.findByType('details').findAllByType('a').map(a => a.props.href)).toEqual(expected);
    act(() => ui.unmount());
  });
  it('reopens help without navigating or closing an active answer', async () => {
    const help = vi.fn();
    const ui = await mount('en', {onHelp:help});
    act(() => ui.root.findByType('button').props.onClick());
    expect(help).toHaveBeenCalledOnce();
    act(() => ui.unmount());
  });
  it('closes on Escape and returns focus to the icon', async () => {
    const removeAttribute = vi.fn(); const focus = vi.fn();
    let ui: ReturnType<typeof create>;
    await act(async () => { ui = create(<AppNavigation language="en" />, {createNodeMock: el => el.type === 'details' ? {removeAttribute} : el.type === 'summary' ? {focus} : null}); });
    act(() => ui!.root.findByType('details').props.onKeyDown({key:'Escape'}));
    expect(removeAttribute).toHaveBeenCalledWith('open'); expect(focus).toHaveBeenCalledOnce();
    act(() => ui!.unmount());
  });
});

import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppNavigation from '../components/AppNavigation';
import BrandHome from '../components/BrandHome';
const state = vi.hoisted(() => ({ access: {} as any }));
vi.mock('next/link', () => ({ default: (p: any) => <a {...p} /> }));
beforeEach(() => {
  state.access = { userId: 'staff', role: 'admin' };
  vi.stubGlobal('fetch', async () => Response.json(state.access));
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn(), localStorage: { getItem: () => 'en' } });
});
afterEach(() => vi.unstubAllGlobals());
async function mount(language: 'en'|'es'|'fr' = 'en') {
  let ui: ReturnType<typeof create>;
  await act(async () => { ui = create(<AppNavigation language={language} />); });
  return ui!;
}
const links = (node: any) => node.findAllByType('a').map((a: any) => a.props.href);
const staffMenu = (ui: ReturnType<typeof create>) => ui.root.findAllByType('details').find(d => links(d).includes('/teacher') || links(d).includes('/school') || links(d).includes('/studio'));
describe('compact public navigation and staff tools', () => {
  it.each(['en','es','fr'] as const)('shows every public destination directly and keeps only staff in the hamburger in %s', async language => {
    const ui = await mount(language);
    const staff = staffMenu(ui)!;
    expect(links(staff)).toEqual(['/teacher','/school','/studio','/admin/access']);
    expect(ui.root.findAllByType('details')).toHaveLength(1);
    const primary = ui.root.findByProps({className:'primaryNavigationLinks'});
    expect(primary.findAllByType('details')).toHaveLength(0);
    expect(links(primary)).toEqual(['/daily','/lessons','/thinking-paths','/classroom','/leaderboard','/feedback','/store']);
    expect(links(ui.root)).not.toContain('/');
    expect(links(ui.root)).not.toContain('/?guide=1');
    expect(links(ui.root)).not.toContain('/about');
    expect(links(ui.root)).not.toContain('/login?mode=login&force=1');
    expect(links(ui.root.findByProps({className:'accountNavigation'}))).toEqual(['/profile']);
    expect(staff.findByType('summary').findAllByType('svg')).toHaveLength(1);
    expect(staff.findByType('summary').findAllByType('span')).toHaveLength(0);
    act(() => ui.unmount());
  });
  it.each([{}, {userId:null,role:'user'}, {role:'admin'}])('keeps all public links visible and hides the hamburger without a verified staff identity %j', async access => {
    state.access = access;
    const ui = await mount();
    expect(staffMenu(ui)).toBeUndefined();
    expect(ui.root.findAllByType('details')).toHaveLength(0);
    expect(links(ui.root)).toContain('/classroom');
    expect(links(ui.root)).toContain('/login?mode=login&force=1');
    act(() => ui.unmount());
  });
  it.each([
    [{userId:'t',schoolTeacher:true}, ['/teacher']],
    [{userId:'s',schoolAdmin:true}, ['/school']],
    [{userId:'studio',sections:['studio']}, ['/studio']],
  ])('shows only assigned staff tools %j', async (access, expected) => {
    state.access = access;
    const ui = await mount();
    expect(links(staffMenu(ui)!)).toEqual(expected);
    act(() => ui.unmount());
  });
  it('makes the logo the home link', () => {
    const ui=create(<BrandHome language="fr" />);
    expect(ui.root.findByType('a').props.href).toBe('/');
    expect(ui.root.findByType('a').props['aria-label']).toBe('Accueil UThynk');
    expect(ui.root.findByType('img').props.alt).toBe('');
  });
  it('closes a dropdown with Escape and restores focus', async () => {
    const ui=await mount();const removeAttribute=vi.fn();const focus=vi.fn();const stopPropagation=vi.fn();
    const details=ui.root.findAllByType('details')[0];
    act(()=>details.props.onKeyDown({key:'Escape',currentTarget:{removeAttribute,querySelector:()=>({focus})},stopPropagation}));
    expect(removeAttribute).toHaveBeenCalledWith('open');expect(focus).toHaveBeenCalledOnce();
    act(()=>ui.unmount());
  });
  it('closes staff tools when a destination is selected', async () => {
    const ui=await mount(); const removeAttribute=vi.fn();
    const panel=staffMenu(ui)!.findByProps({className:'secondaryNavigationLinks'});
    act(()=>panel.props.onClick({target:{closest:()=>({})},currentTarget:{closest:()=>({removeAttribute})}}));
    expect(removeAttribute).toHaveBeenCalledWith('open');
    act(()=>ui.unmount());
  });
});

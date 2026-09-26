import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import RestrictedNavLinks from '../components/RestrictedNavLinks';
vi.mock('next/link', () => ({ default: 'a' }));
let page: ReactTestRenderer;
afterEach(() => { if (page) act(() => page.unmount()); vi.unstubAllGlobals(); });
describe('permission-aware navigation', () => {
  for (const role of ['user','teacher','admin']) it(`renders only permitted links for ${role}`, async () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => 'es' }, addEventListener() {}, removeEventListener() {} });
    vi.stubGlobal('fetch', async () => Response.json({ role, userId: 'profile', sections: [] }));
    await act(async () => { page = create(createElement(RestrictedNavLinks)); });
    const hrefs = page.root.findAllByType('a').map(node => node.props.href);
    expect(hrefs.includes('/teacher')).toBe(role !== 'user');
    expect(hrefs.includes('/admin/access')).toBe(role === 'admin');
    expect(hrefs.includes('/studio')).toBe(role === 'admin');
  });
});

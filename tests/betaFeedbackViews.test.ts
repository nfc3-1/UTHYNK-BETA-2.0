import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import Profile from '../app/profile/page';
import Leaderboard from '../app/leaderboard/page';
import BetaFeedbackNotice from '../components/BetaFeedbackNotice';
import { betaFeedbackCopy } from '../lib/betaAssessment';
vi.mock('next/link', () => ({ default: 'a' }));
vi.mock('../components/RestrictedNavLinks', () => ({ default: () => null }));
vi.mock('../lib/telemetry', () => ({ createTelemetryEvent: () => ({}), trackEvent() {} }));
let page: ReactTestRenderer;
afterEach(() => { if (page) act(() => page.unmount()); vi.unstubAllGlobals(); });

describe('honest beta learner summaries', () => {
  for (const language of ['en', 'es', 'fr'] as const) it(`shares participation facts with the caveat in ${language}, without fabricated ability scores`, async () => {
    const profile = { xp: 240, streak: 3, rank: 'Observer', reasoning_score: 91, primary_trait: 'Evidence Discipline' };
    const stored = new Map([['uthynk-language', language], ['uthynk-profile', JSON.stringify(profile)]]);
    vi.stubGlobal('localStorage', { getItem: (key: string) => stored.get(key) || null });
    vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} });
    vi.stubGlobal('fetch', async () => Response.json({ profile, sessions: [
      { id: 'old-session', trait_detected: 'Evidence Discipline', reasoning_score: 94, challenge_category: 'Epistemology' },
    ] }));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await act(async () => { page = create(createElement(Profile)); });
    expect(page.root.findAllByType(BetaFeedbackNotice)).toHaveLength(1);
    const text = JSON.stringify(page.toJSON());
    expect(text).toContain(betaFeedbackCopy[language].notice);
    expect(text).not.toContain('Growth Trend');
    const metrics = page.root.findByProps({ className: 'snapshotScoreGrid' }).findAllByType('strong');
    expect(metrics.map(node => node.children.join(''))).toEqual(['240', '3', '1']);
    const copy = page.root.findAllByType('button').find(node => node.props.onClick?.name === 'copySnapshot')!;
    await act(async () => { await copy.props.onClick(); });
    const snapshot = writeText.mock.calls[0][0];
    expect(snapshot).toContain(betaFeedbackCopy[language].notice);
    expect(snapshot).toContain('XP: 240');
    expect(snapshot).not.toMatch(/91|94|Logic:|Strategy:|Evidence:/);
    expect(snapshot).toContain('https://www.uthynk.com');
    expect(stored.get('uthynk-profile')).toBe(JSON.stringify(profile));
  });
  it('identifies the static participation board as fictional', () => {
    act(() => { page = create(createElement(Leaderboard)); });
    const text = JSON.stringify(page.toJSON());
    expect(text).toContain('Fictional profiles');
    expect(text).toContain('not real users');
    expect(text).not.toContain('Cognitive Rankings');
    expect(text).not.toContain('elite long-term reasoning performance');
  });
});

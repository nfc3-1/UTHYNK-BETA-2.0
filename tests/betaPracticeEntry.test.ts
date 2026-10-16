import { createElement } from 'react';
import { create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import BetaPracticeEntry from '../components/BetaPracticeEntry';
vi.mock('next/link', () => ({ default: 'a' }));

describe('free beta opening choices', () => {
  it.each(['en','es','fr'] as const)('shows both real destinations together without a disclosure in %s', language => {
    const ui=create(createElement(BetaPracticeEntry,{language}));
    expect(ui.root.findAllByType('a').map(link=>link.props.href)).toEqual(['/lessons','/thinking-paths']);
    expect(ui.root.findAllByType('article')).toHaveLength(2);
    expect(ui.root.findAllByType('details')).toHaveLength(0);
    expect(ui.root.findAllByType('button')).toHaveLength(0);
    expect(JSON.stringify(ui.toJSON())).not.toContain('/login');
    ui.unmount();
  });
  it('places both choices before the walkthrough and daily experience', () => {
    const home=readFileSync(new URL('../app/reasoning/page.tsx',import.meta.url),'utf8');
    const choices=home.indexOf('<BetaPracticeEntry');
    expect(choices).toBeGreaterThan(0);
    expect(choices).toBeLessThan(home.indexOf('<ThinkingWalkthrough'));
    expect(choices).toBeLessThan(home.indexOf('<ReasoningExperience'));
  });
});

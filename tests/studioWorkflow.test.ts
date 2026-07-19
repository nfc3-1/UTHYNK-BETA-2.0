import { describe, expect, it } from 'vitest';
import { assertStudioStatusTransition } from '../features/studio/services/workflowService';

describe('Studio workflow transitions', () => {
  it('allows the approved scheduling path', () => {
    expect(assertStudioStatusTransition('approved', 'scheduled', { approved: true })).toBe('scheduled');
  });

  it('prevents scheduling unapproved content', () => {
    expect(() => assertStudioStatusTransition('review', 'scheduled', { approved: false })).toThrow(
      'Cannot schedule content before approval.'
    );
  });

  it('rejects invalid jumps to published', () => {
    expect(() => assertStudioStatusTransition('draft', 'published', { approved: false })).toThrow(
      'Invalid Studio status transition'
    );
  });
});

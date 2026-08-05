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

  it('allows rejection and requested-changes paths from review', () => {
    expect(assertStudioStatusTransition('review', 'changes_requested', { approved: false })).toBe('changes_requested');
    expect(assertStudioStatusTransition('review', 'rejected', { approved: false })).toBe('rejected');
  });

  it('blocks publishing states when required media is missing', () => {
    expect(() => assertStudioStatusTransition('scheduled', 'ready_to_publish', {
      approved: true,
      hasRequiredMedia: false,
    })).toThrow('Cannot schedule or publish content until required media is selected and approved.');
  });

  it('allows the manual publishing path after approval', () => {
    expect(assertStudioStatusTransition('scheduled', 'ready_to_publish', {
      approved: true,
      hasRequiredMedia: true,
    })).toBe('ready_to_publish');
    expect(assertStudioStatusTransition('ready_to_publish', 'published', {
      approved: true,
      hasRequiredMedia: true,
    })).toBe('published');
  });

  it('rejects publishing before approval', () => {
    expect(() => assertStudioStatusTransition('draft', 'published', { approved: false })).toThrow(
      'Cannot publish content before approval.'
    );
  });
});

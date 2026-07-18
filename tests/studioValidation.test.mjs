import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePlatformCore,
  normalizeScheduledDateCore,
  normalizeStatusCore,
} from '../features/studio/validation/studioCore.mjs';

test('normalizes legacy and future Studio platforms', () => {
  assert.equal(normalizePlatformCore('LinkedIn'), 'linkedin');
  assert.equal(normalizePlatformCore('Facebook Page'), 'facebook');
  assert.equal(normalizePlatformCore('Instagram Reel'), 'instagram');
  assert.equal(normalizePlatformCore('Threads'), 'threads');
  assert.equal(normalizePlatformCore('Twitter / X'), 'x');
  assert.equal(normalizePlatformCore('unknown'), 'linkedin');
});

test('normalizes Studio statuses including migration aliases', () => {
  assert.equal(normalizeStatusCore('idea'), 'draft');
  assert.equal(normalizeStatusCore('approval'), 'review');
  assert.equal(normalizeStatusCore('publishing'), 'publishing');
  assert.equal(normalizeStatusCore('retrying'), 'retrying');
  assert.equal(normalizeStatusCore('not-a-status'), 'draft');
});

test('keeps scheduled dates separate from time and timezone', () => {
  assert.equal(normalizeScheduledDateCore('2026-07-17T13:30:00Z'), '2026-07-17');
  assert.equal(normalizeScheduledDateCore(''), '');
});

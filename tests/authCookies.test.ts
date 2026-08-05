import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSessionCookieValue, parseSessionCookieValue } from '../lib/authCookies';

const sessionUser = {
  id: 'profile-id',
  auth_user_id: 'auth-id',
  email: 'nick@example.com',
  username: 'nick',
};

describe('auth cookie signing', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates and parses a valid signed session cookie', () => {
    vi.stubEnv('AUTH_COOKIE_SECRET', 'test-cookie-secret-with-more-than-32-characters');

    const value = createSessionCookieValue(sessionUser);

    expect(value).toContain('.');
    expect(parseSessionCookieValue(value)).toMatchObject(sessionUser);
  });

  it('rejects tampered signatures', () => {
    vi.stubEnv('AUTH_COOKIE_SECRET', 'test-cookie-secret-with-more-than-32-characters');

    const value = createSessionCookieValue(sessionUser);
    const tampered = `${value.slice(0, -3)}abc`;

    expect(parseSessionCookieValue(tampered)).toBeNull();
  });

  it('rejects malformed payloads', () => {
    vi.stubEnv('AUTH_COOKIE_SECRET', 'test-cookie-secret-with-more-than-32-characters');

    expect(parseSessionCookieValue('not-a-cookie')).toBeNull();
  });

  it('requires a production signing secret', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_COOKIE_SECRET', '');
    vi.stubEnv('COOKIE_SIGNING_SECRET', '');

    expect(() => createSessionCookieValue(sessionUser)).toThrow(
      'AUTH_COOKIE_SECRET or COOKIE_SIGNING_SECRET is required in production.'
    );
  });
});

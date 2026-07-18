import { describe, expect, it } from 'vitest';
import { validateServerEnv } from '../lib/serverEnv';

describe('server environment validation', () => {
  it('accepts a complete production configuration', () => {
    const env = validateServerEnv({
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      AUTH_COOKIE_SECRET: 'cookie-secret-with-more-than-32-characters',
      OPENAI_API_KEY: 'openai-key',
    });

    expect(env.supabaseUrl).toBe('https://example.supabase.co');
    expect(env.cookieSigningSecret).toContain('cookie-secret');
  });

  it('names missing production variables', () => {
    expect(() => validateServerEnv({ NODE_ENV: 'production' })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL.*SUPABASE_SERVICE_ROLE_KEY.*AUTH_COOKIE_SECRET or COOKIE_SIGNING_SECRET.*OPENAI_API_KEY/
    );
  });

  it('allows development-only fallbacks', () => {
    const env = validateServerEnv({ NODE_ENV: 'development' });

    expect(env.cookieSigningSecret).toBe('uthynk-local-dev-cookie-secret');
    expect(env.supabaseUrl).toContain('supabase.co');
  });
});

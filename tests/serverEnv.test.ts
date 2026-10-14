import { describe, expect, it } from 'vitest';
import { readServerEnv, validateServerEnv } from '../lib/serverEnv';

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
    expect(env.supabaseServiceRoleKey).toBe('service-role-key');
    expect(env.cookieSigningSecret).toContain('cookie-secret');
  });

  it('accepts the existing Vercel server-only Supabase variable names', () => {
    const env = validateServerEnv({
      NODE_ENV: 'production',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE: 'legacy-service-role-key',
      AUTH_COOKIE_SECRET: 'cookie-secret-with-more-than-32-characters',
      OPENAI_API_KEY: 'openai-key',
    });

    expect(env.supabaseUrl).toBe('https://example.supabase.co');
    expect(env.supabaseServiceRoleKey).toBe('legacy-service-role-key');
  });

  it('prefers canonical names when both Supabase configurations exist', () => {
    const env = readServerEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://canonical.supabase.co',
      SUPABASE_URL: 'https://legacy.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'canonical-key',
      SUPABASE_SERVICE_ROLE: 'legacy-key',
    });

    expect(env.supabaseUrl).toBe('https://canonical.supabase.co');
    expect(env.supabaseServiceRoleKey).toBe('canonical-key');
  });

  it('uses server aliases when canonical variables are blank', () => {
    const env = readServerEnv({
      NEXT_PUBLIC_SUPABASE_URL: ' ',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: '',
      SUPABASE_SERVICE_ROLE: 'legacy-key',
    });

    expect(env.supabaseUrl).toBe('https://example.supabase.co');
    expect(env.supabaseServiceRoleKey).toBe('legacy-key');
  });

  it('does not accept a publicly exposed service-role variable', () => {
    const env = readServerEnv({ NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'unsafe-public-key' });

    expect(env.supabaseServiceRoleKey).toBe('');
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

  it('can read production configuration without throwing during build-time imports', () => {
    const env = readServerEnv({ NODE_ENV: 'production' });

    expect(env.cookieSigningSecret).toBe('');
    expect(env.openaiApiKey).toBe(undefined);
    expect(env.supabaseUrl).toContain('supabase.co');
  });
});

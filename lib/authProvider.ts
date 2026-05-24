export type AuthProvider = 'supabase' | 'clerk' | 'auth0';

export function getConfiguredAuthProvider(): AuthProvider {
  const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER;

  if (provider === 'clerk') return 'clerk';
  if (provider === 'auth0') return 'auth0';

  return 'supabase';
}

export function isProductionAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_AUTH_PROVIDER);
}

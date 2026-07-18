type EnvSource = Record<string, string | undefined>;

export type ServerEnv = {
  nodeEnv: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  cookieSigningSecret: string;
  openaiApiKey?: string;
  appPublicUrl: string;
  studioEncryptionKey?: string;
  metaAppId?: string;
  metaAppSecret?: string;
  linkedinClientId?: string;
  linkedinClientSecret?: string;
  threadsClientId?: string;
  threadsClientSecret?: string;
  studioWebhookSecret?: string;
};

function getFirst(env: EnvSource, keys: string[]) {
  return keys.map((key) => env[key]).find((value) => Boolean(value && value.trim())) || '';
}

function requireValue(name: string, value: string, missing: string[]) {
  if (!value) missing.push(name);
  return value;
}

export function validateServerEnv(env: EnvSource = process.env): ServerEnv {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const missing: string[] = [];
  const supabaseUrl = getFirst(env, ['NEXT_PUBLIC_SUPABASE_URL']);
  const supabaseServiceRoleKey = getFirst(env, ['SUPABASE_SERVICE_ROLE_KEY']);
  const cookieSigningSecret = getFirst(env, ['AUTH_COOKIE_SECRET', 'COOKIE_SIGNING_SECRET']);
  const openaiApiKey = getFirst(env, ['OPENAI_API_KEY']);

  if (isProduction) {
    requireValue('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl, missing);
    requireValue('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey, missing);
    requireValue('AUTH_COOKIE_SECRET or COOKIE_SIGNING_SECRET', cookieSigningSecret, missing);
    requireValue('OPENAI_API_KEY', openaiApiKey, missing);
  }

  if (missing.length) {
    throw new Error(`Missing required server environment variable(s): ${missing.join(', ')}`);
  }

  return {
    nodeEnv,
    supabaseUrl: supabaseUrl || 'https://oxgogjxrrpqpvtpkxevv.supabase.co',
    supabaseServiceRoleKey,
    cookieSigningSecret: cookieSigningSecret || 'uthynk-local-dev-cookie-secret',
    openaiApiKey: openaiApiKey || undefined,
    appPublicUrl: getFirst(env, ['APP_PUBLIC_URL', 'NEXT_PUBLIC_APP_URL']) || 'https://uthynk-beta-2-0.vercel.app',
    studioEncryptionKey: getFirst(env, ['STUDIO_ENCRYPTION_KEY']) || undefined,
    metaAppId: getFirst(env, ['META_APP_ID']) || undefined,
    metaAppSecret: getFirst(env, ['META_APP_SECRET']) || undefined,
    linkedinClientId: getFirst(env, ['LINKEDIN_CLIENT_ID']) || undefined,
    linkedinClientSecret: getFirst(env, ['LINKEDIN_CLIENT_SECRET']) || undefined,
    threadsClientId: getFirst(env, ['THREADS_CLIENT_ID']) || undefined,
    threadsClientSecret: getFirst(env, ['THREADS_CLIENT_SECRET']) || undefined,
    studioWebhookSecret: getFirst(env, ['STUDIO_WEBHOOK_SECRET']) || undefined,
  };
}

export function getServerEnv() {
  return validateServerEnv();
}

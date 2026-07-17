type ServerEnv = {
  nodeEnv: string;
  authCookieSecret: string;
  studioAdminEmails: string;
  studioAdminUserIds: string;
};

let cachedEnv: ServerEnv | null = null;

function requireProductionSecret(name: string, value: string | undefined, minimumLength = 32) {
  if (process.env.NODE_ENV !== 'production') {
    return value || `uthynk-local-${name.toLowerCase()}-secret`;
  }

  if (!value || value.length < minimumLength) {
    throw new Error(
      `${name} must be configured in production and contain at least ${minimumLength} characters.`
    );
  }


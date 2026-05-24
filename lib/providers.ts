export const infrastructureProviders = {
  vectorDatabase: {
    development: 'in-memory',
    productionOptions: ['pgvector', 'pinecone', 'weaviate'],
  },
  distributedQueue: {
    development: 'local-memory',
    productionOptions: ['redis-bullmq', 'aws-sqs', 'kafka'],
  },
  realtime: {
    development: 'local-broadcast',
    productionOptions: ['supabase-realtime', 'ably', 'pusher'],
  },
  telemetry: {
    development: 'console',
    productionOptions: ['datadog', 'grafana', 'newrelic'],
  },
  auth: {
    development: 'cookie-session',
    productionOptions: ['supabase-auth', 'clerk', 'auth0'],
  },
};

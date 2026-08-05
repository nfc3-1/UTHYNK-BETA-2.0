# Studio Provider Setup

The code defines provider boundaries for LinkedIn, Facebook, Instagram, Threads, and future disabled channels. Real publishing remains disabled until external apps and credentials are configured.

## Required Environment Variables

- `META_APP_ID`
- `META_APP_SECRET`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `THREADS_CLIENT_ID`
- `THREADS_CLIENT_SECRET`
- `STUDIO_WEBHOOK_SECRET`
- `STUDIO_ENCRYPTION_KEY`

## Provider Requirements

Each provider adapter must implement:

- OAuth connection
- OAuth state validation
- callback handling
- disconnect/revoke
- token refresh where supported
- connection health
- publish
- metrics import

## Known Limitations

No real social publishing is claimed until provider credentials are configured, token storage is encrypted, and provider API calls are verified in staging. Current adapters are intentionally disabled placeholders that prevent accidental fake publishing.

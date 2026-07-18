# Studio Auth Audit

## Implemented in code

- `/studio` is checked server-side by `getStudioAccess`.
- `/api/studio/generate` and `/api/studio/state` repeat Studio authorization independently.
- Session cookies are HttpOnly, signed with HMAC, Secure in production, and SameSite=Lax.
- Production now requires `AUTH_COOKIE_SECRET` or `COOKIE_SIGNING_SECRET` instead of using a weak fallback.
- Login attempts are rate limited by IP and email.
- Password-reset requests are rate limited by IP and email.
- Password-reset links use a stable production origin and localhost only for local development.
- Studio tables use RLS policies scoped to authenticated users whose `user_profiles` row is marked Studio admin or owner/admin role.

## Deployment checks still required

- Set `AUTH_COOKIE_SECRET` or `COOKIE_SIGNING_SECRET` to a high-entropy value and rotate it deliberately.
- Confirm Supabase Auth password-reset expiration in the Supabase dashboard.
- Confirm allowed redirect URLs include only trusted UThynk domains and localhost development URLs.
- Confirm every future `/api/studio/*` route calls `getStudioAccess` before reading or mutating data.
- Move the in-memory rate limiter to durable infrastructure if multiple server instances are used.
- Add admin event rows to `studio_audit_log` for create, update, approve, schedule, publish, retry, and connection actions.
- Store provider OAuth token material in a secrets manager or encrypted vault; `studio_platform_connections.token_secret_ref` should only store the reference.

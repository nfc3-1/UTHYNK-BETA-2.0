# Studio Database

Apply migrations with the Supabase CLI or dashboard SQL editor:

```bash
supabase db push
```

Primary migration:

- `supabase/migrations/202607180001_studio_stabilization.sql`

## Tables

- `studio_campaigns`: campaign briefs, objectives, audience, landing page, enabled platforms.
- `studio_posts`: platform-specific copy, approval state, schedule fields, publishing fields, idempotency key.
- `studio_assets`: media metadata, storage path, thumbnails, and version metadata.
- `studio_channels`: enabled channel registry and connection state.
- `studio_approvals`: immutable approval decisions.
- `studio_schedules`: scheduled publication attempts, retry counts, failure reasons.
- `studio_platform_connections`: account metadata and token reference only.
- `studio_metrics`: imported analytics snapshots.
- `studio_audit_log`: admin actions and status transitions.
- `product_events`: observability events.

## Security

All Studio tables enable RLS. Policies restrict access to authenticated users whose `user_profiles` row has `is_studio_admin = true` or `studio_role in ('owner', 'admin')`.

OAuth tokens must not be stored in client-readable tables. Store encrypted token material in a secrets manager or encrypted server-side store and save only `token_secret_ref` in `studio_platform_connections`.

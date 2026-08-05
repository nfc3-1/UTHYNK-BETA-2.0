# Studio Deployment Checklist

- Configure `AUTH_COOKIE_SECRET` or `COOKIE_SIGNING_SECRET`.
- Configure Supabase public URL, publishable key, and service-role key.
- Configure `OPENAI_API_KEY` for AI generation.
- Apply `supabase/migrations/202607180001_studio_stabilization.sql`.
- Mark Studio admins in `user_profiles`.
- Confirm `studio-assets` Storage bucket exists and is private.
- Confirm Studio routes return 401/403 for unauthorized users.
- Configure social provider apps before enabling publishing.
- Confirm CI runs lint, typecheck, tests, and build.

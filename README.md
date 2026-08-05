# UThynk 2.0

UThynk helps people learn how to think, not what to think. This repository contains the public reasoning experience, teacher surfaces, and the internal UThynk Studio admin system.

## Run Locally

- Copy `.env.example` to `.env.local` and fill local development values.
- Run `npm ci`.
- Run `npm run dev`.

## Quality Gates

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Routes

- `/`
- `/category/[slug]`
- `/challenge/[id]`
- `/daily`
- `/stats`
- `/profile`
- `/login`
- `/studio`

## Studio Stabilization

Studio persistence, approvals, schedules, metrics, and audit history are Supabase-backed. Browser storage is only a recovery fallback for unsaved or offline data.

Read:

- `docs/STUDIO_ARCHITECTURE.md`
- `docs/STUDIO_DATABASE.md`
- `docs/STUDIO_PROVIDER_SETUP.md`
- `docs/STUDIO_DEPLOYMENT_CHECKLIST.md`

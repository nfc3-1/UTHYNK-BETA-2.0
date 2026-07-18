# Studio Architecture

UThynk Studio is an internal admin product for generating, approving, scheduling, publishing, and analyzing UThynk marketing content.

## Boundaries

- UI components live in `features/studio/components`.
- Client hooks live in `features/studio/hooks`.
- Typed service modules live in `features/studio/services`.
- Shared types live in `features/studio/types`.
- Input and row validation lives in `features/studio/validation`.
- Durable persistence is exposed through protected server routes under `app/api/studio`.

Studio components do not talk directly to Supabase. They call services, and services call protected API routes.

## AI Generation

`POST /api/studio/generate` is server-side only, requires Studio admin access, validates input, calls the configured AI provider when available, validates structured output, and falls back to deterministic templates when AI is unavailable.

Brand language to preserve:

- Learn how to think, not what to think.
- Thinking is a skill. Practice it.
- Better thinking. Better decisions.
- Train Your Mind.

## Content Lifecycle

`draft -> review -> approved -> scheduled -> publishing -> published`

Failure flow:

`publishing -> failed -> retrying -> published`

Server-side transition helpers prevent scheduling unapproved content and reject invalid status jumps.

## Recovery

`localStorage` is a recovery-only fallback. If Supabase is unavailable or old browser state cannot be parsed, Studio shows a recovery warning and lets admins export raw recovery data before clearing browser storage.

# UThynk 2.0 CTO Audit — July 2026

## Executive summary

UThynk has reached the point where architecture must catch up with feature growth. The public experience, question bank, teacher dashboard, and Studio have advanced quickly, but several capabilities still behave like prototypes rather than production systems.

The immediate engineering objective is stabilization: protect authentication, move critical data off browser-only storage, centralize validation, add tests and observability, and break large client components into maintainable domain modules.

## Priority 0 — Production risks

### 1. Remove browser-only persistence from Studio

Studio currently stores campaigns, posts, assets, channel configuration, scheduling, and approvals in localStorage. Move this data to Supabase with row-level security. Keep localStorage only for temporary unsaved drafts and recovery.

Recommended tables:

- studio_campaigns
- studio_posts
- studio_assets
- studio_channels
- studio_approvals
- studio_schedules
- studio_platform_connections
- studio_metrics
- studio_audit_events

### 2. Replace template assembly with real server-side AI generation

The current generator assembles content from preset hooks and campaign fields. Create a protected server route that receives a campaign brief and returns validated structured content for LinkedIn, Facebook, Instagram, and Threads.

Requirements:

- Server-side model key only
- Admin authorization on every request
- Structured JSON output
- Schema validation before persistence
- Generation history and prompt versioning
- Cost and rate-limit controls
- Access to the real UThynk question bank as source material

### 3. Build a real platform connection layer

Studio currently models channels but does not connect social accounts. Add a provider-adapter architecture for Meta, LinkedIn, and Threads.

Each provider should support:

- OAuth connection
- Secure encrypted token storage
- Token refresh
- Connection health
- Publishing
- Failure handling and retries
- Metric retrieval where available

### 4. Harden authentication and admin authorization

Audit and standardize:

- Cookie-signing secret requirements
- HttpOnly, Secure, and SameSite flags
- Session expiration and revocation
- Password reset expiration and redirect validation
- Rate limiting for authentication endpoints
- Server-side Studio authorization for every page and API route
- Audit logging for admin actions

Production must never use a predictable fallback cookie secret.

## Priority 1 — Architecture and reliability

### 5. Split StudioDashboard into domain modules

StudioDashboard currently combines types, seed data, migration logic, state management, generation, persistence, approvals, scheduling, and rendering.

Recommended structure:

```
features/studio/
  components/
    StudioOverview.tsx
    CampaignWizard.tsx
    ContentQueue.tsx
    ApprovalQueue.tsx
    ContentCalendar.tsx
    AssetLibrary.tsx
    ConnectionsPanel.tsx
    AnalyticsPanel.tsx
  services/
    campaignService.ts
    generationService.ts
    publishingService.ts
    analyticsService.ts
  hooks/
    useStudioCampaigns.ts
    useStudioPosts.ts
  schemas/
    studioSchemas.ts
  types/
    studio.ts
```

### 6. Add schema validation

Use Zod or an equivalent validator for:

- API request bodies
- AI output
- Database rows
- Imported analytics
- OAuth callbacks and webhooks
- Legacy Studio state migration

Remove unbounded `any` normalization from production paths.

### 7. Implement a real scheduler

A scheduled date field is not a scheduling system. Add:

- Timestamp and timezone
- Server-side queue or scheduled job
- Idempotency key
- Publishing states
- Retry rules
- Failure reason
- Publish logs
- Manual retry and cancellation

Recommended status flow:

`draft -> review -> approved -> scheduled -> publishing -> published`

Failure flow:

`publishing -> failed -> retrying -> published`

### 8. Build media storage and previews

Move from prompt-only media records to actual assets:

- Supabase Storage
- File URL and storage path
- Thumbnail
- MIME type
- Dimensions and file size
- Alt text
- Version history
- Campaign/post relationships
- Approval state

### 9. Add audit history

Track who created, edited, approved, scheduled, published, regenerated, or deleted each campaign, post, and asset.

## Priority 2 — Engineering quality

### 10. Add automated tests

Minimum unit coverage:

- Session cookie signing and verification
- Studio V1 to V2 migration
- Platform and status normalization
- Admin authorization
- Guest-to-account migration
- Question-bank routing
- Date/timezone handling

Minimum integration coverage:

- Login and password reset
- Create campaign
- Generate four channel variants
- Approve and schedule content
- Reject unauthorized Studio access
- Create class and assignment
- Persist and reload teacher data

Minimum end-to-end coverage with Playwright:

- Guest challenge through signup
- Full reasoning session
- Teacher class workflow
- Studio weekly campaign workflow

### 11. Add CI

GitHub Actions should run on every pull request:

- npm install or npm ci
- TypeScript check
- lint
- tests
- production build

Protect `main` so failing checks cannot merge.

### 12. Refactor global CSS

Move feature-specific styles out of the large global stylesheet and into CSS modules or another scoped system. Establish shared design tokens for typography, spacing, surfaces, status indicators, and breakpoints.

### 13. Add observability

Add production monitoring for:

- Client and server exceptions
- Authentication failures
- AI generation failures and cost
- Database errors
- Publishing failures
- Slow API routes
- Challenge funnel events
- Teacher workflow events
- Studio workflow events

Core events:

- challenge_started
- challenge_completed
- followup_completed
- reflection_completed
- signup_completed
- class_created
- assignment_created
- studio_campaign_generated
- studio_post_approved
- studio_publish_failed

### 14. Validate environment configuration centrally

Create one server-only environment module that validates required values at startup. Do not scatter direct `process.env` access throughout the application.

### 15. Student privacy and school readiness

Before broader school pilots, document and enforce:

- Student data collected
- Data retention period
- Account and data deletion
- Teacher access boundaries
- Export procedures
- Minimum necessary data
- Consent requirements
- No unsupported claims that reasoning indicators are scientifically validated grades

## Product workflow correction for Studio

The Studio home screen should be week-centered rather than form-centered.

Primary workflow:

1. Choose this week's goal
2. Choose audience
3. Select UThynk source material
4. Generate the week
5. Review visual channel previews
6. Approve and schedule
7. Review prior performance

The homepage should answer:

- What is scheduled this week?
- What needs approval?
- Which assets are missing?
- What performed best last week?
- What should be repeated or changed?

## Recommended sprint sequence

### Sprint 1 — Stabilization

- Require a strong production cookie secret
- Add environment validation
- Add CI build/type checks
- Add auth and state migration tests
- Add error monitoring
- Begin Studio Supabase schema

### Sprint 2 — Studio persistence and structure

- Supabase persistence
- Split StudioDashboard
- Add schema validation
- Add actual media storage and previews
- Build weekly command-center view

### Sprint 3 — Generation and approvals

- Protected AI generation route
- Real cross-platform variants
- Visual previews
- Approval queue
- Prompt and generation history

### Sprint 4 — Distribution

- Connections screen
- OAuth provider adapters
- Publishing queue
- Retry and failure logs

### Sprint 5 — Measurement

- UTM generation
- Site visit/signup attribution
- Platform metric sync
- Weekly recommendations

## Definition of done for stabilization

- Production uses no hardcoded or predictable authentication secrets
- Critical Studio and teacher data persists in Supabase
- Main branch requires successful build and tests
- Studio is split into maintainable modules
- AI and API payloads are schema-validated
- Production errors are visible in monitoring
- Every private Studio endpoint performs server-side authorization

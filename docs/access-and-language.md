# Access control and reasoning cleanup — 2026-09-26

## Access architecture and operations

The existing `user_profiles.id` remains the application identity, linked to `auth.users.id` through `auth_user_id`. There is no duplicate identity system. `getAccountAccess` verifies the signed server session, the current Supabase Auth account (including bans), the profile link, and fresh database permissions. Permissions are never read from localStorage, user metadata or query parameters. Missing configuration, broken identity links and database failures deny access.

`account_access` stores `user`, `teacher` and `admin` roles, plus a JSON object of section grants whose values are grant timestamps. `restricted_sections` is the extensible section registry. `access_audit` records before/after settings and the administrator. An admin has all sections; a teacher role includes Teacher; a standard user can receive an individual Teacher or Studio grant. The `admin` section requires the admin role and cannot be granted as an isolated section.

`/teacher` and `/admin/access` perform server authorization before rendering. Every Studio API continues to use its server guard, now backed by the same permission model. `/api/access` returns the caller's own permission summary without caching. Restricted navigation loads this summary and refreshes on focus; server authorization is the enforcement boundary even if a previously open page has stale navigation.

The additive migration `20260926230717_account_access.sql` was deployed to Uthynk 2.0 (`oxgogjxrrpqpvtpkxevv`). It does not modify profile/progress data or their policies. RLS permits authenticated users to read only their own access row. Client roles cannot write access tables or call the mutation function. `save_account_access` is SECURITY INVOKER, executable only by `service_role`, rechecks the administrator under a transaction lock, validates target identity/sections, prohibits self changes and last-admin removal, preserves grant timestamps and writes an audit record. API mutations also check same-origin and validate inputs. No service-role key is exposed in browser code.

Only the inspected, confirmed existing Studio owner was bootstrapped as admin, using both exact profile and Auth IDs. Previous Studio email/env allowlists and profile-role fallbacks are no longer authorization paths. Existing owner access is preserved in the new table.

Admin workflow: sign in with the existing owner account, open `/admin/access`, search email/username, set role and section checkboxes, and save each user. Unchecking Teacher demotes a Teacher role to standard user. Admins cannot change their own account. Grant dates are shown next to each selected section. Revoke Teacher and the next server request denies it. For future sections, register the section and use `permits(access, section)` in its page/API guard; the admin interface discovers registry entries automatically.

## Teacher findings and deferred migration

`TeacherDashboard` saves classes (including generated class codes), assignments and comments to the single browser key `uthynk-teacher-v1`. Records have no authenticated teacher owner. `StudentEnrollment` is a type only: there is no implemented server-backed membership/code-join workflow. Student names and assignment completion/growth rows are generated demonstration data; no real completion records are being persisted.

Teacher authorization is now real and server enforced, but these local records have not been represented as production classroom data. Existing browser records remain untouched. The shared local key is not an ownership boundary: do not treat this V1 dashboard as a secure multi-teacher student record store.

A later migration must introduce teacher-owned classes, unique join codes with controlled enrollment, authenticated student membership, assignments, real completion records and comments. RLS must restrict teachers to owned classes and students to enrolled assignments/their own work. Existing browser data needs an explicit authenticated import/review workflow; never import the demo students/progress as real users or progress.

## Reasoning and language

Final synthesis receives the original question, first answer, perspective expansion, secondary question and second answer. Its prompt requires a grounded starting point, the user's actual reaction to the expanded view (including rejection or unchanged opinion), their strongest reasoning move, one unresolved issue, and a transferable thinking principle. It targets 120–220 words for adults, 80–140 for teens and 50–90 for younger users. Conflicting perspective/follow-up directives no longer apply to synthesis. Empty or verbatim repeated perspectives fail with a retry message instead of falsely completing. Questions are removed and follow-up fields remain empty. JSON keys and the finite challenge flow are unchanged.

Advanced Thinking Tools markup, its tab state, translations and derived timeline were removed. Verifier, progression, traits, memory, persistence and Hold To Talk remain.

The reasoning API already safely normalized language to `en | es | fr`; both reasoning requests already sent it. The prompt now explicitly applies language to all user-facing fields, including traits/strengths/weaknesses and paraphrases of older turns. Missing Spanish/French ancillary fields no longer fall back to English labels. Speech recognition remains `en-US`, `es-US`, `fr-FR`.

Reasoning page persistence uses a user/challenge key independent of language; it now also records the language and exact original question, keeping synthesis context stable after language changes. Lesson v2 keys included language and could clear/split sessions. The new v3 key excludes language and migrates the most recent valid v2 slot, retaining old data. First-turn typed/spoken drafts now persist before submission. Explicit reset writes a tombstone so an older slot cannot unexpectedly reappear. Language changes do not generate requests or append conversation messages. Previously generated history stays verbatim; subsequent generation follows the newly selected language.

Profile labels, snapshots and navigation respect the preference. Both OpenAI-generation endpoints were audited: reasoning and Studio campaign generation. Studio now sends and validates language, instructs the model accordingly, and returns a localized failure instead of English fallback campaign text for Spanish/French. Studio graphic generation uses local SVG templates, not an AI provider. Realtime sync returns capabilities, not generated coaching text.

Existing static localization dictionaries are not a complete translation of the whole historical question bank or every legacy page. Unsupported question translations deliberately retain the original specific question rather than silently substitute another question. Stored user text and past AI history are not automatically translated. This change verifies generated-response language propagation, not universal static-content translation.

## Validation

- `npm ci` succeeded with a workspace cache; dependency lockfile was unchanged. npm reported 12 existing dependency advisories (3 moderate, 7 high, 2 critical); no unrelated dependency upgrade was made.
- Lint: clean. Typecheck: passed. Production build: passed (38 pages; protected pages dynamic).
- Vitest: 67 tests passed across 14 files. Node test suite: 3 passed.
- Coverage includes three-language complete finite flows and restoration, both-answer synthesis context, no fifth question, failed/repeated synthesis, age directives, speech locales, lesson draft preservation and legacy migration, permission-aware navigation, page role matrix, denied mutations, admin grant/revoke and Studio language handling.
- SQL regression script `supabase/tests/account_access.sql` passed before deployment and afterward inside rollback-only transactions. It verifies grants/revocation, escalation denial, self-demotion protection, audit rows, client privilege denial and own-row RLS. No test identities/records survive.
- Supabase security advisor found no new findings on the access tables/function. Pre-existing findings remain: 13 server-managed tables have RLS without client policies; leaked-password protection is disabled. Existing policies were not weakened.
- Windows native esbuild could not traverse a parent directory even after read permission was granted. Tests used the same-version esbuild WebAssembly runtime as a local-only validation workaround; no dependency/lockfile change was committed. The production Next build succeeded with its normal build pipeline, with nonfatal local Webpack cache warnings.

Deployment details and the final commit SHA are supplied in the delivery report.

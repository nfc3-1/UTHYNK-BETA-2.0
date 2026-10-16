# Public practice and translation review — October 16, 2026

The opening screen presents Thinking Challenges and Reading Paths side by side, before the optional walkthrough and daily session. Links retain `/lessons` and `/thinking-paths`; question IDs and existing bookmarks remain unchanged. The daily challenge is still available. The new entry panel uses the existing navy, silver, and white palette.

During beta, guests and ordinary signed-in users can read and complete the public library without a section grant or payment. Both reading pages and the reasoning API resolve the actual canonical reading. An unknown or unrelated reading ID still fails. Existing guest three-session cookies and local counters do not block beta practice. `lib/betaPractice.ts` controls the temporary guest quota exemption in both daily UI and API; reading content itself is public. Reinstating paid or restricted practice requires updating the access policy, opening-screen promise, and tests together.

This does not grant classroom membership, staff access, or access to school/district records. Assignments continue to use their own verified classroom actor, membership checks, and server-resolved context before the public reading branch. Existing report authorization is unchanged. Guest practice does not create a profile or school submission. Guest drafts and completion remain browser-local under the existing guest/question/age storage keys. A server-confirmed guest no longer falls back to a stale local profile ID. The same four-step session and language-independent identities are preserved.

## Spanish reviewer handoff

Run `npm run review:spanish -- /absolute/output/directory` for reproducible UTF-8 CSVs with stable IDs, field paths, English/Spanish wording, source URLs, source hashes, and blank revision/decision/note cells. The pack has 450 challenge questions, 210 reading passages, 210 reading questions, 1,680 context fields, and 308 category/path fields. Begin with challenge questions, then review reading passages and their quoted questions together. Supporting context and path fields follow. The pack includes instructions and a structural coverage report; it does not import edits or grant approval automatically.

The Spanish reviewer is available. The French reviewer is not. Both languages remain working drafts until their respective wording is reviewed. Never approve French based on Spanish feedback or on automated structural checks. Before applying returned Spanish feedback, reconcile both source hashes, preserve canonical IDs, and review any changed quotation in both the passage and question. Lesson questions have separate language statuses; the existing reading `editorialStatus` is shared and must not become approved based on a Spanish-only review.

## Remaining gaps

There are no missing Spanish or French fields in the current review scope and all 210 translated evidence anchors match their own passage and question. These checks cannot certify semantic fidelity, fluent French, or equivalent difficulty. All 450 challenge translations and 210 current reading records still await human review in each language; current context/path wording is also unapproved. The 117 archived readings, interface copy, and generated AI conversation responses are separate review queues and are not included in this Spanish pack. No translation has been newly marked approved.

## Verification

Automated coverage includes public reading access for guests and ungranted accounts, exhausted guest-cookie requests for both practice modes, canonical source replacement, unknown/path-mismatched reading IDs, the two real opening links, and guest draft/completion continuity through English/Spanish/French switching and remounting. The existing classroom, school isolation, report authorization, and four-step tests remain in the full regression suite. Production verification results are recorded separately from these simulated provider tests.

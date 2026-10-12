# Lesson question translations — implementation and review report

Repository: `nfc3-1/UTHYNK-BETA-2.0`
Base: `ca5d8b6efed865a6e6a5684f8808e7f62f5a5c96` (verified main on 2026-10-12).
Delivery: implementation patch; no merge, push, or production deployment performed.

## Result

All 450 existing English lesson questions have individual Spanish and French translations. The original `data/questions.json` is unchanged. There are zero missing translations and zero duplicate translated prompts within a category. All 900 new translations are marked `needs_review`; coverage is not editorial approval. Entries remain usable during beta while clearly recording their review status.

| Category | English questions | Spanish | French | Pending editorial review |
| --- | ---: | ---: | ---: | ---: |
| Logic & Critical Thinking | 30 | 30 | 30 | 60 |
| Epistemology | 30 | 30 | 30 | 60 |
| Ethics & Moral Reasoning | 30 | 30 | 30 | 60 |
| Strategic Thinking | 30 | 30 | 30 | 60 |
| Street Lessons | 30 | 30 | 30 | 60 |
| Financial Judgment | 30 | 30 | 30 | 60 |
| Leadership & Influence | 30 | 30 | 30 | 60 |
| Media & Information Literacy | 30 | 30 | 30 | 60 |
| Science & Evidence | 30 | 30 | 30 | 60 |
| History & Civilization | 30 | 30 | 30 | 60 |
| Technology & AI | 30 | 30 | 30 | 60 |
| Creativity & Innovation | 30 | 30 | 30 | 60 |
| Work, Purpose & Ambition | 30 | 30 | 30 | 60 |
| Identity & Human Behavior | 30 | 30 | 30 | 60 |
| Literature & Timeless Wisdom | 30 | 30 | 30 | 60 |
| Total | 450 | 450 | 450 | 900 |

## Translation identity and maintenance

`data/i18n/lessonQuestions.json` stores one record per question: immutable `id`, canonical `category`, exact English `source`, frozen `legacyIndex`, and per-language `{ text, status }` entries. The initial IDs match the existing challenge URLs. Translation selection uses category plus exact source to resolve the stored ID. Array positions are compatibility inputs only; reordering the bank does not change IDs or translations.

For an English wording edit, retain the ID only when the same question is being revised, update its source in the catalog and question bank together, revise both translations, and return their statuses to `needs_review`. For a new scenario allocate a new, unused ID and migration index. Never regenerate or renumber existing IDs or legacy indexes. Mark a translation `approved` only after editorial review. The coverage check fails on uncatalogued, stale, orphaned or duplicate sources, duplicate IDs, invalid migration indexes, missing translations, invalid review statuses, and repeated translated prompts.

Unknown or newly edited sources retain their exact English text as a conservative fallback. They never receive a neighboring question's translation or a generic replacement. This fallback has zero occurrences for the current bank; additions or source drift fail the coverage check and are actionable gaps.

## Session behavior

Lesson titles and the selected main question derive from the current language, while the session's original question snapshot, submitted answers, draft, conversation ID, session ID, feedback, and completion state persist. New sessions retain the canonical English original; existing snapshots are preserved verbatim during migration. Requests include the current displayed translation and the unchanged original context, with the selected language controlling subsequent AI responses.

The existing language-independent v3 storage key stays in use. Legacy v2 language slots and v3 index IDs migrate to stable IDs without deleting old history. Reset tombstones take precedence. The selected question is persisted by ID, including non-first questions; when upgrading without a selection pointer, the most recently updated scoped session is recovered. Records remain isolated by user/guest, category, question, and age band. Typed and voice drafts survive language changes and refreshes; retired voice recognizers cannot overwrite a preserved draft.

Main Question → Perspective Expansion → Secondary Question → Final Synthesis remains the finite experience. A language change does not submit a new reasoning request or reopen a completed challenge. Existing generated feedback and secondary questions are historical conversation content and remain in their original response language; later reasoning responses use the newly selected language. Eager translation of historical AI output is outside this static question patch.

The lesson view no longer feeds translated scenarios through the generic English youth/teen prompt replacement. It shows the same specific question in every age band, while continuing to pass ageBand to the reasoning API. Other age-adaptation paths are unchanged.

## Editorial work outstanding

Every Spanish and French entry requires review: 450 per language. The machine-readable coverage report lists each pending `{ id, category, language }`; the catalog contains its English source and both translations. Review meaning first, then natural wording, accents and punctuation, register, and age suitability. No reviewer approval is claimed.

Prioritize these groups:

- Literature & Timeless Wisdom: all 30 IDs in each language. Check localized book/fable titles against the editions used by UThynk, character names, and interpretations such as ambition versus conscience. These are original scenario summaries, not quoted book passages.
- Financial Judgment: especially `financial-judgment-01`, `-03`, `-06`, `-14`, `-23`, and `-28`. Check U.S. loan/college terminology, the FIRE acronym, and price/value distinctions. Preserve 60 versus 84 months and dollar amounts.
- History & Civilization: especially `history-civilization-04`, `-07`, `-10`, `-14`, `-19`, `-21`, `-22`, `-24`, `-26`, and `-27`. Check names for institutions and historical events and retain all competing perspectives, including enslaved people.
- Epistemology: `epistemology-03`, `-06`, `-09`, `-23`, `-24`, `-28`, and `-30`. Check medical/legal vocabulary and retain uncertainty; hypothetical claims must not become endorsements or factual assertions about a company.
- All categories: review translations of tradeoff, leverage, incentives, accountability, selection bias, false positives, and U.S. grade levels. Decide whether to expand FIRE and translate school-level labels for the intended regions.

## Validation

Passed: `npm ci`, `npm run test:translations`, `npm test` (91 tests in 16 files), `npm run test:unit` (3 tests), `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`.

New/expanded tests cover full translation coverage, unique identities, English-source drift, reorder/insert behavior, specific scenario details, challenge ID continuity, English/Spanish/French switching at all age bands, draft/answer/session continuity, global and cross-tab language events, a pending request, voice persistence, API failure, non-first refresh, user/age isolation, v2/v3 migration, reset tombstones, and the completed four-step experience.

React component tests use mocked browser storage, speech recognition, and API responses. The production build passes; authenticated production-browser and live paid-model calls were not exercised. Production remains unchanged by this deliverable.

# Day Two: distinct, connected reading paths

October 16, 2026 correction to the October 15 expansion. The seven categories contain three Reading Paths each, with ten readings per path: **21 paths and 210 distinct active passages**. There is no active passage shared between paths. The correction supplies 128 new source selections, keeps 82 already-distinct selections, and replaces all 210 active questions with source-dependent activities. The earlier release's 210 positions over 84 passages did not meet this requirement.

| Category | Second path | Third path |
| --- | --- | --- |
| Power & Leadership | Leading without force | Advice, dissent, and changing course |
| Freedom & Government | Who gets a voice? | Law, conscience, and repair |
| Meaning, Morality & Suffering | Care and moral blind spots | Help now, change the conditions |
| Truth & Knowledge | Evidence before certainty | Disagreeing to understand |
| Human Nature | Belonging and responsibility | Appearances, motives, and habits |
| Civilizations & Culture | Who preserves the story? | Learning across difference |
| Economics & Society | Work, value, and recognition | Progress and its costs |

Each path has a unifying inquiry, a practice goal, and ten individually written connections describing how its argument develops. For example, Leading without force moves from independent conviction through coerced consent, participation, enacted persuasion, paternal dependence, learned fear, military obedience, and kinship language. Readers evaluate tensions rather than receiving one approved conclusion. Connections orient the reading without assuming that earlier answers have been completed.

Every path includes at least six author/source labels and six works, with at most two passages from one author or source work. Authors may recur across paths, but their excerpts do not. Automated checks reject identical active passages and even a shared twelve-word English source stretch between active readings. These are thematic surveys, not a validated curriculum or established reading-level assignment.

## Evidence in the existing four steps

Every primary question requires interpretation of actual quoted wording **and a second, different detail from the same passage**. Questions address particular events, comparisons, claims, or institutions. Examples include Cyrus rejecting a rhetorical display while promising supplies, and Addams comparing neighborhood bath facilities with officials' prediction and actual bathhouse use.

The server supplies the complete authorized passage, question, path inquiry, and current connection to the coach. Instructions require a text-specific secondary question. A deterministic guard adds an actual localized quotation and a request for another passage detail to the generated follow-up in both JSON and streaming responses. It grounds the task; it does not establish that the provider's interpretation or a learner's answer is correct. Synthesis receives no extra question. Reading assignments use the same grounding, resolved from their saved target rather than client-supplied content.

The experience remains **Main Question → Perspective Expansion → Secondary Question → Final Synthesis**, with two learner answers. No fifth step, numeric grade, navigation rename, participation rule, permission, auth configuration, or database schema changes are included.

## Stable identities and saved work

`data/connectedReadingPaths.json` defines ordered IDs, inquiries, and connections. `data/connectedReadingModules.json` holds active question/source metadata; `data/readingPassages.json` stores full passages by ID. Catalog construction rejects missing sources, duplicate IDs, unassigned modules, and repeated active passages.

All revised questions receive fresh `reading-connected-*` identities, including readings whose passage is retained. Old completion is not silently awarded to a changed activity. **All 117 prior canonical readings** retain their exact questions, passages, categories, original URLs, and session identities through the frozen `lib/legacyReadingCatalog.ts`. They are available under Previous readings in their former paths. Historical repetition is retained only to recover saved work, not reused as an active new sequence.

The v1/v2 identity fixtures remain unchanged; v3 locks all 117 pre-correction records. Language is absent from the existing session key: switching EN/ES/FR preserves drafts, both answers, stage, and completion. Distinct activities do not share drafts. Browser-local progress remains local; saved classroom submissions retain their existing server recovery behavior. The user confirmed the live classroom walkthrough on October 15; this correction does not repeat or replace that verification.

## Sources, translations, and editorial review

All 327 English records (210 active plus 117 previous) match their 53 cited source pages. New selections use the already-documented editions and source pool, not modern copyrighted translations. Source location fields identify the English opening words when a chapter locator is unavailable. Existing rights-evidence dates are preserved; passage matching on October 16 is not represented as a fresh rights determination. U.S. public-domain metadata is jurisdiction-specific and does not establish worldwide clearance.

English selections retain the cited wording. Spanish and French are UThynk working translations of that English edition. The 128 new selections introduce **256 passage translations** prepared using locally run Argos Translate models (English–Spanish 1.0 and English–French 1.9), with targeted wording corrections. Long clauses were split to avoid truncation; translation packages are not application dependencies. All 420 revised active question translations and the 420 translated connection notes also require bilingual editorial approval. Complete fields and source matching do not prove translation fidelity. No reading is marked editorially approved: all 210 active and all 117 previous records remain `needs_review`.

Priority review includes:

- Philosophical vocabulary and long arguments: Bacon, Descartes, Hume, Marcus, Rousseau, James, Confucius, Laozi, and Dhammapada. Check logical scope, conditional claims, and culturally specific terms.
- Constitutional excerpts: distinguish the original proposed amendment numbering from current numbering; preserve institutional exceptions and limits.
- Narrated and quoted voices: distinguish Gilbert's framing, Truth's words, and her son's letter; Plato's speakers; fictional narrators; documents quoted by Zitkala-Sa. Character claims are not author endorsements.
- Enslavement, unequal legal power, bereavement, and historical gender/racial categories: review framing and suitability with teachers. Eastman's situated Santee Dakota memoir must not become a claim about all Indigenous nations.
- Economic arguments: preserve distinctions among useful work, wages, contribution, independence, status, and productivity; do not present an author's contested mechanism as established fact.
- Coherent difficulty and reading level across the ten parts, translated navigation/context, and live-model interpretations. Some historical vocabulary remains demanding even when every paragraph is present.

**Coverage gaps:** none in required EN/ES/FR content fields or the ten-part sequences. Independent bilingual approval, school-trial learning evidence, broader verified Latin American/Middle Eastern/African sources, and jurisdictional rights review remain outstanding. The guard prevents a wholly text-free task but cannot guarantee deep reading or a factually correct provider response.

## Verification

Run `python scripts/checkReadingSources.py`, `npm test`, `npm run test:unit`, `npm run test:translations`, `npm run typecheck`, `npm run lint`, and `npm run build`. Regression checks cover all 21×10 sequences, global passage uniqueness, source diversity, all 117 historical identities, language coverage, actual quotation anchors, public metadata privacy, authorization/revocation, forged context, JSON/SSE grounding, independent drafts, language switching, restored answers, completion, and the finite four-step flow.

Public production inspection checks catalog discovery and translated titles. It does not establish a new authenticated walkthrough or provider-quality sign-off.

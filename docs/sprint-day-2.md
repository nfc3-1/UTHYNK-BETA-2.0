# Day Two: connected reading paths for school trials

October 15, 2026. Preserve the seven existing categories and all prior reading identities. Each category now contains its original ten-reading path plus two additional ten-reading paths. There are 21 paths and 210 reading positions, using 84 distinct current readings from 51 author/source labels. Thirty-three previous selections remain accessible at their original URLs. The 14 additions are new passages, not sentence summaries; the remaining positions deliberately reuse the existing library with unchanged questions and session identities.

| Category | Added path | Added path |
| --- | --- | --- |
| Power & Leadership | Leading without force | Advice, dissent, and changing course |
| Freedom & Government | Who gets a voice? | Law, conscience, and repair |
| Meaning, Morality & Suffering | Care and moral blind spots | Help now, change the conditions |
| Truth & Knowledge | Evidence before certainty | Disagreeing to understand |
| Human Nature | Belonging and responsibility | Appearances, motives, and habits |
| Civilizations & Culture | Who preserves the story? | Learning across difference |
| Economics & Society | Work, value, and recognition | Progress and its costs |

Each survey path retains at least six authors and six works, no more than two selections per author/work, and no duplicate module within a sequence. Each additional sequence includes at least four readings outside its category's introductory sequence. These are themed comparisons, not claims of a validated curriculum or reading level.

## School-trial sequence

The initial pilot remains **Human Nature → Character and adaptability**. Its ten existing passages/questions are unchanged. Every path now states a translated practice goal. Ten authored connection notes in the pilot sequence link character and gain, flexibility, custom, self-review, first impressions, restraint, persuasion, care, expectations, and outward appearances. The final connection invites comparison of two authors within ordinary thinking; there is no additional required answer or fifth step.

Teachers can assign any canonical reading through the existing classroom workflow. Shared readings appear once in that assignment picker. A learner completes two answers within Main Question → Perspective Expansion → Secondary Question → Final Synthesis. No evaluation score, rank rule, XP rule, navigation rename, permission, auth setting, or database schema changes here.

## Identity and persistence

`data/readingSequences.json` supplies explicit ordered module IDs, path titles, descriptions, and practice goals in EN/ES/FR. `data/schoolTrialReadingParts.json` supplies the new reading metadata; `data/readingSources.json` shares source editions and `data/readingPassages.json` contains ID-keyed full passages and content notes. An unknown referenced ID fails catalog construction.

A shared reading means exactly the same passage, question, category, and session identity. Answers, completion, and drafts therefore follow it across curated paths, as explained beside reading progress. Completing the same reading in another path does not create a second canonical reading. This release does not introduce a new reward ledger or claim a path-completion badge. Existing browser/account/age storage, assignment-specific state, and historical URLs remain intact; standalone cross-device path completion remains outside this change.

`readingIdentities.v2.json` locks all 103 pre-expansion current and previous identities, supplementing the original v1 fixture. Never refresh those fixtures to silence a semantic regression. A changed passage or question meaning requires a new module ID.

## New sources and rights evidence

The seven selected Gutenberg records explicitly stated **Public domain in the USA**, checked October 15, 2026. That status is jurisdiction-specific, not worldwide clearance. English is preserved from the selected source, with linked numeric footnote and page markers omitted. Spanish and French are new UThynk working translations, not borrowed modern translations.

| Author/source | Work and rights record | Two selections |
| --- | --- | --- |
| Ralph Waldo Emerson | [Essays — First Series](https://www.gutenberg.org/ebooks/2944) | Self-Reliance: conviction among a crowd; foolish consistency |
| Sojourner Truth, narrated to Olive Gilbert | [The Narrative of Sojourner Truth](https://www.gutenberg.org/ebooks/1674) | Seeking Quaker allies; rejecting payment instead of her son's return |
| Oscar Wilde | [The Happy Prince](https://www.gutenberg.org/ebooks/902) | Happiness behind the palace wall; seamstress and child |
| John Dewey | [How We Think](https://www.gutenberg.org/ebooks/37423) | Chapter I: suspended judgment; Chapter XV: mental leisure |
| Mary Shelley | [Frankenstein](https://www.gutenberg.org/ebooks/84) | Chapter 10: creature's claim on his creator; Chapter 12: observing the cottagers |
| Charles A. Eastman (Ohiyesa) | [Indian Boyhood](https://www.gutenberg.org/ebooks/337) | Part I, III: grandmother's expertise; Part V, I: Smoky Day's records |
| Charlotte Perkins Gilman | [Women and Economics](https://www.gutenberg.org/ebooks/57913) | Chapter I: economic independence; useful service without independence |

## Editorial review and remaining gaps

All 117 available modules have English, Spanish and French passage, title, location, context, question, and lenses; no required language field is missing. All remain `needs_review`. The 28 new passage translations, 14 new contexts/questions/lens pairs, path metadata, and pilot connection notes need bilingual editorial approval. Existing translations remain unapproved too. Source matching establishes attribution, not translation quality, age suitability, model interpretation, or learning gains.

Priority review:

- Emerson: explain “foolish consistency” without teaching that criticism or misunderstanding proves a person is correct; retain the difference between independent conviction and accountability.
- Truth/Gilbert: preserve attribution to the mediated third-person narrative; distinguish Truth's quoted demands from Gilbert's framing. The passages concern enslavement, family separation, and unequal access to justice, without graphic violence. Teacher contextual review is needed.
- Wilde: fictional suffering, illness, luxury, and charity. Do not turn the story into proof that a particular economic intervention necessarily works.
- Dewey: doubt is a method of investigation, not a permanent refusal to act. The selected paragraphs omit his historically inaccurate flat-earth/Columbus example elsewhere in Chapter I.
- Shelley: the creature's suffering can explain conduct without justifying harm; the narrator's inferences about the cottagers are not established facts. Review biblical allusions and vocabulary in translations.
- Eastman: a situated Santee Dakota memoir, not a generic account of all Indigenous peoples; preserve names, expertise, recordkeeping practices, and historical perspective.
- Gilman: explicitly historical gender generalizations and the deliberately troubling horse/valet analogy must be scrutinized, not endorsed. Contribution, compensation, control, and interdependence must remain distinct in translation.

Remaining breadth gaps: independently verified Latin American, Middle Eastern, and more African editions; a broader contemporary voice would require appropriate rights. The 14 new paths share some existing selections rather than claiming 140 entirely new excerpts. School-trial evidence and a bilingual review of live reasoning observations remain outstanding. The owner confirmed the previous live classroom walkthrough was completed on October 15; this content release does not repeat or replace it.

## Verification

`python scripts/checkReadingSources.py` matched all 117 English selections against 53 cited source pages. Automated checks cover 21 paths × 10 parts, source diversity, baseline identity hashes, all translated fields, unique teacher assignment options, public-summary privacy, new-route authorization, forged-context replacement, shared-reading recovery, new-reading language switches, two answers/four stages, and persisted completion. Run the standard test, translations, typecheck, lint, and build checks before merge. Live public catalog checks establish discovery; protected reading behavior is covered by regression checks and still needs school-trial editorial review.

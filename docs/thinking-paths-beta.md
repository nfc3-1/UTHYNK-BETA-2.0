# Thinking Paths beta

Thinking Paths are thematic categories containing Reading Paths. The seven themes were supplied by the user on 2026-10-13. Each current Reading Path contains exactly ten substantial passages. Day Two adds two paths per theme, for 21 paths, 210 reading positions, and 84 distinct current readings from 51 author/source labels. See [Day Two school-trial sequences](sprint-day-2.md) for the new selection and editorial review notes. Shared readings keep the same canonical question, identity, and browser progress; 210 positions do not mean 210 different passages. The existing daily challenge and 450-question lesson bank remain distinct.

## Historical expansion: broader selections, 2026-10-14

The user requested more authors and books within each path. Thirty-three repeat selections were replaced with full passages from thirty additional public-domain source works. There are 70 current readings across 44 distinct author/source labels (Marx and Engels are a joint label; government bodies and literary traditions are source labels rather than individual authors). Every current path has at least six distinct authors/sources and six works, with at most two passages from any author or work.

| Thinking Path | Authors/sources before | Authors/sources now | Current parts |
|---|---:|---:|---:|
| Power & Leadership | 3 | 7 | 10 |
| Freedom & Government | 4 | 8 | 10 |
| Meaning, Morality & Suffering | 5 | 8 | 10 |
| Truth & Knowledge | 2 | 6 | 10 |
| Human Nature | 4 | 8 | 10 |
| Civilizations & Culture | 3 | 7 | 10 |
| Economics & Society | 1 | 9 | 10 |

The Declaration of Independence, Constitution, Bill of Rights, and required original introductory works remain. Economics compares Smith with Bastiat, Marx/Engels, Veblen, Ruskin, George, Addams, Washington, and Bellamy. Questions and paired lenses invite comparison, evidence, and tradeoffs; the selections do not prescribe adherence to an author’s position. Future author-specific deep dives can deliberately revisit one work, but these introductory paths are broad surveys.

## Identities, saved work, and the four steps

The flow remains Main Question → Perspective Expansion → Secondary Question → Final Synthesis, with no fifth turn. Full source context is resolved on the server for both submissions; client text cannot substitute for it. The existing coach, age-aware prompts, voice input, and conversation saving are reused.

A replacement is a new passage with a new question and therefore gets a new module ID. No old ID is reassigned or mapped to a different passage. The 37 retained readings keep their exact questions, passages, categories, and session identities. All 33 replaced readings remain accessible under their original URLs in **Previous readings** inside their original path. They retain their original passages, translated questions, and four-step sessions, and are excluded from the ten current parts. A previous reading links back to the current path. It is not counted as a completed replacement.

The original 70 reading identities are protected by `tests/fixtures/readingIdentities.v1.json`, captured from the pre-expansion committed catalog. Its hashes cover all three languages of the question and passage plus the category. Updating a historical reading’s substantive content requires a new identity rather than silently overwriting this fixture.

Sessions continue to use the existing v3 key scoped by verified account, module ID, category, and age band, independent of language. Neither storage keys nor stored records are deleted or migrated by this change. Drafts and completion remain browser-local; cross-device path completion is not implemented here. On the same browser/account, previous-reading sessions restore after a refresh or language switch.

## Access and presentation

Catalog summaries are public. Full current and previous readings require the existing `thinking_paths` section grant or admin role. The page checks the requested module belongs to its selected path, including historical IDs. An account without access receives only current catalog metadata, never archive passages or questions. The reasoning API rechecks authorization on every turn, including synthesis after a revoked grant.

The current lesson header, app width, navy/teal/silver palette, paragraph layout, and embedded four-step experience remain. Previous readings use a native, keyboard-accessible disclosure in the progress sidebar, collapsed for current readings and open when visiting a previous reading. Current parts remain a ten-item ordered list; previous items have no part numbers. The existing mobile scrolling list is unchanged. There are no database migrations, role/grant changes, auth configuration edits, or admin/teacher changes in this patch.

## Sources and rights evidence

Every new selected Gutenberg edition’s landing page explicitly states **Public domain in the USA**, checked on 2026-10-14. The Enchiridion landing page identifies its 1948 edition as U.S. public domain; only Higginson’s translated passage is selected, not Salomon’s introduction. An online release date is not treated as the print publication date. Each module links to its specific Gutenberg rights record; cache/epub URLs now resolve to that record as well as files/ URLs. Government texts link to the existing rights evidence. These records identify U.S. status, not worldwide rights clearance.

English text preserves the chosen source wording and spelling. Complete fables, paragraphs, or clearly identified sentence/verse selections are used; no generic summaries replace source passages. Numeric linked footnotes and pagination markers are omitted, while actual section/verse numbers are preserved. Source locations describe the selection. Spanish/French are newly prepared UThynk working translations of that specific English edition, not copied modern published translations.

| New author/source | Work and U.S. rights record | Selected edition |
|---|---|---|
| Xenophon | [Cyropaedia](https://www.gutenberg.org/ebooks/2085) | H. G. Dakyns translation, revised by F. M. Stawell; Everyman’s Library transcription |
| Mary Parker Follett | [The New State](https://www.gutenberg.org/ebooks/73755) | 1918 |
| Henry David Thoreau | [On the Duty of Civil Disobedience](https://www.gutenberg.org/ebooks/71) | 1849 essay; Gutenberg transcription |
| Francis Bacon | [The Essays or Counsels, Civil and Moral](https://www.gutenberg.org/ebooks/575) | 1625 essays; Gutenberg transcription |
| John Locke | [Second Treatise of Government](https://www.gutenberg.org/ebooks/7370) | 1690; Gutenberg transcription |
| John Stuart Mill | [On Liberty](https://www.gutenberg.org/ebooks/34901) | 1859 text; Walter Scott edition with W. L. Courtney introduction |
| Mary Wollstonecraft | [A Vindication of the Rights of Woman](https://www.gutenberg.org/ebooks/3420) | 1792; Gutenberg transcription |
| Jean-Jacques Rousseau | [The Social Contract](https://www.gutenberg.org/ebooks/46333) | G. D. H. Cole translation; The Social Contract & Discourses |
| Epictetus | [The Enchiridion](https://www.gutenberg.org/ebooks/45109) | Thomas W. Higginson translation; 1948 Liberal Arts Press edition (U.S. public domain per Gutenberg) |
| Leo Tolstoy | [What Men Live By](https://www.gutenberg.org/ebooks/6157) | Aylmer and Louise Maude translation; What Men Live By, and Other Tales |
| Dhammapada (Buddhist tradition) | [Dhammapada](https://www.gutenberg.org/ebooks/2017) | F. Max Müller translation, 1881 |
| Francis Bacon | [Novum Organum](https://www.gutenberg.org/ebooks/45988) | Joseph Devey edition, P. F. Collier & Son, 1902 |
| René Descartes | [Discourse on the Method](https://www.gutenberg.org/ebooks/59) | John Veitch translation; Gutenberg transcription |
| William James | [Pragmatism](https://www.gutenberg.org/ebooks/5116) | 1907 |
| Michel de Montaigne | [Essays](https://www.gutenberg.org/ebooks/3600) | Charles Cotton translation, revised by W. Carew Hazlitt, 1877 |
| George Eliot | [Silas Marner](https://www.gutenberg.org/ebooks/550) | 1861; Gutenberg transcription |
| Jane Austen | [Pride and Prejudice](https://www.gutenberg.org/ebooks/1342) | 1894 George Allen edition; George Saintsbury preface and Hugh Thomson illustrations |
| Aesop (fable tradition) | [Aesop’s Fables](https://www.gutenberg.org/ebooks/11339) | V. S. Vernon Jones translation, 1912; G. K. Chesterton introduction |
| Rabindranath Tagore | [Nationalism](https://www.gutenberg.org/ebooks/40766) | 1917 |
| Zitkala-Sa | [American Indian Stories](https://www.gutenberg.org/ebooks/10376) | 1921 |
| Mary Prince | [The History of Mary Prince](https://www.gutenberg.org/ebooks/17851) | 1831; related by Prince, transcribed by Susanna Strickland, edited by Thomas Pringle |
| Olaudah Equiano | [The Interesting Narrative of the Life of Olaudah Equiano](https://www.gutenberg.org/ebooks/15399) | 1789, volume I; Gutenberg transcription |
| Karl Marx and Friedrich Engels | [The Communist Manifesto](https://www.gutenberg.org/ebooks/61) | Samuel Moore translation, edited by Friedrich Engels, 1888 |
| Frédéric Bastiat | [Essays on Political Economy](https://www.gutenberg.org/ebooks/15962) | Historical English collection; translator not credited in the transcription |
| Thorstein Veblen | [The Theory of the Leisure Class](https://www.gutenberg.org/ebooks/833) | 1899; Gutenberg transcription |
| John Ruskin | [Unto This Last](https://www.gutenberg.org/ebooks/36541) | George Allen collection: Unto This Last, and Other Essays on Political Economy |
| Henry George | [Progress and Poverty](https://www.gutenberg.org/ebooks/55308) | 1898 Memorial Edition, volume I, Doubleday and McClure |
| Jane Addams | [Twenty Years at Hull-House](https://www.gutenberg.org/ebooks/1325) | 1910 |
| Booker T. Washington | [Up from Slavery](https://www.gutenberg.org/ebooks/2376) | 1901 |
| Edward Bellamy | [Looking Backward, 2000 to 1887](https://www.gutenberg.org/ebooks/624) | 1888 |

## Editorial status and coverage gaps (October 14 checkpoint; Day Two adds 14 readings)

All 70 current readings have complete English, Spanish, and French passages, questions, titles, locations, context, and two contrasting lenses. The 33 additions include 66 new complete passage translations. The 33 previous readings also retain complete language coverage. There are **zero missing reading or required language fields**.

All 103 available modules remain `needs_review`. All 140 current passage translations and the 66 archived translations require bilingual editorial approval; full field coverage is not approval. Priority review items:

- Dhammapada: Müller’s historical rendering of thought, suffering, and “love”; compare Buddhist vocabulary with the Pali and avoid interpreting the passage as blame for suffering.
- Rousseau: “general will” versus the sum of private wills; retain the distinction and challenge claims about who can speak for the common interest.
- Descartes/Bacon: clarity, doubt, “idols,” and historical reasoning vocabulary; do not flatten these into modern psychological labels.
- Tagore: preserve the source’s historical racial/social classifications with context, including the term “races,” without endorsing them.
- Zitkala-Sa, Equiano, and Prince: preserve the narrators’ voices and cultural terms; distinguish individual recollection and mediated testimony from universal cultural descriptions. Prince’s excerpt is nongraphic but concerns enslavement.
- Ruskin: the imagined economist’s quoted argument is a target of critique, not Ruskin’s recommendation. Bastiat’s sweeping claims need evaluation rather than presentation as settled facts.
- Addams: “Settlement” means an institution such as Hull-House. The source transcription’s “casts side” is interpreted as “casts aside” in the working translations and explicitly noted.
- Tolstoy: Christian religious language and bereavement remain part of the fictional scene. Bellamy: the imagined speaker’s judgment of low-ranked workers is not UThynk’s assessment of learners.
- Existing Jowett/Legge vocabulary, Daoist metaphors, Dostoyevsky’s nongraphic suffering passage, Herodotus’s ancient reports, Du Bois’s historical terms, and founding-document exclusions retain their prior review requirements.

Geographic/tradition breadth can grow further, especially with verified Latin American, Middle Eastern, and additional African editions. The current set is a broadened starter library, not an exhaustive global anthology. Rights in other jurisdictions, independent translation review, live-model literary interpretation, and cross-device completion remain unverified or out of scope.

## Maintaining the catalog

`data/readingSources.json` holds shared source metadata. `data/thinkingPathParts.json` holds the 59 current additional parts; eleven introductory modules remain in `lib/thinkingPaths.ts`. `data/retiredReadingParts.json` scopes previous parts by `pathSlug/readingSlug`. `data/readingPassages.json` contains 103 ID-keyed passages and optional historical notes. The catalog fails on a missing or mismatched source rather than falling back to an English synopsis.

For a wording-only fix, retain the question identity. For a new source, changed question meaning, or materially different passage, create a fresh ID and preserve the previous record in its path’s archive. Do not transfer completion or responses across those identities. Keep ten parts per path, at least six authors/sources and works, and at most two parts per author/work in these survey paths. `data/readingSequences.json` composes new paths from canonical module IDs and supplies goals; `data/schoolTrialReadingParts.json` defines the 14 new modules. Do not duplicate IDs or assign a fresh completion identity merely because the same question appears in another path. Keep source-specific prompts and all three languages together.

## Verification

Run `python scripts/checkReadingSources.py` to match all 117 current and previous English selections against their 53 cited source pages without account credentials. This checks provenance, not translation accuracy or the truth of historical claims. Tests cover diversity limits, 70 current/33 previous identities, all language fields, previous-reading privacy and path scoping, canonical context, grant revocation, language switching, both draft restores, independent old/new sessions and completion, and the finite four-step flow. Run `npm test`, `npm run test:unit`, `npm run test:translations`, `npm run typecheck`, `npm run lint`, and `npm run build`.

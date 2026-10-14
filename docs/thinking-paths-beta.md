# Thinking Paths beta

The seven thematic groups were supplied by the user on 2026-10-13. Reading sources are limited to verified public-domain works and editions in the U.S.; no copyrighted-work companion guides are included.

Thinking Paths are thematic categories. Reading Paths are ordered sequences of readings inside a category. Existing daily challenges and the 450-question lesson bank keep their own identities and behavior.

This starter release has seven themes and seventy readings: exactly ten parts in each Reading Path. The themes are Power & Leadership; Freedom & Government; Meaning/Morality/Suffering; Truth & Knowledge; Human Nature; Civilizations & Culture; and Economics & Society. Each reading supports the existing four steps: Main Question → Perspective Expansion → Secondary Question → Final Synthesis. There is no additional reasoning turn. Source context is resolved on the server before either provider call; client text cannot replace it. The existing reasoning coach, age-aware prompts, voice interaction, and conversation persistence are reused.

## Access and rollout

The catalog and its descriptions are public. Full readings and reasoning submissions require the `thinking_paths` grant or an admin role. Server authorization is checked freshly on every page load and submission, including final synthesis. Unauthenticated users see a sign-in link; signed-in users without a grant see the beta explanation and a link to existing lessons. Unauthorized client props include catalog metadata only.

The section was registered in the existing Uthynk 2.0 project on 2026-10-13. For other environments, run the idempotent `supabase/seeds/thinking_paths_access.sql` against the existing Uthynk 2.0 project to register the beta section. Then an existing administrator can grant/revoke Thinking Paths from `/admin/access`. The section covers both the themed umbrella and its Reading Paths. No accounts are automatically granted access, and no roles, prices, checkout rules, schemas, or existing grants change. Admins already have every section.

Reading modules have permanent IDs independent of title, sequence position, and language. Drafts, selected reading URLs, and completion survive revisits; saved sessions use the existing v3 key scoped by verified account ID, module ID, category, and age band. Language is excluded from identity. Completion badges and drafts are browser-local; there is no cross-device Reading Path completion index in this release. Existing canonical conversation saving still runs in the reasoning API.

## Editorial review and sources

All seventy modules are marked `needs_review`. Each now contains an actual English selection from its cited public-domain edition or government transcription, rather than a one-line quotation or UThynk synopsis. English passages run from 107 to 280 words; the shortest are complete sets of constitutional clauses. Spanish and French contain full UThynk working translations of those selections. All 140 translations, plus the context and questions, still need bilingual editorial approval. No reading or required language field is missing.

Passages preserve source wording and historical spelling. Linked footnote markers are omitted. Paragraph breaks can separate selected portions; nonadjacent legal clauses and sayings are identified in the source location. The interface distinguishes the source passage from the optional plain-language context and contrasting lenses, which stay collapsed until opened. Particular editorial review priorities are Jowett’s archaic/OCR wording, Legge’s hierarchical terms and edition numbering, Daoist metaphors, the nongraphic but distressing Rebellion selection, Herodotus’s ancient reports, Du Bois’s historical vocabulary, and the Constitution’s original exclusions. Historical text is not presented as current law or a universal description of a culture.

Run `python scripts/checkReadingSources.py` to check every English paragraph against the 16 linked source pages. This network check uses no account credentials and verified all 70 passages on 2026-10-14. It checks provenance, not the accuracy of our translations or the authors’ historical claims.

The original source-edition public-domain checks remain applicable to the expanded selections. Source pages and the selected Project Gutenberg editions’ explicit U.S. public-domain status were checked on 2026-10-13. Each module includes a jurisdiction, verification date, and linked rights evidence. The U.S. Copyright Office confirms that works published in the United States before January 1, 1931 are public domain: https://www.copyright.gov/what-is-copyright/. `public_domain_us` records the selected edition's U.S. status, not a worldwide rights claim. The interface links to full public-domain works at their primary repositories. New sources include Marcus Aurelius (George Long, not Meric Casaubon), David Hume (Selby-Bigge edition), Frederick Douglass, W. E. B. Du Bois, and the Bill of Rights; all selected editions’ U.S. public-domain status was checked on 2026-10-13. No companion guides to copyrighted works are included.

| Module ID | Work / passage | Edition and source | Review focus |
|---|---|---|---|
| reading-plato-republic-473 | Republic, Book V, 473c–474a | [Benjamin Jowett, 1892](https://www.gutenberg.org/cache/epub/150/pg150.html) | Philosopher king; knowledge versus accountability |
| reading-machiavelli-prince-17 | The Prince, chapter XVII | [W. K. Marriott, 1908](https://www.gutenberg.org/files/1232/1232-h/1232-h.htm) | Conditional comparison of fear and love; avoid endorsing coercion |
| reading-suntzu-artofwar-3 | The Art of War, chapter III, §§1–3 | [Lionel Giles, 1910](https://www.gutenberg.org/files/132/132-h/132-h.htm) | Restraint versus avoidance; historical military context |
| reading-declaration-consent | Declaration, consent of the governed | [National Archives, 1776](https://www.archives.gov/founding-docs/declaration-transcript) | Consent, slavery, and political exclusion |
| reading-constitution-preamble | Constitution, Preamble and opening clauses of Articles I–III | [National Archives, 1787](https://www.archives.gov/founding-docs/constitution-transcript) | Institutions, original compromises, and amendments |
| reading-karamazov-rebellion | The Brothers Karamazov, Book V, IV | [Constance Garnett, 1912](https://www.gutenberg.org/files/28054/28054-h/28054-h.htm) | “Ticket” metaphor; innocent suffering; child-appropriate discussion (nongraphic excerpt) |
| reading-apology-examined-life | Apology, examined life | [Benjamin Jowett](https://www.gutenberg.org/files/1656/1656-h/1656-h.htm) | Reflection versus responsibility; avoid treating a literary claim as instruction |
| reading-analects-4-16 | Analects, IV, XV–XVIII | [James Legge, 1861](https://www.gutenberg.org/cache/epub/3330/pg3330.html) | Historical “superior/mean man” vocabulary and modern translation choices |
| reading-tao-water-8 | Tao Te Ching, VIII and IX.1 | [James Legge, 1891](https://www.gutenberg.org/files/216/216-h/216-h.htm) | Water metaphor; avoid flattening Daoist context |
| reading-herodotus-customs-3-38 | Histories, III, 38 | [G. C. Macaulay, 1890](https://www.gutenberg.org/files/2707/2707-h/2707-h.htm) | Cultural familiarity versus fairness; ancient observer’s interpretation, not a universal claim |
| reading-smith-interest-1-2 | Wealth of Nations, I, II | [Adam Smith, 1776](https://www.gutenberg.org/files/3300/3300-h/3300-h.htm) | Self-interest versus greed; avoid implying all exchanges are fair |

## Maintaining the ten-part paths

`data/readingPassages.json` is the single source of reading text, keyed by the seventy permanent module IDs. It stores English/Spanish/French passages, precise source locations, source URLs, and historical notes where needed. `data/thinkingPathParts.json` now holds the 59 additional parts’ metadata, context, contrasting lenses, and questions; obsolete snippets have been removed. `data/readingSources.json` records the five additional source works, and `lib/thinkingPaths.ts` combines the catalog with the full passages. Missing or mismatched source records fail rather than falling back to a synopsis.

The seventy module IDs, reading order, categories, and all existing question translations are retained. Expanded passage text does not change the session key. The reading page uses the existing lesson header and app width once. The passage, optional context, four-step session, and next-reading controls share one content column beside the progress list. On small screens, the content stacks and the ten-part list scrolls horizontally. The duplicate lesson header and duplicate question-selection sidebar are removed only for embedded reading sessions; regular lesson behavior is preserved.

## Remaining scope

This is a functioning starter library, not a complete course or full-text reader. Additional works, editorial approval, and cross-device path completion remain future work. Passage-specific reasoning quality still needs beta evaluation with live model responses; automated tests mock the provider and verify contracts, not literary interpretation. Existing translated lesson coverage is unchanged.

## Verification

Tests cover unique and stable IDs, all three language fields, public metadata projection, source attribution, unknown routes and cross-path selection, beta roles/grants, revocation before provider calls, canonical source context in both turns, translated passage/question switching, both draft restores, finite four-step completion, and progress isolation across module, user, and age band. Run `python scripts/checkReadingSources.py`, `npm test`, `npm run test:unit`, `npm run test:translations`, `npm run typecheck`, `npm run lint`, and `npm run build`.

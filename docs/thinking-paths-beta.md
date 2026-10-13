# Thinking Paths beta

The seven thematic groups were supplied by the user on 2026-10-13. Reading sources are limited to verified public-domain works and editions in the U.S.; no copyrighted-work companion guides are included.

Thinking Paths are thematic categories. Reading Paths are ordered sequences of readings inside a category. Existing daily challenges and the 450-question lesson bank keep their own identities and behavior.

This starter release has seven themes and eleven readings. The themes are Power & Leadership; Freedom & Government; Meaning/Morality/Suffering; Truth & Knowledge; Human Nature; Civilizations & Culture; and Economics & Society. Each reading supports the existing four steps: Main Question → Perspective Expansion → Secondary Question → Final Synthesis. There is no additional reasoning turn. Source context is resolved on the server before either provider call; client text cannot replace it. The existing reasoning coach, age-aware prompts, voice interaction, and conversation persistence are reused.

## Access and rollout

The catalog and its descriptions are public. Full readings and reasoning submissions require the `thinking_paths` grant or an admin role. Server authorization is checked freshly on every page load and submission, including final synthesis. Unauthenticated users see a sign-in link; signed-in users without a grant see the beta explanation and a link to existing lessons. Unauthorized client props include catalog metadata only.

The section was registered in the existing Uthynk 2.0 project on 2026-10-13. For other environments, run the idempotent `supabase/seeds/thinking_paths_access.sql` against the existing Uthynk 2.0 project to register the beta section. Then an existing administrator can grant/revoke Thinking Paths from `/admin/access`. The section covers both the themed umbrella and its Reading Paths. No accounts are automatically granted access, and no roles, prices, checkout rules, schemas, or existing grants change. Admins already have every section.

Reading modules have permanent IDs independent of title, sequence position, and language. Drafts, selected reading URLs, and completion survive revisits; saved sessions use the existing v3 key scoped by verified account ID, module ID, category, and age band. Language is excluded from identity. Completion badges and drafts are browser-local; there is no cross-device Reading Path completion index in this release. Existing canonical conversation saving still runs in the reasoning API.

## Editorial review and sources

All eleven modules are marked `needs_review` and display a beta editorial notice. English quotations are short excerpts from the linked edition; Spanish/French quotations are new UThynk working translations, not quotations from an independently published translation. Their accuracy, register, attribution, and historical context need bilingual editorial approval before changing status to `approved`. Original context, contrasting lenses, and questions also need review. Review coverage includes all eleven modules in all three languages; no required starter content field is missing.

Source pages and the selected Project Gutenberg editions’ explicit U.S. public-domain status were checked on 2026-10-13. Each module includes a jurisdiction, verification date, and linked rights evidence. The U.S. Copyright Office confirms that works published in the United States before January 1, 1931 are public domain: https://www.copyright.gov/what-is-copyright/. `public_domain_us` records the selected edition's U.S. status, not a worldwide rights claim. The interface links to full public-domain works at their primary repositories. No companion guides to copyrighted works are included.

| Module ID | Work / passage | Edition and source | Review focus |
|---|---|---|---|
| reading-plato-republic-473 | Republic, Book V, 473c–d | [Benjamin Jowett, 1892](https://www.gutenberg.org/cache/epub/150/pg150.html) | Philosopher king; knowledge versus accountability |
| reading-machiavelli-prince-17 | The Prince, chapter XVII | [W. K. Marriott, 1908](https://www.gutenberg.org/files/1232/1232-h/1232-h.htm) | Conditional comparison of fear and love; avoid endorsing coercion |
| reading-suntzu-artofwar-3 | The Art of War, chapter III, §2 | [Lionel Giles, 1910](https://www.gutenberg.org/files/132/132-h/132-h.htm) | Restraint versus avoidance; historical military context |
| reading-declaration-consent | Declaration, consent of the governed | [National Archives, 1776](https://www.archives.gov/founding-docs/declaration-transcript) | Consent, slavery, and political exclusion |
| reading-constitution-preamble | Constitution, Preamble | [National Archives, 1787](https://www.archives.gov/founding-docs/constitution-transcript) | Institutions, original compromises, and amendments |
| reading-karamazov-rebellion | The Brothers Karamazov, Book V, IV | [Constance Garnett, 1912](https://www.gutenberg.org/files/28054/28054-h/28054-h.htm) | “Ticket” metaphor; innocent suffering; child-appropriate discussion (nongraphic excerpt) |
| reading-apology-examined-life | Apology, examined life | [Benjamin Jowett](https://www.gutenberg.org/files/1656/1656-h/1656-h.htm) | Reflection versus responsibility; avoid treating a literary claim as instruction |
| reading-analects-4-16 | Analects, IV, XVI | [James Legge, 1861](https://www.gutenberg.org/cache/epub/3330/pg3330.html) | Historical “superior/mean man” vocabulary and modern translation choices |
| reading-tao-water-8 | Tao Te Ching, chapter VIII | [James Legge, 1891](https://www.gutenberg.org/files/216/216-h/216-h.htm) | Water metaphor; avoid flattening Daoist context |
| reading-herodotus-customs-3-38 | Histories, III, 38 | [G. C. Macaulay, 1890](https://www.gutenberg.org/files/2707/2707-h/2707-h.htm) | Cultural familiarity versus fairness; ancient observer’s interpretation, not a universal claim |
| reading-smith-interest-1-2 | Wealth of Nations, I, II | [Adam Smith, 1776](https://www.gutenberg.org/files/3300/3300-h/3300-h.htm) | Self-interest versus greed; avoid implying all exchanges are fair |

## Remaining scope

This is a functioning starter library, not a complete course or full-text reader. Additional works, more readings per theme, editorial approval, and cross-device path completion remain future work. Passage-specific reasoning quality still needs beta evaluation with live model responses; automated tests mock the provider and verify contracts, not literary interpretation. Existing translated lesson coverage is unchanged.

## Verification

Tests cover unique and stable IDs, all three language fields, public metadata projection, source attribution, unknown routes and cross-path selection, beta roles/grants, revocation before provider calls, canonical source context in both turns, translated passage/question switching, both draft restores, finite four-step completion, and progress isolation across module, user, and age band. Run `npm test`, `npm run test:unit`, `npm run test:translations`, `npm run typecheck`, `npm run lint`, and `npm run build`.

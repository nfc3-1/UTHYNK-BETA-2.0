# Day 1: trustworthy beta feedback

**Historical checkpoint:** the temporary demo labels and opaque provisional estimates described below are superseded by [the live classroom and 20-point rubric](live-classroom-and-scoring.md).

## Pilot working brief

Working audience: a small, teacher-facilitated group aged 13–17, using desktop browsers. This is a planning assumption, not a restriction on the existing child or adult experiences. Recommended Day 2 pilot: Human Nature / Character and adaptability, with ten connected readings. Category names and the current catalog have not been changed.

Outcome to investigate: can a learner use a specific text detail to support an interpretation, consider another plausible interpretation, and explain a defensible conclusion? The pilot must establish whether practice helps; neither AI estimates nor passing software tests demonstrate learning gains.

Keep the existing experience: main question → perspective expansion → secondary question → final synthesis. There are two learner answers. Review criteria are not extra questions, and the synthesis must not introduce a fifth step. Phone/tablet layout and native app work follow beta testing.

## Shared rubric: beta-v1

Use the same criteria in English, Spanish, and French. Review only what the task gives the learner an opportunity to demonstrate. A justified disagreement with the author or coach is legitimate. Consider evidence quality; do not manufacture an equally credible opposing position.

| Criterion | Not yet visible | Developing | Supported |
| --- | --- | --- | --- |
| Understand the claim | No relevant claim is identified | Identifies part of the claim, with an important ambiguity | Represents the claim accurately, including relevant limits |
| Support it with evidence | Gives an opinion without relevant support | Gives a relevant detail but leaves the connection unclear | Connects a relevant passage detail or observation to the claim and distinguishes inference from fact |
| Consider another interpretation | No alternative is explored when the task calls for one | Names a plausible alternative without examining it | Explains how an alternative fits the evidence or why it is weaker |
| Explain a justified conclusion | Gives no reason for the conclusion | Gives a reason but leaves a material assumption unexplored | Explains a conclusion, tradeoff, or uncertainty that follows from the available evidence |

For human review, record an exact supporting excerpt from the learner's answer for every positive observation. Record “not elicited” when the task did not ask for a criterion. Do not add up these categories into an ability grade. Do not credit the learner with an idea introduced only by UThynk. A reasonable decision to retain a position is not evidence of rigidity.

## Implemented safeguards

- Teacher workspace: persistent top notice, explicitly marked sample progress and fictional students, demo-only action labels, accurate explanation that codes cannot enroll students and comments are browser-local. Existing demo classes, assignments, comments, and storage keys are retained.
- Reasoning API: removes English keyword detection, word-count bonuses, and the 72/28 verifier blend. Both phases use the same rubric instructions. Missing strengths or weaknesses become empty lists rather than invented evidence. Missing/invalid numeric estimates have `scoreSource: unavailable`.
- XP: fixed participation credit, 35 in perspective feedback and 52 in final synthesis. Only the successful synthesis persists account progress, as before. Existing XP, ranks, streaks, recommendations, session identities, and answer storage are retained. Model-proposed XP is ignored.
- Learner feedback: EN/ES/FR notices explain that AI feedback is provisional, describes the response, and does not measure learning gains or personality. Practice focus replaces identity-style presentation; emotional-rigidity, manipulation flags, raw ability metrics, and invented evidence-gain increments are removed from the reasoning display.
- Profile and shareable snapshot: removes invented trait-strength, logic, strategy, and evidence figures. Shows XP, streak, and the count of recent saved sessions instead. Snapshot exports include the beta qualification. Recommendations and coaching intensity still operate.
- Static leaderboard: clearly labeled fictional participation-board preview, including individual demo names. XP ranks are not claims about cognitive ability.
- History: new lesson summaries no longer add numeric grades. Old stored grade indicators are hidden in the current display without deleting them or changing the saved answers.
- Behavioral profiles: this endpoint stops updating person-level behavioral aggregates. Existing records are retained. Historical memory is explicitly described to the model as unvalidated context rather than facts about a person.

## Compatibility and remaining score dependencies

| Consumer | Day 1 behavior | Limitation |
| --- | --- | --- |
| Difficulty, pressure, next-challenge selection, profile recommendations | Continue to use the provisional model estimate through the existing numeric field | These recommendations are heuristic; not validated placement or ability measures |
| Rank and streak | Existing XP thresholds and completion dates remain | Participation measures only |
| Canonical and legacy conversation persistence | Existing fields remain; assessment metadata is embedded in the verifier JSON and returned at the response root | Historic scalar score columns contain mixed versions; do not compare pre/post-release averages as learning gains |
| Cumulative reasoning estimate and practice-focus records | Continue for compatibility when a finite model estimate exists | No claim of validated growth; unavailable estimates leave the existing aggregate unchanged |
| Legacy verifier payload/columns | `status: retired`, empty signals/missing moves, numeric compatibility placeholders of 70 | These placeholders are never passed to the model or displayed as measurements |
| Person-level behavioral aggregates | No new writes from this endpoint | Historical values still exist; a future migration would need an explicit retention decision |

No schema migration, authentication change, access grant, curriculum rewrite, license change, or storage-key migration is part of Day 1.

## Multilingual review checklist

The automated tests compare equivalent EN/ES/FR answers with controlled provider judgments. They establish that application code applies identical scoring/XP rules. They do **not** establish that the model judges translations equally or reliably.

Use the following original calibration material for a bilingual human/provider review:

**Question:** A school reports better attendance after restricting phones. Does that establish that the restriction caused the improvement?

| Language | Equivalent concise response |
| --- | --- |
| English | Attendance may have improved because of another change. I would compare similar classes over the same period before attributing the difference to the phone rule. |
| Spanish | La asistencia pudo mejorar por otro cambio. Compararía clases similares durante el mismo período antes de atribuir la diferencia a la regla sobre los teléfonos. |
| French | La présence a pu s’améliorer à cause d’un autre changement. Je comparerais des classes similaires sur la même période avant d’attribuer la différence à la règle sur les téléphones. |

For each language, test both a reasoned disagreement and agreement, a concise supported answer and a long unsupported one. Check that:

1. The same reasoning moves receive comparable observations, without grammar/vocabulary penalties or a preference for English terms.
2. Every strength and weakness is supported by the learner's actual words, across both answers in synthesis.
3. The coach's contribution is attributed to the coach; the learner's development is represented honestly.
4. There is one secondary question, followed by a distinct synthesis with no new question.
5. A language change or retry retains the same question, answers, draft, and session identity.
6. XP is consistent for participation; an AI number is not used to assert academic growth.

Before the classroom pilot, independently review bilingual output and passage translations. For the pilot, collect a baseline response and a new transfer task using the same human rubric, with reviewers unaware of the AI score where practical. Report individual examples and review disagreements before claiming aggregate improvement.

## Verification and handoff

Regression checks cover API JSON and streaming metadata, zero and missing estimates, equivalent-language application behavior, fixed XP, signed-in persistence calls and user scoping, absence of behavioral-profile writes, demo-state restoration, qualified profile exports, language switching, old reading identities, draft recovery, and finite session completion.

Provider contract tests use mocked responses. Persistence tests use a fake database client; they do not establish live classroom synchronization or database authorization. Those remain Day 3 work. Desktop browser pilot verification remains Day 4. No mobile work was added.

Day 2 should turn one ten-part path into a coherent sequence using this rubric. Day 3 should replace the clearly marked classroom demo with real school/class-scoped records and permission tests. Day 4 should verify the full desktop pilot workflow.

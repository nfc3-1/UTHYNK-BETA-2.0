# Live classrooms and evidence-based reasoning feedback

Teacher results and the class participation board use saved classroom records. No student names, completion dates, or progress results are generated. Empty classes and incomplete assignments display their actual state.

## Presenting the working flow

1. Sign in with your existing owner/admin account. Open the staff icon, then **Teacher**. To enable another teacher, use Platform Admin or the scoped School / district dashboard as described in [School and district boundaries](school-and-districts.md).
2. Create a class. Its enrollment code is stored in Supabase. Choose a lesson or reading and assign it. **Open Assignment** opens the exact saved question/passage; teachers can preview without submitting as a learner.
3. A learner signs into their own account, opens **My classroom** in the visible navigation, enters the enrollment code, and chooses a class display name. That name is visible within the class.
4. Complete the four steps: main question, perspective expansion, secondary question, final synthesis. There are exactly two learner answers. Feedback adds no fifth question.
5. The first submitted answer and generated follow-up are saved on the server. Another browser restores that stage. The second answer, synthesis, observations and completion time are saved on completion. Unsubmitted drafts still use browser storage.
6. The teacher refreshes the class to inspect both actual answers, the coach's perspective/question, synthesis, and the same observations with answer excerpts. Teacher comments become available to the learner when they reopen the assignment.
7. **Participation** opens the class board. It counts completed assignments; it does not rank reasoning ability or imply a learning gain. Other classes cannot see these names or responses.

Removed learners cannot reactivate themselves using the old enrollment code. Removal retains their historical submissions for the teacher. The global owner/admin retains access across classes. School/district administrators receive aggregate class participation, never learner answers, comments or enrollment codes. Platform administration is explicitly separate from school-scoped roles.

## Reading-specific evidence

The October 16 Day Two correction provides 210 globally distinct active excerpts in 21 connected ten-part paths. Reading questions require actual quoted wording plus a second detail. Server-resolved source context and localized quotation guidance keep follow-ups tied to that reading in JSON, streaming, and classroom assignment flows, without adding another learner turn. All 117 previous reading identities remain available for saved-work recovery. See [Day Two correction](sprint-day-2.md) for sources and outstanding bilingual editorial review.

## Feedback instead of grades

New learner turns use `reasoning-feedback-v1`, defined in `lib/qualitativeAssessment.ts`. They return `score: null`. An independent review task produces observations for four shared lenses: understand a claim, support it with evidence, consider another interpretation, and explain a justified conclusion. The review runs alongside the coaching request, at temperature 0 with a fixed seed. It receives questions and learner sentences, without coach suggestions, prior grades or personality history. No numerical evaluator runs on the learner path. A review failure or timeout becomes unavailable feedback and does not fail an otherwise valid conversation.

| Status | Meaning |
| --- | --- |
| Strong in this response | A specific supported reasoning move in these answers |
| Developing | An attempted move with a supported limitation |
| Not demonstrated here yet | A relevant move not shown in the inspected answer |
| Not asked in this task | The task did not elicit this move; not a weakness |
| No supported observation available | Missing/invalid provider output; never a fabricated negative judgment |

The first turn considers the first answer; the final feedback considers both answers. The coach and reading passage are context, not learner evidence. Strict structured output in the independent review requires every observation and constrains evidence IDs to supplied answer sentences; applicable observations require at least one ID. The model cites sentence IDs and the server resolves them to exact, untranslated learner quotations. Unknown IDs, missing evidence for applicable observations, invalid status or missing notes yield an unavailable observation. No positive label is inferred from historical points. A missing observation does not block an otherwise valid four-step conversation.

Summary strengths and next-focus text come from the independent observations, rather than a second set of coach-generated judgments.

The optional **Next focus** is one actionable suggestion grounded in a supported gap. Questions are excluded from that field. The model is instructed not to infer mastery, personality or improvement over time from a session. Claims about development between the two answers must cite both; this is not longitudinal learning measurement. Teacher review remains necessary: mechanically valid evidence IDs do not prove a model's interpretation is correct.

XP is separate participation credit: 35 in first-turn feedback and 52 for completion. Only successful synthesis persists account progress. Database assignment replay prevents duplicate classroom completion/XP persistence calls. New qualitative sessions do not update numerical reasoning aggregates, traits, or difficulty based on feedback labels. Historical score values and saved conversations remain stored. Older sessions show their preserved answers/synthesis and a legacy-format notice instead of a point table; they are not regenerated or silently relabeled.

## Languages and calibration

The same qualitative instructions and criteria apply to English, Spanish and French. Requested output language is explicit in both provider messages. The current output language is saved with observations. Sentence IDs refer to the actual submitted answers in their original language. Language switching retains question identity, answers, drafts, assignment IDs, session IDs, saved feedback and the current step; it does not rerun the coach or alter an observation's meaning.

Automated fixtures verify equivalent labels, original quotations, validation, language switching and persistence contracts. They are not evidence of universal semantic fairness or educational efficacy. Bilingual editorial review of live model output is still required before school grading or claims about reliable learning gains.

The numerical `reasoning-20-v1` evaluator, cache, fixtures and Platform Admin **Run Language Calibration** remain isolated experiments. They do not determine learner feedback, participation XP, or class rankings. The October 15, 2026 live numerical report failed: all initial answers were 8/20; final EN/ES/FR totals were all 13/20, but French alternatives/conclusion anchors differed. Equal totals did not establish parity. This result motivated the move away from public grades; qualitative labels also require review rather than being presumed calibrated.

## Navigation

The UThynk logo links home; there is no duplicate Home button. Daily, All lessons, Thinking Paths, My classroom, Participation, Feedback and Store are direct links in the primary group, with no public dropdowns. Compact spacing, a two-line logo tagline and a narrower language selector leave room for the public links on a laptop header. Profile sits in a separate right-hand account group; Sign in disappears after the server verifies a signed-in identity. Public destinations are outside the staff hamburger.

Only authorized Teacher, School / district, Studio and Admin tools appear inside the icon-only staff disclosure. It is hidden for learners and guests. The header stacks above page cards and dropdowns use opaque navy with light text. Escape returns focus to the staff trigger; outside clicks and selected links close the staff disclosure. Existing page-level guides remain; their redundant header link is removed. About UThynk remains available in the footer and contains the existing short mission statement. Page headers share the same navigation and home logo. No route permissions or session/draft identities change.

## Data and authorization

Class, membership, assignment, submission, comment and experimental assessment tables use RLS with no browser-role grants. The informational “RLS enabled, no policy” advisor entry is expected for service-only default deny. Signed-session routes reverify accounts and scope every class/assignment. Mutations require the same origin. SQL functions are SECURITY INVOKER, executable only by the service role; actor IDs come from verified server access.

Learners receive their own answers/comments and their class's alias/completion board. Teachers receive owned-class records; platform admins can inspect all classes. Answer quotations stay private and never enter the leaderboard. Assignment IDs namespace browser drafts, preventing cross-assignment/ordinary-session overwrites. Assigned-reading access does not unlock the unassigned catalog.

## Verification and remaining sign-off

The classroom and school-isolation SQL tests previously passed against the connected database within rollback transactions. This change does not modify database authorization or schema. Automated tests cover genuine record scoping, completion counts, replay prevention, assignment links/recovery, feedback evidence validation, legacy history, and four-step/language/session regressions.

The owner reports completing the live signed-in walkthrough on October 15, 2026. This is user-confirmed verification, separate from the automated checks. The rehearsal checklist was: owner sees staff tools; learner sees ordinary navigation; learner joins a class, completes an assignment; teacher reviews both answers/observations and saves a comment; learner reopens it. Check live feedback in EN/ES/FR for accurate attribution and relevant suggestions. Mocks and unauthenticated route checks do not replace that rehearsal. Cross-language editorial sign-off remains outstanding. A blocked cloud-browser sign-in must not be circumvented.

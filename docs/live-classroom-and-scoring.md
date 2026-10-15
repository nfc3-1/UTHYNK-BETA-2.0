# Live classrooms and explainable reasoning scores

This supersedes the temporary Day 1 demo-label approach. Teacher results and the class participation board come from saved classroom records. The app contains no generated student names, completion dates, or progress results. Empty classes and incomplete assignments display their actual state.

## Presenting the working flow

1. Sign in with your existing owner/admin account. Open **Teacher**. To enable another teacher, use the existing **Admin access** page to grant Teacher access; also grant Thinking Paths if they will assign readings.
2. Create a class. Its enrollment code is stored in Supabase. Choose a lesson or reading and assign it. **Open Assignment** opens the exact saved target; teachers can preview its question/passage without submitting as a learner.
3. A learner signs into their own UThynk account, opens **My classroom**, enters the enrollment code, and chooses a class display name. That name is visible within the class.
4. Open the assignment, read its passage if applicable, and complete the normal four-step experience: main question, perspective expansion, secondary question, final synthesis. There are two answers, not an added grading question.
5. The first submitted answer and generated follow-up are saved on the server. Reopening the assignment on a different browser/device restores that stage. The second answer, synthesis, point breakdown, and completion time are then saved. Unsubmitted drafts still use browser storage.
6. The teacher refreshes the class to inspect both actual answers, the coach’s perspective/question, synthesis, and rubric. Save a teacher comment; it becomes available to the learner when they reopen the assignment.
7. **Participation** opens the class leaderboard. It counts completed assignments; it does not rank intelligence or imply a validated learning gain. Other classes cannot see these names or responses.

A teacher can remove a membership and restore it explicitly. A removed learner cannot reactivate themselves using the old enrollment code. Removing a learner retains their historical submissions for the teacher. The global owner/admin retains access across classes. School/district organization and school-admin delegation are separate work; this release uses class ownership and enrollment boundaries.

## Where the score comes from

Version: `reasoning-20-v1`. Four criteria, each with six defined anchors from 0 through 5:

| Criterion | Maximum |
| --- | ---: |
| Understand the claim | 5 |
| Support with evidence | 5 |
| Consider another interpretation | 5 |
| Explain a justified conclusion | 5 |
| **Total** | **20** |

The complete anchors are in `lib/pointRubric.ts`. The UI shows the selected anchor, awarded points, maximum points, and a quotation from the learner’s answer. The server sums the four numbers; it never trusts a model-generated total. Percentage = earned points × 5. For example, 4 + 3 + 4 + 3 = 14/20 = 70%.

The first assessment uses the first answer. The final assessment uses both answers and still has a maximum of 20; it does not add the two assessments into a 40-point score. For reading tasks, evidence must connect to the supplied passage. A proposed test is evidence reasoning, not proof that its result already exists.

Each positive criterion requires a supporting quote found in the actual learner answers. Missing criteria, duplicate criteria, noninteger or out-of-range points, and unsupported evidence reject the assessment with a retry message. There is no made-up fallback grade. A failed grading request leaves the answer/draft available to retry.

XP remains separate participation credit: 35 in first-turn feedback, 52 for completion. Only successful synthesis persists account progress. An assignment’s completion is idempotent in the database, preventing duplicate classroom completion/XP persistence calls on replay. Existing XP, streaks, ranks, archived readings, unrelated sessions, and identity/storage keys are retained.

## Language consistency and calibration

Scoring is a separate, fixed English-language evaluator task. It understands EN/ES/FR answers; the coaching display language, coaching randomness, personality history, and previous grades are not inputs. Temperature is 0 with a fixed seed. The scorer must select the same anchors for semantically equivalent reasoning; spelling, grammar, vocabulary, length, and agreement do not earn points.

Authenticated assessments are saved by a fingerprint of rubric version, model, learner, canonical question, and actual answers. Display language is excluded. A language switch changes the UI, not those answers or the saved score. Concurrent identical evaluations retain the first stored assessment. Server-side assignment history also restores the saved breakdown.

A fixed prompt and seed do not mathematically guarantee equal model judgments for every possible translation. Release calibration must compare the per-criterion points—not just total percentages—on matched EN/ES/FR responses. Software tests prove arithmetic, validation, caching inputs, language switching, and persistence contracts; they do not prove universal semantic fairness or educational efficacy. Continue independent bilingual review before treating this as a high-stakes school grade. Scores describe the submitted reasoning, not personality or measured learning gains.

## Data and authorization

The additive migration creates class, membership, assignment, submission, comment, and assessment tables. All have RLS enabled and no browser-role grants; their default-deny posture intentionally produces the informational “RLS enabled, no policy” advisor entry. Access is through signed-session server routes that reverify the account and scope every class and assignment. Mutation routes require the same origin. SQL submission/join functions are SECURITY INVOKER and executable only by the server service role; the actor ID comes from verified server access.

Learners receive their own answers/comments and their class’s alias/completion board. Teachers receive only owned-class records; the global admin may inspect all classes. Grade quotes are private, never included in the leaderboard. Submitted records live in Supabase, not localStorage. Existing browser-only demo state is not imported as real classroom data.

Assignment IDs namespace browser drafts, so the same lesson in different classes cannot overwrite another assignment or an ordinary lesson session. Assigned readings are authorized through active enrollment and a teacher with reading access; they do not grant access to the full unassigned Reading Paths catalog.

## Verification

`supabase/tests/classroom.sql` exercises the live database in a transaction that rolls back all QA data: join, both submitted answers, restore, comment, actual completion count, replay prevention, outsider rejection, removed-member rejoin rejection, and denied client table/function privileges. It has passed against the connected database.

Automated tests cover API origin/session boundaries, teacher ownership, learner isolation, access revocation, actual leaderboard counts, correct assignment links, server-stage recovery on another browser, assignment-vs-ordinary draft isolation, multilingual switches, point arithmetic, evidence validation, and existing four-step/session regressions. Provider and application mocks do not replace an authenticated browser rehearsal with a teacher and learner account. That final presentation rehearsal must confirm login, enrollment, assignment completion, teacher review, and comments on the live deployment.

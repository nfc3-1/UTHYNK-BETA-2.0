# School baseline and reassessment: design for review

Status: proposed October 16, 2026. No assessment is deployed by the Day Three participation-report release. The proposed 24-question length needs teacher/pilot confirmation. Objective marking is possible; a valid, comparable measure of reasoning requires empirical review. This is not an IQ test, a student placement instrument, or a validated academic grade.

## Student and teacher flow

The teacher schedules a Starting Point check for a class. The learner sees instructions, accessibility/language choices, an unscored example, and a save/resume assessment. Assessment mode provides no coach, hints, or numerical rewards for speed. It is separate from the four-step practice experience, not a fifth reasoning stage. Aim for roughly 20–25 minutes, subject to pilot timing; accommodations must not become point penalties.

After about six weeks of practice, the teacher schedules an unseen parallel form. A later third form can check retention. Pilot form order is counterbalanced (A→B and B→A), rather than putting every learner on an easier later form. All scenarios and passages are new to that learner and separate from practice material.

## Proposed blueprint

Each form contains 12 original brief scenarios/passages/chart sets and 24 independently scored decisions, with six decisions for each skill below. Two forms require 48 reviewed questions across 24 different scenarios. The distribution must include several contexts per skill so topic knowledge is not mistaken for reasoning ability.

| Skill | Fixed-key response examples | Points per form |
| --- | --- | ---: |
| Understand a claim | Identify a conclusion, its scope, or a necessary assumption | 6 |
| Evaluate evidence | Choose evidence bearing on a claim; distinguish a measured association from a causal inference | 6 |
| Consider alternatives | Identify a counterexample or an alternative explanation consistent with the supplied facts | 6 |
| Justify a conclusion | Select an inference that follows and the limits that remain | 6 |
| Total | 24 decisions, each worth one point | 24 |

Every key must have a written rationale, evidence in the supplied material, and an explanation of why each distractor is wrong. If reviewers can defend two choices, revise or withdraw the question. A political, religious, or personal position is not marked correct because an author or UThynk favors it. Avoid specialized vocabulary, unnecessary reading load, cultural assumptions, and reliance on facts not supplied.

One point for each correct decision; zero for incorrect or deliberately skipped decisions on a submitted attempt. An unfinished attempt is incomplete, not a zero test. No AI, answer length, grammar, typing speed, confidence rating, agreement, or practice completion changes the mark. Optional written explanations may support teacher review but do not affect the fixed-key total.

## Implementation contract before student release

Use stable form/item/scenario IDs, immutable versions of wording/options/keys, source and editorial provenance, language versions, grade-band intent, criterion IDs, and rationale. Keep keys and draft items server-only. Persist a form allocation before starting, save selected stable option IDs, support idempotent final submission, and calculate totals only on the server. An unknown/duplicated item or an option not belonging to an item must fail validation rather than increasing points.

An attempt belongs to one learner and assigned class/form. Teachers see only their permitted classes, learners only their own results, and administrators only permitted aggregates. Require a fresh access check at each read/write/export. Restarting a browser or changing language must not allocate another form, lose choices, or silently start an extra attempt. No client-supplied score, learner ID, school ID, or answer key is authoritative. Preserve completed attempts; a corrected key produces an auditable revision rather than rewriting historical results without explanation.

## Results and comparability

Show date, form/version, language, complete/incomplete status, correct/possible decisions, and practice suggestions. Six questions per skill provide a limited sample: do not create mastery cutoffs or label someone excellent/weak from these counts alone. Show no growth figure until both completed forms meet the comparison rules.

Before equating forms/languages, show their raw results separately with a comparability notice; do not subtract their totals and call it demonstrated growth. After comparability is supported, report matched-learner change, number completing both checks, missing baseline/follow-up counts, and uncertainty where estimable. Keep practice/participation and qualitative AI feedback separate. No school, teacher, or learner ability leaderboard is introduced.

The same key across English, Spanish, and French is a software requirement, not evidence of equal difficulty. Bilingual reviewers must check inferential meaning, distractors, and reading burden. Test for differences in item behavior; do not pool cross-language results or compare language groups without supporting evidence. Record language/accommodations changes and flag unsupported comparisons.

## Validation sequence

1. Choose the initial high-school grade band and confirm the construct, length, delivery conditions, accessibility, and intended claims with teachers and an assessment specialist.
2. Author original A/B items; independently review their keys, distractors, language, age suitability, and source rights. Never copy proprietary tests.
3. Conduct small think-aloud pilots to identify ambiguity and unexpected background knowledge demands. These establish usability, not reliability or norms.
4. Field-test counterbalanced forms with an adequate sample chosen with a measurement specialist. Examine difficulty, reliability, ceiling/floor effects, item discrimination, form differences, and language fairness. Freeze versions before evaluating change.
5. Conduct the longitudinal pilot. Report attrition and matched students. To claim UThynk caused improvement, add an appropriate comparison design; a simple pre/post increase alone does not establish causation.

Assessment and export tests will need server-only key protection, identical deterministic scoring in all display languages, allocation/resume/replay behavior, membership/grant revocation, alternate-form versions, missing assessments, report denominators, and small-cohort privacy. Passing these tests does not replace validation with students.

## Research informing this proposal

- ETS, Liu, Frankel and Roohr, 2014, [Assessing Critical Thinking in Higher Education: Current State and Directions for Next-Generation Assessment](https://www.ets.org/research/policy_research_reports/publications/report/2014/jsjg.html). Higher-education research informs design considerations; it does not validate a UThynk high-school test.
- International Test Commission, [Guidelines for Translating and Adapting Tests, second edition](https://www.intestcom.org/files/guideline_test_adaptation_2ed.pdf): evidence for construct, method, item, and score comparability.
- Institute of Education Sciences, [WWC questions and answers for developers and researchers](https://ies.ed.gov/ncee/wwc/Document/246): causal evidence and comparison designs.

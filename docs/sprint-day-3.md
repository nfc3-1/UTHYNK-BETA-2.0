# Day Three: school workspaces and trustworthy reports

October 16, 2026. Day Three is school workflow work; Day Two's reading corrections carried into this date. The original Night One walkthrough was completed by the owner on October 15. Phone/tablet layout and native apps remain deferred until after beta.

## Role and navigation contract

Ordinary navigation remains visible, and only authorized staff tools appear in the staff icon. Roles are established by verified server access, never by choosing a UI role. The existing owner can inspect all authorized platform functions. A district assignment is not a global admin role.

| Workspace | Daily task | Records and permissions |
| --- | --- | --- |
| My classroom | Resume the next saved assignment, then start unsubmitted work; inspect own feedback and comments | Only classes with active learner membership; only that learner's submissions, even if the account also teaches the class |
| Teacher | Choose an owned/authorized class, inspect current-roster participation, assign work, review actual answers, save comments | Teaching view excludes classes where the teacher is only a learner; platform owner retains management scope |
| School | Choose an assigned school, inspect class participation, manage authorized staff | Existing school RPC returns aggregate class records, never individual answers, comments, grades, or enrollment codes |
| District | Choose an authorized district and inspect its schools together | Every school is reauthorized through the existing school RPC. Revocation or an unavailable school fails the report rather than returning a partial success |

Setup controls are collapsed once a classroom exists. Teachers join classes as learners through My classroom rather than a competing Join form on Teacher. Organization creation and school staff controls use keyboard-accessible disclosures. Teacher comment drafts are isolated by class and selected learner/assignment for the lifetime of the page; they are not promised cross-device or refresh persistence.

## Implemented operational reports

| Report | On-screen view | CSV |
| --- | --- | --- |
| Student assignment progress | Assigned, completed, first answer saved, not started, next assignment | Own assignment titles, due dates, status, completion timestamps |
| Teacher class participation | Active roster; counts per learner; optional assignment filter | Active learner × assignment matrix, stable learner references, and the same assignment filter |
| School participation | Enrollments, assignments, possible submissions, completions, completion rate | Selected school's class-level rows |
| District participation | Authorized schools together, per-school totals and a weighted total | Class-level rows only for those schools |

Reports use saved records; no demo students, generated results, AI ability grades, or fictional improvement figures are added. Completed means a saved completion timestamp. First answer saved means a saved first response without completion; it does not prove the learner read a passage or spent a particular amount of time. Unsubmitted browser drafts do not appear in server reports.

Possible submissions = active enrollments in a class × assignments in that class. School/district totals sum these class denominators; rates are computed from summed completions and possible submissions, not an average of class percentages. A learner enrolled in two classes is two enrollments, not two unique people. These are current-roster snapshots, not historical attendance or cohort-growth reports. No opportunities produces an unmeasured rate (a dash on screen, blank in CSV), not a zero ability score. Removed learners' saved work remains in the existing teacher review history but is excluded from the active-roster progress matrix.

CSV downloads refresh authorization and read current server records at download time. Headers/statuses follow EN/ES/FR; original names and assignment titles remain unchanged. Completion timestamps and export-generation timestamps use UTC. Report downloads are private/no-store, use fixed filenames, whitelist exported fields, and escape CSV quoting and formula prefixes. School exports never serialize the richer school snapshot or teacher-only material. There is no PDF export in this release.

The new report UI follows the global language setting. The existing management forms are still English; this release does not claim complete dashboard translation.

## Assessment boundary

The owner asked for an objective starting point and subsequent checks. [The assessment design](school-assessment-design.md) specifies a proposed two-form, fixed-key approach. It is a design for review, not a deployed or validated assessment. No assessment scores are invented when a learner has no assessment. No item bank is exposed through these participation reports. The existing four-step learning sessions retain two answers and qualitative, evidence-linked observations. XP and the participation board remain distinct from reasoning performance.

## Verification and review limits

Regression tests cover independent learner/teacher views, actual status counts, former-member exclusions, weighted denominators, empty data, localized downloads, CSV escaping, cross-class and cross-school denial, district scope, mid-report revocation, and private responses. Existing assignment/language/draft/completion tests must keep passing.

Read-only inspection of the connected database confirmed that school authorization/reporting functions remain SECURITY INVOKER with no anon/authenticated EXECUTE grants. The existing classroom and school-isolation transactional suites also passed against the connected database; all temporary QA records were rolled back. No database migration, role grant, authentication setting, or existing saved-session identity changes are required. Review server API tests together with existing transactional school-isolation tests; mocks alone are not a signed-in production walkthrough.

Remaining sign-off: a signed-in owner/teacher/learner check of these new reports and downloads; independent bilingual wording review; assessment specialist review, original item authoring, piloting, and comparability evidence before reporting critical-thinking growth. The earlier Night One walkthrough remains completed and is not silently marked outstanding again.

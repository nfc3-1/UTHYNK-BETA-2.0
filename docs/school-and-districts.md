# School and district boundaries

UThynk separates its platform-owner role from district and school roles. Being a teacher or knowing another organization's ID never grants access to that organization's dashboard. School staff are explicit assignments to registered accounts, not email-domain inference or user-editable metadata.

| Role | Organization scope | Available actions and records |
| --- | --- | --- |
| Platform admin | All organizations | Create districts and independent schools; appoint/revoke district and school staff; place existing independent classes; existing global owner access remains |
| District administrator | Assigned active districts | Create schools within those districts; appoint/revoke school staff; inspect participation totals for their schools |
| School administrator | Assigned active schools | Inspect that school's classes/staff and aggregate participation; add, remove, or restore teachers in that school |
| School teacher | Assigned active schools and owned classes | Create classes in assigned schools; use the existing teacher workflow on owned classes |
| Learner | Classes joined by authorized enrollment | Own answers/comments and class participation, as before |

School administrators cannot appoint, remove, or demote other school administrators. Only district or platform administrators can do that. Only the platform owner can grant district administration. These roles never write `account_access.role = admin`. A district administrator has no implied teaching or individual-answer access.

School and district dashboards contain selected-school staff names and actual counts of classes, active class enrollments, assignments, and completed submissions from current rosters. A learner enrolled in two classes counts as two enrollments. Individual answers, synthesis, comments, grades, and class enrollment codes are not returned by the school-dashboard RPC. There is no invented data, no inferred learning gain, and no ranking of schools by reasoning scores.

See [Day Three workspaces and reports](sprint-day-3.md) for role-specific views, scoped CSV downloads, current-roster denominators, and the separate assessment design.

## Setup and use

1. As the existing platform owner, open **Menu → School / district**, also linked from **Admin**. Create the actual district and school, or choose an independent school.
2. Add registered staff by their exact account email. Select Teacher or School administrator for the chosen school. District roles are assigned separately to the selected district. Buttons explain the scope before applying access. No staff access is automatically granted by this release.
3. A scoped teacher sees **Teacher** in the menu and selects their school when creating a class. A scoped role alone cannot create an independent class. Existing global Teacher permission still permits independent classes.
4. Existing classes retain a null school association. To place one, add its teacher to the target school first, then the platform owner enters the Class ID shown beneath its title in Teacher. Placement exposes that class's participation totals to the school/district administrators. Already-associated classes cannot be transferred through this action; transfers require a separately reviewed workflow.
5. Administrators see only schools covered by their active assignments. Guessing a school ID or changing a request body does not extend scope. A school administrator cannot see another school in the same district unless separately authorized.
6. Remove/restore staff access from the selected scope. School removal revokes management of owned school classes immediately on the next server operation, even if the person retains a global Teacher role. Other school memberships remain intact. Learner submissions are retained. Staff removal does not remove the learner's separate class enrollment.

The school dashboard is an operational overview. Teachers continue using **Teacher → Open Assignment** and the existing private review interface. Reading-assignment feature grants remain governed by existing platform section permissions; a school role does not unlock unrelated restricted features.

## Implementation and verification

Migration `20261015131303_school_district_boundaries.sql` adds districts, schools, scoped staff, audit records, a nullable school association on classes, and operator calibration reports. No existing class is moved automatically. Browser roles have no direct table or RPC grants; RLS is enabled. Service-role-only SECURITY INVOKER RPCs recheck current organization scope. Server routes freshly verify session identity and require the same origin for mutations; private responses use `private, no-store`. The class-school trigger also rejects inserts after a staff revocation.

`supabase/tests/school_isolation.sql` runs in BEGIN/ROLLBACK and covers school A versus school B in the same district, another district, forged requests, unauthorized role elevation, actual counts, answer/code nondisclosure, independent membership revocation, retained submissions, audit writes, and denied browser-role privileges. This suite passed against the connected database; no QA districts, schools, users, or results were retained.

The existing account-password security advisory remains: leaked-password protection is disabled. This release does not change authentication policy. The service-only tables intentionally retain the informational RLS-with-no-browser-policy advisory. See [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) and [the database advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Night One verification

The owner confirmed completing the live signed-in walkthrough on October 15, 2026. Software and transactional tests alone do not replace that check. From the owner's normal browser, verify actual login, school setup, scoped teacher/administrator visibility, enrollment, both learner answers, reopening saved work, teacher review/comment, and participation. Run **Menu → Admin → Run Language Calibration** and inspect each criterion in EN/ES/FR. The report uses authored fixtures, not student answers, and does not affect account XP or classroom leaderboards. Even a passing fixture would not prove universal language fairness or educational validity.

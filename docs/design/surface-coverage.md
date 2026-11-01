# Active surface coverage

Current reality: TanStack file routes; public portal :5137, Staff portal :5138. All `/admin/*` entry points redirect to `/staff/*` at the root boundary, so older admin route implementations and unused `components/guardian/*View.tsx` are not redesign targets. The public landing mounts `guardian/LandingView.tsx`. Existing mock servers stand in for the same authenticated API contracts during inspection; they do not establish production integration readiness.

This matrix was recorded before the comprehensive composition changes. Review status and verification results are completed after implementation.

| Active URL / variant | Mounted source | Data / capability | Primary task and composition direction |
| --- | --- | --- | --- |
| `/vn` | `guardian/LandingView` | Illustrative job records, local CV file selection; real navigation/search transfer | Introduce recruitment, search, scan listings, then choose industry/employer entry; restrained art |
| `/login?role=candidate` | `auth/AuthLayout` + login | Auth API, sessionStorage, `/me` | Readable form, candidate-specific introduction |
| `/login?role=recruiter` | Same, recruiter purpose | Same auth API; Company membership/onboarding determines access | Retain new left recruiter illustration and right form |
| `/register?role=candidate` | AuthLayout + register | Registration API | One clear registration form, validation and recovery |
| `/register?role=recruiter` | Same shared account form | Shared `/auth/register`; Company setup and verification APIs after login | Account first; then create a Company or accept an invitation |
| Staff `/login` | `auth/StaffLoginPage` | Auth API; STAFF role required | Quiet single login form; no registration/audience chooser |
| `/can` | `can/index` + persistent Candidate `AdminShell` | Illustrative introduction/quick links | Open welcome, useful next steps, compact accent |
| `/can/jobs` | `can/jobs` | Static JOBS plus browser-local Company jobs/applications | Search → result rows → selected listing and apply action inside Candidate shell |
| `/can/profile` | `can/profile` + CandidateContact | Shared identity/profile APIs; illustrative skills and detailed experience/education records | Identity editing first; distinguish API-backed fields from local example records |
| `/can/copilot` | `can/copilot` | Preset and generic local answers, no AI API | Questions → readable answer → references; preserve legal wording |
| `/can/account` | Shared `AccountPage` in Candidate shell | Shared USER identity, email proof, password, eligibility and lifecycle APIs | Shared identity settings; separate verification, password and lifecycle actions |
| `/rec` | `rec/index` + persistent RecruiterShell | Illustrative candidate pipeline, local component state; Company verification API | Compact welcome/summary, keyboard-accessible candidate list, selected detail |
| `/rec/jobs` | `rec/jobs` | Browser-local company workspace, author/grant checks | Results and create action; simple summary, real empty versus filtered miss |
| `/rec/applications` | `rec/applications` | Browser-local applications/grants | Compare applicant, role, email and submission in a table/list |
| `/rec/talent` | `rec/talent` | Illustrative talent records and simulated outreach | Selection list, profile details; controls clearly retain simulation limits |
| `/rec/verification` | `rec/verification` | Company API + expectedVersion + active membership | Company form/status; preserve legal dossier fields, validation and retry |
| `/rec/members` | `rec/members` + RecipientInvitationPanel | Invitations API; local workspace grants/history where implemented | Invitation form, role/member records, scoped actions |
| `/rec/account` | Shared `AccountPage` in RecruiterShell | Same USER identity and account APIs; authoritative `/auth/me` membership for recruiter access | Reuse account UI without switching to Candidate shell |
| `/account-recovery` | Public recovery form | Unauthenticated recovery requests; no returned session | Explain eligibility, prove by email, then return to ordinary sign-in |
| `/staff` | staff/index | Real verification count API; other metrics illustrative | Verification queue first; compact mixed-source overview |
| `/staff/verifications` | staff/verifications + DossierHistory | API-backed queue/history/evidence/decisions | Filters/table → retained summary/evidence/history → accountable decision |
| `/staff/jobs` | JobManagementPanel | Explicit sample records and in-page decisions | Operational table and review detail; sample notice stays visible |
| `/staff/reports` | AdminDraftPage reports | Explicit sample governance data | Search/status table, report detail |
| `/staff/accounts` | AdminDraftPage accounts | Explicit sample data/actions, no ban API | Search/status table, account detail |
| `/staff/audit-logs` | staff/audit-logs | Static illustrative log records, reachable directly | Filtered operational log; readable compact records |
| Unknown public path | `__root` NotFoundComponent | Router state | Vietnamese recovery with useful home action |
| Root errors / AuthGate denied/loading | `__root`, AuthGate | Actual request/router failures | Clear distinct messages, retry/login actions; no cheerful empty art |

## Redirects and unused implementations

- `/` → `/vn` in public; Staff portal boundary sends non-Staff paths to Staff login.
- `/jobs` remains public job discovery; `/can/jobs` presents the same discovery in the Candidate shell.
- Legacy `/candidate/*` and `/recruiter/*` deep links redirect to `/can/*` and `/rec/*` respectively, preserving query and hash. `/recruiter/profile` → `/rec/verification`; `/recruiter/hub` → `/rec`.
- `/account` redirects to `/rec/account` when `/auth/me` has an active membership and otherwise to `/can/account`; the shared USER account component retains the route's role shell.
- `/staff/compliance` → Staff jobs; `/staff/candidates` → accounts; `/staff/analytics`, `/staff/monitoring`, `/staff/tasks` → overview.
- `/analytics`, `/candidates`, `/compliance` are legacy aliases routed through admin/Staff boundaries.
- `guardian/CandidateProfileView`, `CandidateJobsView`, `CopilotView`, older recruiter/admin view components are not mounted by the current file routes. No changes are planned there.

## States preserved

Authentication restore/denial, Company verification stage locks, local versus API sources, Staff queue loading/error/empty/filtered states, history retry, unavailable evidence, stale versions, 10–1000-character rejection validation, and decision conflict locks remain behaviorally authoritative. Recruiter access derives from `/auth/me` membership and Company verification APIs; the retired `/employer-registrations` and `/me/employer-onboarding` flows are not called. Visual refinements must not bypass these states.

## Implemented refinements

All active matrix rows were opened in Chromium at 1440px and 390px using the documented mock portals, with normal login and role checks. Before captures are in `/tmp/guardianwork-product/before/`.

Shared typography, controls, sidebar selection/focus, and dialog behavior are implemented. Candidate/recruiter summaries are divided strips; job/pipeline/question selectors are keyboard-accessible lists; selected details have explicit headers and readable prose. Application comparisons use a table. Company verification and member permissions retain their existing business behavior. Staff list/dossier/sample notices use more readable text, and account identity moved below the queue overview. Public/authentication retain the established approved imagery and layout; form text is more readable. Root recovery copy is Vietnamese.

A content approval request remains pending for replacing unsupported verification/AI/identity claims. Those claims have not been silently rewritten. Source disclosures now explicitly identify illustrative content and browser-local limits; names already supported by authenticated data are used where available. Legal answer wording and business rules remain unchanged.

Final after captures, test results, and any material limitations are recorded in the product refinement handoff.

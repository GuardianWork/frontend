---
version: 1
slug: "src-routes-rec-applications-tsx"
primary_target: "src/routes/rec/applications.tsx"
related_targets: ["src/routes/rec/applications_.$jobId.$applicationId.tsx","src/components/recruiter/ApplicationReview.tsx","src/components/recruiter/application-labels.ts","src/components/recruiter/applications.css","src/services/recruiterApplications.ts"]
---

# Recruiter application review

Scope: `/rec/applications` shows all applications the active Company Owner or assigned Recruiter may process; optional `?jobId=…` filters that same inbox to one job. Candidate names link to `/rec/applications/:jobId/:applicationId`, a dedicated review page. Visitor mode: Operate. Review submitted evidence and update application status. Forward stages apply immediately; rejection and hiring require confirmation. Hiring is recorded only after an external discussion in which the candidate agreed to join.

## Direction contract

THESIS: Keep the applicant comparison table focused on scanning and quick status actions; give each candidate a dedicated review page where decisions sit beside submitted evidence.

OWN-WORLD: Inherit GuardianWork's Hanken Grotesk, monochrome workspace chrome, blue content actions, white surfaces, thin rules and semantic status tags.

STORY: Search and filter the authorized inbox across jobs. Open the status badge dropdown from a table row or the candidate's dedicated page; both controls use versioned detail and offer the same valid forward updates or confirmed rejection. Recruiters may progress an application to interviewing from under review or shortlisted. They may mark it hired from under review, shortlisted, or interviewing after confirming the candidate's agreement; this is terminal. Interview scheduling, offer exchange, and candidate acceptance do not take place in GuardianWork. Inspect immutable contact/cover-letter/CV evidence and history on the dedicated page. When the inbox spans jobs, show each row's job title beneath the candidate name. Carry an optional source `jobId` into the detail page so its back-link restores that filtered inbox. Show history actor names with a neutral fallback when no name is available; never expose database IDs. Internal rejection reasons and optional candidate feedback remain separate. Rejected and withdrawn records hide personal evidence; hired records retain it while the recruiter remains authorized. All terminal states offer no further processing.

FIRST VIEWPORT: At 1440×1000, retain the workspace frame; show either the all-jobs inbox context or the selected job context. Name search and eight status filter controls (all plus the seven lifecycle states) sit above a comparison table. Each row shows candidate, job title when spanning jobs, actionable status badge, and submission time. The candidate link opens a full-page review with the same actionable status badge in its identity header, submitted evidence, explicit PDF viewer, and status history with actor names. The badge is the status control in both places; avoid a second action section. Use normal page scrolling; rejection and hiring use focused confirmation forms.

FORM: Local extension of the approved table; code-led implementation. No concept roll applies to this approved narrow extension.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

COMPLETION: SHIP. The independent reviewer found no material implementation defects and scored the documentation finding resolved. For the current lifecycle extension, 118 service tests passed, 13 recruiter/lifecycle desktop flows passed, and five focused candidate/hiring regression flows passed (including three existing candidate cases). Final build, lint, TypeScript, and diff checks passed. All three lifecycle states were visually reviewed cleanly at 1440×1000; screenshots are in `.impeccable/review/lifecycle/{candidate,hiring,hired}-desktop.png`. The live backend was not exercised. `DESIGN.md` and `.impeccable/design.json` remain unchanged.

## Incumbent pattern reuse

The inbox keeps the existing recruiter job workspace frame and shared page-header/button treatment, uses the shared `ListSearch` control, workspace data-table and semantic status-tag patterns, and `AdminPagination`. The new detail route reuses the `ApplicationReview` content and existing typography, surfaces, dividers, focus, action, and status treatments in a page layout. One status badge dropdown component is shared by table rows and the full-page identity header; both use the same versioned actions and rejection dialog. History presents a resolved actor name or a neutral fallback, never a database identifier. No global design tokens or visual system changed. Desktop review evidence at 1440×1000 includes `.impeccable/review/recruiter-dedicated/`: `list-desktop.png`, `detail-desktop.png`, `status-menu-desktop.png`, `evidence-desktop.png`, `terminal-desktop.png`, and `rejection-desktop.png`; and `.impeccable/review/recruiter-actor-names/page-status-desktop.png` and `history-desktop.png`.

## Behavior and constraints

Use the real company-scoped inbox endpoint for all authorized applications, with optional `jobId` filtering through that same endpoint. Use each row's `jobId` and application `id` for existing detail, PDF and versioned status APIs. The same status badge dropdown appears in table rows and the detail identity header. List menus load detail/version on opening; the dedicated page uses its loaded detail/version. Valid forward changes use the current version and handle conflicts. `SUBMITTED` can advance to under review or shortlisted; `UNDER_REVIEW` and `SHORTLISTED` can advance to interviewing; `UNDER_REVIEW`, `SHORTLISTED`, and `INTERVIEWING` can be marked hired after an explicit confirmation that the candidate agreed to join externally. Rejection and hiring require confirmation. Hired is terminal and retains authorized recruiter evidence; rejected and withdrawn are terminal and hide it. Candidate-name links open the dedicated full-page route; `fromJobId` restores the filtered list on return. Detail pages provide contact and cover-letter evidence, explicit authenticated/uncached PDF viewing, and status history with actor names or a neutral fallback; never render raw database IDs. The page uses normal scrolling without an inline panel, separate action section, or close control. Invalidate all recruiter-application list caches for the current Company scope after status mutations and return focus to the list heading after row-menu mutations. Support all seven backend states, forward skipping, required OTHER explanation, separate optional candidate feedback, and 1000 Unicode code point text limits. Handle loading, genuine empty versus filter miss, server errors, access loss, stale versions, and unsupported CV formats. Candidate labels, counts, history privacy and versioned withdrawal are specified in `.impeccable/surfaces/src-components-candidate-myjobsview-tsx.md`. Desktop-only verification at 1440×1000. Preserve recruiter routes, workspace shell, and published git history. No new product claims or visual system changes.

## Recruiter status terminology

Display backend `SHORTLISTED` as “Tiềm năng” consistently in recruiter filters, badges, status-menu actions, history, and update notices. This is a display-label change; workflow transitions and the API enum remain unchanged.

## Status dropdown polish

The shared desktop dropdown groups its heading and current status in a bordered header. Available forward actions use distinct Lucide outline icons at 18px with a consistent 1.75px stroke: FileSearch for review, ListChecks for potential candidates, MessagesSquare for interviews, and UserCheck for joining. CircleX identifies rejection; a divider separates rejection, with red hover/focus treatment. The notification reminder sits in a quiet footer and is omitted for terminal records. Preserve the existing actions, confirmation, version checks, loading/error handling, and keyboard behavior. The panel is 304px wide with a 12px radius; compact 6px action corners match the existing local controls. The detector's 13px type advisories match the established metadata treatment documented in DESIGN.md.

Verified the rendered menu in the inbox and dedicated application page at 1440×1000. All 11 desktop flows, TypeScript, lint, production build, and diff checks passed after this frontend-only polish. Backend behavior is unchanged.

Recruiter action-icon polish verified at 1440×1000 in the inbox and detail menu. Both focused desktop interaction tests, TypeScript, ESLint, and diff checks passed. Candidate status icons remain unchanged. Review captures stay local and excluded from Git.

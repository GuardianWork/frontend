---
version: 1
slug: "src-components-candidate-myjobsview-tsx"
primary_target: "src/components/candidate/MyJobsView.tsx"
related_targets:
  [
    "src/routes/can/applied.tsx",
    "src/routes/can/applications.tsx",
    "src/components/candidate/my-jobs.css",
    "src/services/candidateApplications.ts",
  ]
---

# Candidate application tracking

Scope: `/can/applied` is the candidate's My Jobs application ledger; `/can/applications` redirects here. Visitor mode: Operate. Track application status and, while eligible, withdraw an application.

## Direction contract

THESIS: Extend the existing application cards with progressive status detail, keeping the ledger as the candidate's single place to track submitted applications.

OWN-WORLD: Reuse GuardianWork's Hanken Grotesk, monochrome workspace frame, blue content actions, white surfaces, existing card treatment and semantic status tags. Add no new design tokens.

STORY: Candidates search and filter application cards by status. Each of the seven backend states has a Vietnamese and English label and its own exact count; the All filter shows the total. Expanding a card loads the authenticated, candidate-visible status history with dates and any candidate feedback. It does not show recruiter identity, internal rejection reasons or other internal review notes. Candidates can confirm a versioned withdrawal from submitted through interviewing. Hired is terminal; no withdrawal action is offered. Interview coordination remains outside GuardianWork, and the hired status records the recruiter's confirmation of the candidate's external agreement.

FIRST VIEWPORT: At 1440×1000, preserve the existing My Jobs heading, search and status filters above the application-card list. Retain each card's job, company, application date, submitted-CV receipt and status summary. On expansion, place the status history beneath the existing receipt and show the withdrawal action only for eligible states. Keep the existing card layout, blue actions, tag colors and page scrolling.

FORM: Local extension of the existing candidate application ledger; code-led implementation. No concept roll applies.

FINISH: Desktop evidence at 1440×1000 is `.impeccable/review/lifecycle/candidate-desktop.png`. The candidate screen was visually reviewed cleanly. Five focused candidate/hiring regression flows passed, including three existing candidate cases. Build, lint, TypeScript and diff checks passed. The independent reviewer returned SHIP and scored the final documentation finding resolved.

## Behavior and constraints

Show six candidate-visible status filters and exact counts in both locales: `SUBMITTED`, `UNDER_REVIEW`, `INTERVIEWING`, `HIRED`, `REJECTED`, and `WITHDRAWN`, plus All. Recruiter-only `SHORTLISTED` is projected to `UNDER_REVIEW` in candidate cards and history; merge both internal stages in the review filter and count before pagination. Collapse consecutive review history entries so shortlisting does not add a visible event. Keep the original version for withdrawal. Filter labels are “Đã ứng tuyển” / “Submitted”, “Đang xem xét” / “Under review”, “Phỏng vấn” / “Interviewing”, “Đã tuyển” / “Hired”, “Đã từ chối” / “Rejected”, and “Đã rút” / “Withdrawn”; All is “Tất cả” / “All”. Expand loads `/candidate/applications/{id}` without caching; render only the returned status, version, history statuses, dates and candidate feedback. Never expose recruiter actors, internal rejection reasons or internal explanations. Withdrawal confirmation sends the current version to `/candidate/applications/{id}/withdraw`; allow it only for `SUBMITTED`, `UNDER_REVIEW`, `SHORTLISTED`, and `INTERVIEWING`. A stale-version conflict requires status reload. `HIRED`, `REJECTED`, and `WITHDRAWN` are terminal and have no withdrawal action. Preserve the candidate route, workspace shell and existing visual system. Desktop-only review at 1440×1000; do not create or verify mobile/tablet layouts.

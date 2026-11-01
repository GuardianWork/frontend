# GuardianWork

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

GuardianWork serves candidates and recruiters across many industries in Vietnam. Administrators oversee company verification and compliance. Relative priority between these audiences is deliberately undecided. Do not position the platform as IT-only.

## Product Purpose

Connect candidates and recruiters through a recruitment platform with company verification and Vietnamese labour-law support. Preserve the existing application workflows when redesigning the interface.

## Positioning

The product combines recruitment, company verification, and labour-law support. The user confirmed that this is a multi-industry recruitment platform; technology is one category alongside sales, marketing, finance, HR and operations. A distinct competitive advantage beyond this combination has not been confirmed.

## Operating Context

The codebase provides Vietnamese and English language dictionaries, with Vietnamese as the default. Public pages introduce the product and lead into candidate and recruiter journeys. Authentication routes users into candidate, recruiter, or administrator workspaces.

## Capabilities and Constraints

- Candidate surfaces include job browsing, saved jobs and applications, a profile, and a legal copilot.
- Recruiter surfaces include an overview, jobs, applications, talent, company profile, company verification, and workspace members.
- Shared account control is available in Candidate `/can/account` and recruiter `/rec/account` context for the same `USER` identity: names and phone, email verification, password changes, deactivation and deletion requests. Public recovery is at `/account-recovery`; `STAFF` is excluded. Lifecycle requests result in `DEACTIVATED` or `DELETION_PENDING`, not immediate erasure. This frontend expects backend migration `V2026.10.31.94` and older `fullName` writers to be stopped before rollout; live backend and mail delivery are unverified.
- Candidate identity and profile summaries use the account/profile APIs. Existing detailed experience and education records remain illustrative local records; no backend record schema is established for them.
- Administrator surfaces include verification, analytics, candidates, and compliance. The compliance screen lists published JDs flagged by AI for administrator investigation. The staff job-management page uses the authenticated backend revision queue, details, history, and version-checked approve/reject decisions. Staff hide/restore and AI findings are unavailable in the current job-review API. Company verification remains a separate workflow.
- Authentication, company verification, membership, and recruiter job publishing have service modules. The recruiter jobs workspace uses the real API for drafts, preview/submission, revision history, lifecycle controls, and owner-managed assignments. Published content and pending revisions remain distinct; backend available actions and version checks govern changes. Candidate browsing retains its existing sample/local flow; staff job review uses real API requests. Backend availability and live end-to-end production readiness have not been confirmed.
- Some existing interactions are simulations: the landing-page CV flow uses local timers, and the legal copilot uses preset and generic local responses. These do not establish functioning AI integrations.
- Keep existing routes, role distinctions, content, and task flows during redesign. The implementation uses React, TanStack Start file-based routing, Vite, Tailwind CSS, and Radix UI primitives.
- The repository is connected to Lovable. Preserve published Git history and keep the connected branch working.

## Brand Commitments

Preserve the GuardianWork product name and the product facts represented by the existing application. The user chose a familiar recruitment-platform design, with VietnamWorks as the craft reference, and code-first implementation. Use the `/rec` black, white, charcoal, and gray system for public, authentication and recovery, candidate, recruiter, and staff chrome. Use blue highlights in public discovery content and the main content area of all three workspaces; keep headers and sidebars monochrome. Reserve semantic red and pale pink for attention notices. Do not expose a theme selector or restore alternate saved palettes.

## Evidence on Hand

- Product copy and bilingual dictionaries: `src/lib/dictionary.ts`.
- Public and candidate views: `src/components/guardian/`.
- Role-specific routes: `src/routes/can/`, `src/routes/rec/`, and `src/routes/admin/`.
- Authentication, company-verification, and membership integrations: `src/services/`.
- Existing legal, AI, customer-count, and compliance claims in interface copy are implementation evidence, not independently verified proof. Do not invent or strengthen those claims.

## Product Principles

- Preserve complete candidate, recruiter, and administrator task flows through visual changes.
- Keep company verification and labour-law support connected to the recruitment experience.
- Distinguish working integrations from simulated interactions when describing capabilities.
- Derive product behavior from the existing implementation; record unresolved decisions rather than inventing requirements.

## Open Decisions

Audience priority, measurable success criteria, production readiness, and product-specific accessibility requirements remain unspecified.

## Staff portal

Platform staff runs as a separate frontend surface on port 5138 (`staff` / `staff-mock` Vite modes), alongside the public app on 5137. It has a login-only entry with no registration or audience selector. The existing auth API and server-issued `STAFF` role remain authoritative. Tokens are scoped to each portal's origin; private routes restore `/auth/me` before rendering. Staff builds use `.output-staff`; public builds use `.output`.


## Supported display and verification scope

Desktop web only, as confirmed by the user. Impeccable work uses desktop review (1440×1000 by default); do not build or verify mobile/tablet versions, capture phone/tablet screenshots, or run mobile/responsive checks unless explicitly requested. This supersedes older mobile requirements in design records and surface briefs. Existing responsive styles are incidental implementation, not a supported product requirement.


The user confirmed blue GuardianWork logos across all sites. Use dedicated logo blues on light and dark backgrounds while retaining the existing monochrome chrome and blue actions.

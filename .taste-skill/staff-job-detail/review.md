# Staff job detail — desktop review

## Inline analysis polish — 2026-11-15

Retained Framed sheet (seed 2048302028), GuardianWork Hanken Grotesk and blue content accents; no redraw. Question: which submitted passage needs attention before a decision? The shared recruiter passage renderer supplies the signature: each highlighted passage is immediately followed by its independently collapsible finding and citations inside “Mô tả công việc”. Analysis lookup, refresh, and the collapsed full report now live within that section. The full report remains available for findings that cannot be anchored unambiguously. Its redundant visible heading and divider were removed; disclosure and refresh share a compact footer.

Desktop critique: the job description leads the reading sheet, and evidence follows its highlighted text before the next passage. The decision rail remains aligned and stationary while the reading sheet scrolls. Blue identifies actions and references, amber identifies review evidence, and semantic statuses remain unchanged. Finding counts come from the scan. Empty, error, processing and stale states retain their distinct behavior. No charts, new images, invented claims, new sample product data, or mobile/tablet changes. The full report repeats evidence only after explicit expansion, preserving access to unanchored findings. Design 8/10, usability 8/10, creativity 7/10, content 8/10; the scope is consistency with the recruiter view.

Verification: source taste lint 0 FAIL / 0 WARN; ESLint, formatting and diff whitespace checks pass. Staff production build passes. The standard Vite preview fails on its missing `dist/server/server.js`; a temporary local adapter served the generated worker and assets without repository configuration changes. Five desktop Playwright checks pass against that production output, covering analysis restoration, polling/error/empty states, revision switching, inline placement and independent keyboard disclosure, and scroll containment. The skill inspector measured a static capture of the production-rendered authenticated detail at desktop width 1440: 0 FAIL / 0 WARN. Both inspector screenshots and the live production capture at 1440×1000 were opened. Artifacts: `/tmp/gw-inline-taste-inspection/`, `/tmp/gw-inline-production.png`; mock legal text is test-only and does not validate a live provider or backend integration.

Direction: Framed sheet, seed 2048302028; retained GuardianWork palette/type and existing staff chrome. User steering replaces the dealt tab convention with one combined content/AI reading view. No new imagery, sample claims, dependencies or design-system tokens.

Question: Can this submitted revision be approved, and what evidence needs review?

## Before / after

- Before: AI lookup sat below revision history and required a shared scan ID. After: analysis resolves automatically for the viewed saved revision, above the content; findings annotate that same text, with the full report expandable in place.
- Full detail selection previously existed only in local state. Job revisions, user/company accounts and verification dossiers now have concrete routes; validated list filters survive return and refresh. Report quick views remain modal.
- A 150-line JD reproduced a 4,755px document at a 1,000px viewport. An absolutely positioned sr-only caption escaped to BODY. Giving workspace main a positioned containing block reduces document height to 1,000px while its internal content still scrolls. Overscroll is contained; the header stays at y=0.

## App critique

1. Question/hierarchy: the JD is the main object; approval, eligibility and separate publication controls remain visible beside it.
2. Edges/density: equal outer margins and aligned sheet/rail, with history below. Long reports scroll inside the workspace rather than expanding the document.
3. Colour/identity: Hanken Grotesk, the existing brand mark, neutral frame and blue content accents remain. Semantic statuses retain the established palette.
4. Data: title, salary, revision identity and states come from API content; analysis counts come from actual findings. Submission-only locking-version changes can reuse matching content, without confusing locking versions with JD revision numbers.
5. Empty/errors: no matching analysis is distinct from unavailable lookup, failed processing and stub mode. No scan-ID field or invented zero-risk claim.
6. Evidence: annotations and citations use the existing recruiter evidence renderer; stale/stub results never mark current content. No charts or legends are needed.
7. Device scope: desktop only at 1440×1000. No mobile/tablet verification in this final pass.

Visual score: design 7.5, usability 8, creativity 7, content 8; weighted 7.6/10. The established administrative shell is intentionally retained. The larger limitation is integration, not appearance.

## Verification and boundary

Final production desktop inspector: 0 FAIL, 0 WARN. Captures were opened and checked in `.impeccable/review/staff-job-detail/inspection/`. Targeted TypeScript, ESLint and source style checks pass; staff/public production builds pass. Staff browser tests cover version lookup, refresh, lifecycle reuse, revision selection, polling, error/empty separation and document containment. Recruiter tests cover saved-result restoration, no-working-revision display, inline evidence and automatic editor scans. Routing/account/verification/login and moderation flows were exercised with local mock APIs.

Automatic discovery requires proposed latest-analysis read endpoints in the sibling backend. This is not implemented in that repository: its AGENTS.md requires explicit branch/API approval, requested asynchronously and still pending. Frontend tests use the proposed contract at the mock boundary; they do not prove live backend or provider availability. Backend work plan: `/tmp/guardian-version-analysis-api-plan.md`.

# Recruiter JD and inline AI review

Route: `/rec/jobs?jobId=…`. Supported review viewport: 1440×1000.

## Direction and product question

Achromatic ledger, seed **1073330870**, drawn for a workspace/detail screen with existing palette and Hanken Grotesk retained. No redraws. The persistent recruiter shell is retained as a project constraint rather than replaced by the sheet’s generic no-sidebar shell. Brand-blue content links and existing semantic status colors remain; a near-black analysis action anchors the review rail.

Question: “Which parts of this current JD need my attention, and what evidence supports the AI comment?” GuardianWork’s quoted findings become annotations on the actual saved JD. The live interaction is expanding a comment’s supporting evidence directly beneath its highlighted passage.

Inventory: job title and ID; latest saved revision and version; working/published distinction; current JD text and formatting; supplied salary/location/work arrangement/deadline; explicit scan request and save-before-scan; queued/running/completed/failed states; findings with severity and source quotation; legal applicability caveats; stale results after changes; assignments and publishing actions. No statistics or legal conclusions are invented.

## Delivered layout and behavior

- One job title, at 24px, replaces the earlier 36px heading plus duplicate 24px title in the JD.
- The desktop reading column and 380px analysis rail share the page. At the captured 1068px content width, the arithmetic is 664px JD + 24px gutter + 380px rail.
- Findings appear in the main JD: the AI’s explanation and severity sit immediately above the highlighted passage; a native expand control at its lower right reveals verdict and legal references. The JD’s upper-right corner shows the report’s current finding count, including zero after a completed scan.
- Formatted descriptions retain emphasis and lists; legacy content remains literal text and never executes embedded HTML. Matching uses rendered text, so a quoted phrase can cross bold/emphasis nodes. Exact, unique passages are annotated; ambiguous repeated or unmatched passages remain available in the complete side report rather than guessing which text to mark.
- Inline annotations are shown only for the matching revision/version while the report is current. Local changes, dialog edits, changed versions or outdated reports remove highlights and replace the count with an update-needed state.
- The scan panel stays mounted across detail tabs to retain its result, while approved/history views hide working-revision analysis. Editor and preview workflows retain their existing save, validation, conflict and publishing behavior.
- The analysis rail scrolls independently, has keyboard access and keeps management controls grouped beneath analysis. The creation wizard keeps its existing flow.

## Review

Baseline screenshot: `.taste-skill/recruiter-job-detail/before/desktop.png`. Production captures: `.taste-skill/recruiter-job-detail/after/`. Inspector report and screenshots: `.taste-skill/recruiter-job-detail/inspect/`.

ROUND 1
Seen in one second: A repeated job heading and separate administrative rail; analysis follows the full JD.
Idea (one sentence): Quoted legal findings become comments attached to their passages in the current JD.
Live thing: Request a scan and expand its evidence.
Layout words by section: title=repeated / JD=sheet / analysis=below / management=rail.
Scores: design 6.5 · usability 6.5 · creativity 6.5 · content 8 → overall 6.7.
Caps applied: App-screen rubric; page imagery and motion floors do not apply.
Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. Baseline desktop: the analysis starts below the JD. Move it alongside the reading column.
2. Baseline desktop: the job title repeats at two large sizes. Keep one 24px object title and a compact revision heading.
3. Initial side-by-side capture: findings still require comparison against a separate excerpt. Annotate the matching passage, put the comment above it and evidence expansion below it.

ROUND 2
Seen in one second: The current JD with a highlighted passage, an AI comment directly above it and the finding total beside its heading.
Idea (one sentence): Quoted legal findings become comments attached to their passages in the current JD.
Live thing: Expand the passage’s evidence without leaving the JD.
Layout words by section: title=object / JD=annotated document / analysis=review rail / management=disclosure.
Scores: design 8 · usability 8 · creativity 7 · content 8 → overall 7.8.
Caps applied: App-screen rubric; existing shell and semantic status colors retained.
Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. No blocking collisions, clipping or unreadable sources in the final desktop captures.
2. Long reports require scrolling the right rail; the main passage still carries its own expandable evidence.
3. Ambiguous repeated quotations are intentionally left to the full report; no guessed highlighting is applied.

## Verification

- Production build, TypeScript, targeted ESLint, Prettier and diff checks pass.
- **24 desktop-safe recruiter regressions pass against the compiled build.** They cover inline comment/highlight/expander geometry, count, keyboard expansion, stale removal, Markdown emphasis, literal legacy HTML, assignments, publishing controls, revision history, read-only states, scan polling/conflicts/outages and late-response guards.
- The existing creation-storage regression references a “Lưu bản nháp” button absent from the current guided creation flow; it failed independently of this detail redesign and was excluded from the final scoped run. Tests that switch to mobile/tablet viewports were excluded from the final desktop suite.
- The design inspector runs on the actual compiled route with captured local test API responses: **0 failures, 0 warnings at 1440×1000**. A temporary local adapter serves the worker/assets; the skill inspector is adapted only for authentication, response replay and the desktop height. Every listed final screenshot was opened.
- API responses and the synthetic JD used in screenshots are UI fixtures, not proof of live-provider availability. No sample content was added to the shipped UI, no new dependencies or images were added, and backend contracts were preserved.

## Immediate inline results polish — 2026-11-14

This refinement follows the newer text-first layout: each highlighted sentence or paragraph is followed immediately by its AI result. Each finding uses its own native disclosure, open by default, with its label, severity and chevron on one full-width control. Results can collapse independently; legal citations remain separate nested disclosures. The explanation uses readable 14px body text. Removed the decorative inset severity stripe and obsolete rules that hid retired inline-analysis classes; severity stays on the highlighted text and explicit badge. The rest of the JD, count, scan workflow and working-revision safeguards remain intact.

Three focused regressions pass on the compiled production build at 1440×1000. They verify the less-than-24px gap from passage to result, immediately visible explanations, independent collapse across two paragraphs, Enter-key operation, citation expansion, stale-result removal, formatted emphasis and literal legacy HTML. Build, TypeScript, targeted ESLint, formatting and diff checks pass. The single Impeccable detector pass reports only compact-size/radius advisories consistent with the existing workspace; it finds no blocking antipatterns. Current-source baseline and final open/collapsed/citation screenshots are in `.taste-skill/recruiter-job-detail/polish-before/` and `polish-after/`. These use explicit test HTTP reports, not a live-provider claim.

## Per-sentence placement and removal of the right-side AI panel — 2026-11-14

The latest request supersedes the side-by-side analysis rail: AI controls now live in the main reading column, while the 290px right column contains only assignments and publishing. Completed reports are available in a main-column disclosure; scan loading/errors and the explicit stub disclosure remain visible. Each current finding stays inline with its source text.

A paragraph containing multiple findings is now split at the appropriate sentence endings, preserving inline formatting. Each marked sentence is immediately followed by its own expanded result, explanation and open quotation, rather than collecting both results at the paragraph’s end. Decimal punctuation inside values such as 3.000.000 is preserved. List items retain their list structure; ambiguous repeated quotations still remain in the full report instead of receiving guessed highlights. Missing salary metadata uses secondary text rather than a highlighted salary treatment.

A regression uses the supplied CCCD-retention/deposit scenario as explicit test content. It checks two findings within one paragraph, one result per passage, the first result before the second sentence, and visible legal quotations. The main-column regression asserts there is no scan panel in the right rail. Thirteen desktop detail/scan regressions pass on the development build, including polling, outages, conflicts, late responses, formatting, keyboard operation and stale guards. Production build, TypeScript, ESLint and diff checks pass. The detector’s findings are limited to existing compact type/radius advisories. Legal text in the regression is test data and does not establish live legal applicability or provider availability.

Final confirmation: all **13 scoped desktop regressions pass on the compiled production build** after removing right-side analysis. The CCCD/deposit fixture’s first and second passage captures are saved under `.taste-skill/recruiter-job-detail/main-inline/`; both were reviewed at 1440×1000.

The latest simplification removes the full-report disclosure, analysis heading, repeated revision line and introductory hint from the current-JD toolbar. Only “Kiểm tra nội dung với AI” remains there. Inline results and open quotations are preserved; transient request errors, pending/failed states and explicit stub notices remain available. The editing/creation scan presentation is unchanged. Two focused desktop regressions, production build, TypeScript and ESLint pass; the detector reports no blocking findings.

The current-JD AI button now shares the desktop tab row, aligned to its right edge. Loading and error feedback span the reading column underneath that row. A regression measures the tab and action centers (under 2px difference), then verifies the inline results and independent evidence toggles. Three focused desktop checks, build, TypeScript, ESLint and diff checks pass. The existing editor and creation layouts are retained.

### Draft editor analysis

In the desktop “Soạn tin” tab, AI feedback now lives inside the description field. ProseMirror decorations highlight exact, unique excerpts without changing the saved text, formatting, or undo history. Hover or keyboard focus opens a compact analysis popup with severity, explanation and expandable citations; Escape dismisses it. Edits immediately clear stale marks. The existing scan controller stays mounted across tabs and saves the draft before automatically requesting analysis after five idle seconds. Subsequent edits restart the delay; failed requests require a retry or another edit, avoiding an automatic failure loop. The separate “Phân tích JD bằng AI” section and manual scan button are removed from this tab. Inline status includes the autosave notice, pending, trial-mode and failure/retry feedback.

Desktop verification (1440×1000) covers automatic initial analysis, debounce after repeated input, exact persisted new text, stale-highlight removal, hover and keyboard popups, citations, failure/retry, scan access loss, and the existing current-JD annotations. Build, TypeScript and targeted ESLint pass. The detector reports advisory token/ramp findings only; new highlights use the existing semantic warning/danger tokens.

### More visible detail tabs

The detail-only desktop navigation now has a pale discovery-blue surface, roomier 44px tab targets, blue text for available destinations, and a saturated blue selected tab with white text. Hover and keyboard focus are distinct, with reduced-motion support. This intentionally adds color to navigation at the user's request, retaining the existing Achromatic ledger composition (seed 1073330870), type, and all tab behavior. The AI action remains on the same row. Creation and smaller-screen layouts are unchanged.

Desktop review at 1440×1000: the selected view reads immediately, inactive destinations remain legible, and the action aligns with the tabs. The existing detail navigation/AI regression passes; production build and source style lint pass (0 failures, 0 warnings). The screenshot review used the running app, rather than the skill's authenticated-route inspector.

ROUND 1
Seen in one second: the job title and a clear blue selection for the current detail view.
Idea (one sentence): GuardianWork's existing discovery blue makes the current JD view easy to locate.
Live thing: switching between current content, editing and revision history.
Layout words by section: header=retained / navigation=blue grouped destinations / content=retained / management=retained.
Scores: design 8 · usability 8 · creativity 6 · content 9 → overall 7.8.
Caps applied: app-screen conventions; no claim of a new visual direction.
Top three problems: none remaining within this tab-color and spacing refinement; broader page design is retained.

### Live AI outage diagnosis (2026-11-14)

The synthetic JD #118 could reach the backend, but scan #11 was terminally FAILED with ADAPTER_UNAVAILABLE after three connection failures (12/10/9 ms). Port 8011 had no listener. The read-only AI preflight passed; starting the existing `bash ai/run-local.sh adapter` command from the sibling `guard-work` root restored the adapter with the matching crawler profile/corpus. No application code, dependency, schema or scan history was changed.

An unchanged request deliberately reused failed scan #11 even after the service recovered. Failed runs are immutable and there is no fresh-retry API for identical content. A harmless note was appended only to the synthetic unpublished draft, creating revision version 1 and a new scan #12. It progressed QUEUED → RUNNING → COMPLETED with two findings and two grounded citations. Repeating the original API diagnostic then returned that completed scan. Live desktop browser verification against the real backend confirmed two current-JD highlights, two inline results, two editor annotations and the hover popup, with zero page errors. No API mocks or substitute reports were used. The adapter was left running for further local testing.

Recovery: start the adapter before scanning. If an input already has a terminal failed run, change the draft content and scan again; clicking retry on unchanged content reuses that failure. Do not delete or rewrite persisted scan history to work around it.

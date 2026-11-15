# Candidate Copilot conversation redesign

Route: `/can/copilot`. Desktop review: 1440×1000. Existing global navigation, GuardianWork blue, Hanken Grotesk and the five legal sample answers remain in place.

## Direction

Achromatic ledger, seed **101476411**, drawn for a support/inbox screen with palette and type retained. No redraws. The inbox pattern becomes a session conversation rail beside the open transcript; the existing global shell remains authoritative. The brand blue identifies legal references and the send action.

Screen question: “What can I ask about my employment situation, and how can I keep the conversation readable?” The signature is a continuous Vietnamese labour-law question/answer thread with references attached to the answer they support. The live interaction is asking a follow-up while keeping the composer visible.

Data inventory: candidate account; five sample topics (probation, holiday pay, notice, severance, salary deductions); original questions and answer passages; per-answer article references; source portal; custom generic local response; clipboard copy; session conversations and drafts; explicit sample/no-AI disclosure. No backend chat or history contract is inferred.

## Delivered behavior

- An empty state offers four starter questions; all five original topics remain available in the rail.
- Preset and custom questions append exchanges instead of replacing the visible answer. Custom replies do not inherit unrelated preset citations.
- New conversations and draft switching retain content in memory during the open session. Reloading clears this history; the rail states its scope.
- The transcript scrolls independently. The composer stays visible, expands with its text, sends on Enter, and inserts a newline with Shift+Enter. IME composition does not submit a question.
- Legal samples, per-answer references, copy success/failure, the source portal and the no-AI disclosure remain available. Answer text is preserved; this redesign does not verify its legal accuracy or establish a functioning AI service.

## Desktop critique

| Check              | Before                                                   | Final                                                |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------------- |
| Main task          | Custom input below a long topic list                     | Composer visible in the first viewport               |
| Reading flow       | Question and answer replace a selected detail            | Continuous transcript with distinct question bubbles |
| References         | Custom results could show the active preset’s references | References belong to their own preset response       |
| First-screen h1    | 38px                                                     | 22px                                                 |
| Inspector          | 0 failures, 1 title-size warning                         | 0 failures, 0 warnings on compiled worker            |
| Source design lint | 0 failures, 3 resting-shadow warnings                    | 0 failures, 0 warnings                               |

App-screen critique: the conversation is the dominant workspace, with one stable composer; rail and chat fill the available canvas; colour stays on the existing brand, references and send action; there are no invented totals, charts or queue counts. Empty, draft, populated, copy-success and copy-failure states were exercised. Desktop-only scope intentionally excludes phone/tablet review. Self-assessed final craft: hierarchy 8/10, task clarity 9/10, consistency 8/10. The second rail uses horizontal space but keeps the existing workspace navigation intact and makes session switching explicit.

## Verification and evidence

- Three Playwright desktop tests cover multi-turn conversation and citation ownership, session/draft preservation and multiline input, and copy/disclosure/source behavior. Tests run on the development server and compiled worker.
- Production build, targeted ESLint, Prettier and diff checks pass.
- Full TypeScript checking is blocked by the pre-existing uncommitted redirect in `src/routes/copilot.tsx:5`, which targets `/can/ailegal` without a generated route. That file was left unchanged.
- The repository’s `vite preview` expects `dist/server/server.js`, while this build outputs a Cloudflare worker under `.output`. Final production inspection used a temporary local Node adapter around the actual compiled worker and assets, with API requests routed to a local mock server. Project preview configuration was left unchanged.
- Inspector reports and before/after captures: `.taste-skill/copilot-before/`, `.taste-skill/copilot-after/`, `.taste-skill/copilot-production/`. Interaction captures are in the after directory. The initial unsettled baseline and failed Vite-preview captures were replaced with valid captures.

No sourced or generated imagery was needed. All response content remains sample/local material; live AI and durable conversation persistence require separate backend integration.

## Live API check — 2026-11-12

The real Spring backend at localhost:8080 returned HTTP 200 for public job search and its OpenAPI contract. The contract exposes revision-scoped scan endpoints and no legal-chat endpoint. Authenticated using the documented local demo owner, created synthetic private job 113 / revision 115, and requested scan 1. It progressed QUEUED → COMPLETED with mode `stub`, outcome `NEEDS_REVIEW`, no findings, and an explicit warning that AI/legal checks were not performed. A repeated POST reused scan 1. The draft was not submitted or published.

The chatbot’s configured endpoint localhost:8000/api/chat refused connections; its configured port remains 8000. The crawler has provider configuration, but no provider call was made by this stub scan. The frontend’s candidate conversation still uses sample/local answers and does not request a live chat API. Real provider availability is unverified. Full synthetic scan receipt: `/tmp/gw-live-scan-result.json` (temporary local evidence).

## Real chat integration — 2026-11-14

This supersedes the sample-response behavior above while preserving the conversation
layout. Suggested and custom questions POST to `/api/candidates/me/legal-chat` through
the authenticated service. Each question is independent; threads and drafts stay in
browser memory. Pending responses stay attached to their originating conversation.
Provider outages display an error and retain the question for explicit retry. Only
validated real reports are displayed; no local sample-answer fallback remains.

Source disclosures show quotations returned by the adapter and distinguish document
status from unverified article applicability. Content stays plain text. Duplicate
submissions are blocked and abandoned requests are cancelled on unmount. The
`/copilot` redirect now points to the existing `/can/copilot` route.

Three UI regressions substitute the HTTP boundary to exercise pending, returned
citations, outage/retry and conversation switching; these do not prove model availability.
The backend contract, real-mode startup and strict real-AI smoke command are documented
in `../guard-work/docs/backend/legal-chat.md`. Real local E2E passed after Neo4j startup: custom chat returned an exact Article 17 quotation, and the JD button progressed QUEUED → RUNNING → COMPLETED with two grounded findings. The final scan took about four seconds; reuse, reload persistence and source highlights also passed. Results remain advisory and article applicability is unverified.

## Chat display revamp — 2026-11-14

Direction: **Framed sheet**, seed **104127510**, support/inbox draw with existing palette and Hanken Grotesk retained. No redraws. The white conversation sheet is inset 8px into the neutral history frame; the existing global shell stays intact. Its brand blue remains on the legal mark and references. The screen asks: “How can I ask about my employment situation and read the answer with its supporting sources?” GuardianWork’s article references become readable evidence attached to each conversational answer.

Inventory: candidate workspace, session-only conversations, per-conversation drafts, five Vietnamese labour topics, four starter questions, authenticated legal-chat request, pending answer, returned Markdown, quoted citations and applicability, provider error/retry, clipboard action, national legal portal. No demonstration answers are shipped in the UI.

The starting view now groups its centered prompt, suggestions and composer together. The conversation rail is 224px and can be hidden; reference topics use a disclosure instead of competing with the conversation. Once a question is sent, the transcript scrolls independently above the composer. Answers render Markdown through the existing react-markdown dependency; headings stay inside the article hierarchy, raw HTML stays escaped, and external links open with noreferrer. Pending lookup dots respect reduced motion. Copy is shown when an answer is available. Citations put the quotation and applicability note across the full reading width.

| Display              | Before this revamp                                               | Final                                                       |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Chat heading         | 22px                                                             | 18px                                                        |
| Conversation rail    | 240px, always visible                                            | 224px, collapsible                                          |
| Starting composition | Left-aligned welcome, detached bottom composer                   | Centered welcome, aligned suggestions and adjacent composer |
| Answers              | Plain paragraphs with literal Markdown                           | Semantic headings, lists, emphasis, links and code          |
| Quoted sources       | Quote inherited the 70px article-label column                    | Full-width quotation and applicability note                 |
| Design inspector     | Before screenshot captured; no new baseline measurements claimed | 1440×1000 production: 0 failures, 0 warnings                |

ROUND 1
Seen in one second: A legal chat workspace, with its starting question centered on a white sheet.
Idea (one sentence): Labour-law questions become a conversation whose evidence stays attached to each answer.
Live thing: Ask, switch conversations, hide history and expand returned citations.
Layout words by section: history=rail / welcome=centered prompt / composer=input / transcript=conversation.
Scores: design 7.5 · usability 8 · creativity 7 · content 8 → overall 7.6.
Caps applied: App-screen rubric; page imagery and motion floors do not apply.
Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. Initial after fold: suggestions were narrower than the composer. Match both to the same 720px reading measure.
2. First populated screenshot: source quotations inherited a 70px grid column. Span quotations across both columns.
3. First populated screenshot: source applicability sat beside the narrow quote. Give applicability its own full-width row.

ROUND 2
Seen in one second: A readable question-and-answer thread, with a stable input beneath it.
Idea (one sentence): Labour-law questions become a conversation whose evidence stays attached to each answer.
Live thing: Ask, switch conversations, hide history and expand returned citations.
Layout words by section: history=rail / welcome=centered prompt / composer=input / transcript=conversation.
Scores: design 8 · usability 8.5 · creativity 7 · content 8 → overall 8.0.
Caps applied: App-screen rubric; unchanged global shell excluded from the route redesign.
Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. No further blocking visual issues in the final desktop screenshots.
2. Session history remains temporary, as disclosed in the rail; durable storage is outside this display change.
3. Answers remain independent requests, as disclosed by the existing AI information panel; conversational context is outside this display change.

Verification: production build, TypeScript, targeted ESLint, Prettier, source design lint and desktop Playwright checks. The fourth UI regression covers history collapse, Markdown semantics, external links, transcript scrolling and composer visibility; the source test also checks quotation width. Production screenshots and inspection output are in `.taste-skill/copilot-revamp-production/`. A temporary local adapter serves the actual compiled worker and public assets for inspection. Inspector authentication is injected from a local mock session; the runner uses the skill inspector with desktop height set to 1000. Screenshots with an answer use an explicit HTTP test response and do not prove provider availability. No imagery or new dependencies were added; no mobile or tablet review was performed.

## Notification repair — 2026-11-14

The provider-error notice inherited the shared attention icon but overrode its required padding, pink ground and radius. This placed the icon over the opening words. Removed that local override so the shared attention-notice pattern owns icon spacing and semantic styling. Clipboard failure now uses the same 720px width and center alignment as the composer, with space above the input.

A desktop regression reproduced the defect before the fix: text started at x=601 where the icon and required gap ended at x=641. The same check passes after the repair and checks the attention ground. A new clipboard-denial regression verifies that its notice aligns with the composer, stays above the input and clears on a new conversation. All five chatbot tests pass against the compiled production build. TypeScript, targeted ESLint, formatting and the production build pass.

Desktop screenshots at 1440×1000 cover provider failure, retry, clipboard denial, rate limiting and the AI information disclosure in `.taste-skill/copilot-notices/`. HTTP responses are substituted for these UI checks. The Impeccable detector was run once; its findings concern existing Markdown quote borders, type sizes and corner radii elsewhere in the chat stylesheet, not the repaired notice rules. Those existing chat treatments were preserved within this notification-only scope. No shared design tokens or unrelated workspace surfaces were changed.

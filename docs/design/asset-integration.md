# GuardianWork visual integration handoff

This refinement preserves Guardian Blue, Hanken Grotesk, the shield/check mark, role visibility, routes, authentication services, Staff evidence downloads and versioned decisions. No dependencies, branches, commits, pushes or deployments were changed by this work.

## Implementation

| Files | Behavior |
| --- | --- |
| `src/components/icons/` | Project semantic module: 20 supplied domain glyphs plus normalized, licensed local Radix actions. |
| `src/components/guardian/Header.tsx`, `StaffShell.tsx`, `RecruiterShell.tsx`, `AdminShell.tsx`, `components/admin/sidebar.css` | Coherent action/navigation icons. Staff navigation keeps its existing layout. Candidate and recruiter use the compact, collapsible inset rail documented in `DESIGN.md`; the persistent header toggle and shared three-link footer belong to those roles. Candidate navigation uses the mounted AdminShell frame. |
| `components/auth/{AuthLayout,AccountPurposeChoice,PasswordInput,StaffLoginPage}.tsx`, `components/LogoutButton.tsx`, `components/VerificationUpload.tsx` | Purpose-specific art and semantic controls; incumbent brand mark and authentication/upload behavior preserved. |
| `components/staff/DossierHistory.tsx`, `routes/staff/verifications.tsx` | Separate history, refresh, evidence, unavailable-evidence and outcome symbols. Empty queue art is excluded from loading/error/search/filter states. No changes to API or decision submission logic. |
| `components/GuardianIllustration.tsx`, `src/career.css` | Exact intrinsic dimensions, contain sizing, empty alt text, responsive picture sources that avoid hidden desktop image requests on phones. |
| `components/guardian/LandingView.tsx` | Grid introduction: copy left, multi-industry art right; full-width search below. Existing industry-category icons retained. |
| `components/RecruiterOverview.tsx`, `routes/can/index.tsx` | Small right accents; introduction and CTA stay together. |
| `routes/rec/jobs.tsx` | Compact genuine-empty artwork; suppresses it for keyword misses, workspace read errors, absent membership and populated lists. Existing create action retained. |
| `DESIGN.md`, landing surface brief, `docs/design/assets/` | Reusable conventions, sources, exact export audit, license notices, source hashes, prompts and edited masters. |
| `tests/ui/visual-assets.spec.ts`, `tests/ui/sidebar-navigation.spec.ts` | Responsive asset/state checks and navigation regression coverage. |

Paths in this table are relative to `src/` unless explicitly prefixed.

## Icon decisions

All proposed upstream names were verified against the official Radix Icons 1.3.2 archive's type exports and embedded original React sources. [The official package archive](https://registry.npmjs.org/@radix-ui/react-icons/-/react-icons-1.3.2.tgz) and [upstream MIT license](https://github.com/radix-ui/icons/blob/master/LICENSE) are the source; the full license is retained locally. The dependency request received no answer, so no installation was performed. Selected sources are vendored with unchanged geometry; `radix-export-audit.json` records the mapping and source revision.

- `LocationIcon`: existing Lucide geographic `MapPin`, wrapped with the same project API. Proposed `PinLeftIcon` is a layout action and was rejected for geography.
- `ArrowUpRightIcon`: actual Radix export `ArrowTopRightIcon`.
- Jobs use `JobIcon`; applications use `ApplicationIcon`; posting uses `JobPostingsIcon`.
- Talent search uses `TalentSearchIcon`; membership uses `CompanyMembersIcon`.
- Dossier review uses `VerificationDossierIcon`; history uses `SubmissionHistoryIcon`; refresh uses `ReloadIcon` via `RefreshIcon`.
- Pending uses a clock; loading remains explicit HTML status (existing spinner where present). They are separate states.
- Generic confirmation uses `CheckIcon`; history's company outcome uses `CompanyIcon` with explicit outcome text. The brand shield is retained as branding.
- Rejection uses `CrossCircledIcon`; dismissal uses `Cross2Icon`; unavailable evidence uses the custom broken-document glyph.

Custom and Radix icons accept the project `size` API (15 default; explicit width/height win). Decorative icons default hidden from assistive technology. Custom titles use stable title IDs; adapters use accessible labels for named icons. Parent controls retain accessible names, hit areas and focus. Shared Button's descendant SVG size remains 16px; larger uses require a local override. No stroke-width changes were applied to Radix fill geometry. Lucide and Material Symbols remain for their other consumers.

## Illustration placements

| Asset | Component | Desktop placement | Mobile | State condition |
| --- | --- | --- | --- | --- |
| 08 multi-industry careers | `LandingView` | Right, 400px; text left and search below | Hidden below 1100px; not downloaded | Public hero |
| 01 candidate discovery | `AuthLayout` | Left below copy, 200px | Hidden; not downloaded | Candidate purpose only |
| `recruiter-login-illustration.webp` | `AuthLayout` | Left below copy, 200px | Hidden; not downloaded | Recruiter purpose only, login and registration |
| 04 recruiter teamwork | `RecruiterOverview` (mounted by recruiter index) | Right, 180px | Hidden; not downloaded | Welcome visible |
| 09 career growth, cleaned | Candidate index | Right, 180px | Hidden; not downloaded | Welcome visible |
| 06 recruiter posting, cleaned | Recruiter jobs | Center, 148px | Center, 132px | No visible jobs, blank keyword, member present, no local error/read failure |
| 07 Staff dossier review | Staff verification | Center, 148px | Center, 132px | Empty pending queue, page 0, blank keyword, successful load; outside detail panels |
| 02 CV/profile | Reserved | None | None | Active profile is already dense; avatar/edit/upload preserved |
| 03 application success | Reserved placement; original rejected | None | None | Visible text remnants, and existing confirmation is a compact inline status; no new success workflow created |

Original assets 05, 06 and 09 had baked-in UI/text and were rejected for production use. Imagegen produced clean derivatives. Asset 05 was subsequently superseded by the focused recruiter-login redesign: a newly rendered 1475 × 1067 transparent PNG master and 640 × 463 alpha WebP (~35KB), using the actual rendered login illustration as its style reference. Its exact prompt is `assets/recruiter-login-prompt.txt`; the previous reference snapshot is preserved outside public assets. The original deliverable remains untouched.

All nine originals were viewed on white and #F3F6FB. Each shipping edited derivative was also inspected against both backgrounds. Accepted original cutouts retain soft office context; they are deliberately compact, not enlarged into new hero masters. Edited masters and reference snapshots stay outside `public/`; only mounted optimized images ship there. See `assets/illustration-provenance.json` for dimensions, SHA-256 values, source paths and methods.

## Verification

Approved assets were inspected on white and `#F3F6FB`; mounted artwork was captured at 1440px and 390px, with intermediate widths checked where image/text columns collapse. Icon geometry and sizes were rendered at 15, 16, 20, and 24px on desktop and mobile. Screenshots are in `/tmp/guardianwork-product/after/` and `/tmp/guardianwork-refinement/`.

The final Impeccable detector run returned no findings. Both portal builds, TypeScript, service/mock tests, and scoped lint passed. The broad Playwright run surfaced test-fixture and harness issues plus a pagination defect; affected route categories were corrected and rerun, but the entire broad suite was not rerun as one final pass.

Limitations: mock-backed Chromium verification does not establish live-backend readiness. Firefox, WebKit, screen-reader testing, full WCAG auditing, and real gateway deployment were not performed. Existing product copy about legal verification was preserved pending content approval, not independently validated. Image quality checks do not establish that those claims are true.

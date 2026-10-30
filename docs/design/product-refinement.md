# Comprehensive product refinement

Guardian Blue, Hanken Grotesk, the shield/check mark, routes, portal boundaries, role checks, APIs, stored state, and current illustration/icon work are preserved. The working tree remains uncommitted; no dependency or branch changes, history rewrites, pushes, or deployment were performed.

See [surface coverage](surface-coverage.md) for every active route, mounted component, source of data, and redirects/unused implementations. See [asset integration](asset-integration.md) for icon mappings, licensing, imagery placements and provenance.

## Concrete changes

- Candidate/recruiter labels and ordinary data use sans type at readable sizes, without pervasive uppercase/monospace treatments. Page titles and selected-record titles have distinct fixed scales. Staff operational labels and notices are more readable at their owning CSS declarations.
- Repeated boxed metrics become divided summary strips. Workspace welcomes retain compact right-side art and a clear next action; shortcuts become open divided links.
- Candidate jobs, recruiter pipeline records, talent selection and legal questions use coherent list/detail patterns. Real selection state is keyboard-accessible; filters expose pressed state. Prose and requirements have fewer nested frames.
- Profile identity/edit fields remain primary and the actual authenticated name/email/phone behavior is preserved. Hardcoded illustrative material is identified, and CV buttons that had no backing file/action are explicitly unavailable. External example avatars became initials, avoiding unreliable third-party image requests.
- Legal responses have a reading measure, 16px type, generous leading, and clear question/reference/answer sections. Preset and generic local-answer behavior is explicitly described. Clipboard errors offer a useful fallback. Legal content itself was not revised.
- Recruiter account creation now uses the shared `/auth/register` contract. Company details are collected in Company setup after sign-in; recruiter access is derived from `/auth/me` membership and Company verification status. The retired onboarding endpoints are no longer called.
- Recruiter applications use a semantic comparison table; job/member tables expose labelled keyboard-accessible overflow regions. Company setup, invitation API behavior, role editing and permission gates remain intact.
- Staff verification still owns its selected queue record/version, authenticated history/evidence and conflict-aware decisions. The Staff Overview exact-match bug is fixed. Reports, jobs, accounts and audit logs remain explicitly illustrative where no API exists.
- Shared dialogs fit short screens and keep a usable close target, focus trap and Escape behavior. Loading, access failure, retry and not-found presentations remain distinct; recovery copy is Vietnamese.
- `workspace.css` owns repeated patterns. Fragile ancestry-based page-heading selectors and the blanket monospace override were removed from `career.css`. No new `!important` layer or universal page abstraction was added.

## Content requiring approval

The approval request proposed replacing unsupported “100% Verified”/legal-guarantee badges, the “Gemini AI Engine” claim, and fabricated identity/CV labels with accurate source/capability copy. No approval has been received. Existing claim text is retained with sample disclosures and reduced visual emphasis. The following still require a product/content decision:

| Area | Existing content | Accurate proposed direction |
| --- | --- | --- |
| Candidate welcome/jobs | 100% legal/contract verification and contract-protection wording | Recruitment discovery plus explicit Company-verification scope; distinguish sample JD analysis |
| Candidate profile/talent | “Verified Active Candidate”, “100% Verified”, fixed verified CV names, invented certificate/KYC results | Authenticated identity where available; example qualifications and CV-unavailable copy where no record/file exists |
| Legal assistant | “Gemini AI Engine” and automated extraction claims | Preset/local demonstration; source inspection and qualification without implying a connected model |
| Recruiter overview/talent | Sourcing/legal guarantees and outreach “sent” feedback | Illustrative profile/pipeline state; “recorded in this demo” feedback unless a real messaging API exists |
| Recruiter job summaries | “100% compliant”/legal-shield counters | Actual local job/application counts; no unsupported operational certification |

The implementation makes sample context visible and unavailable controls honest. It does not change legal meaning or approved business rules. Further claim replacement is pending, not silently treated as approved.

## Verification

The active-route capture covered the public portal and Staff portal at 1440px and 390px (57 after captures; 47 before captures). Additional 1024px captures cover candidate jobs/profile/legal assistant, recruiter jobs/members/verification, and Staff jobs/verification. Recruiter login was checked at 1000px, 1024px, and 1100px. Representative files include:

- Before: `/tmp/guardianwork-product/before/review-contact.jpg`
- Landing: `/tmp/guardianwork-product/after/desktop-landing.png` and `/tmp/guardianwork-product/after/mobile-landing.png`
- Recruiter jobs: `/tmp/guardianwork-product/after/desktop-recruiter-jobs.png` and `/tmp/guardianwork-product/after/mobile-recruiter-jobs.png`
- Staff queue: `/tmp/guardianwork-product/after/desktop-staff-verifications.png` and `/tmp/guardianwork-product/after/mobile-staff-verifications.png`
- Shared recruiter signup: `/tmp/employer-register-desktop.png`
- Icon sizing preview: `/tmp/guardianwork-refinement/desktop-icon-sizes.png` and `/tmp/guardianwork-refinement/mobile-icon-sizes.png`

Both public and Staff production builds pass. TypeScript passes. `npm test` passes all 48 service/mock tests. Scoped ESLint reports no errors and one existing `react-refresh/only-export-components` warning in `EmployerOnboardingContext.tsx`. `git diff --check` passes and the Impeccable detector returned no findings.

The full 112-case Playwright run completed with 84 passing and 28 failing. Failures include legacy assertions that expect `/admin/*` pages on the Staff origin (the portal correctly redirects these to `/staff/*`), the root route to expose a login form (it correctly redirects to `/vn`), and recruiter-purpose registration to expose the retired employer-only fields. The mobile candidate navigation test also assumes the drawer stays open after selecting a route; the implementation closes it. Several mobile cases timed out while navigating with `waitUntil: "load"` or waiting for capture readiness. The leave-company fixture supplies a non-owner membership but the mock Company detail endpoint enforces owner access, so those tests do not reach the action under test. These are test-contract/setup mismatches or timeouts; they were not presented as passing behavior.

After the full run, the mobile recruiter onboarding suite was rerun in isolation. Shared registration, Company setup, verification gating, retired-link recovery, and invitation acceptance passed (6 reported checks). The candidate phone mobile case was not independently rerun. The full Playwright suite therefore remains partially failing and should be reconciled with the active portal routes, current registration contract, and mock membership permissions before it is used as a clean release gate.

The approved-claim request is still pending. Existing legal/verification/AI claims remain unchanged; the exact list and proposed copy are above. No commit, push, dependency change, or deployment was made.

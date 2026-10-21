# Invited recruiter onboarding

Scope: the recipient journey from a private Company invitation to personal verification and workspace entry. Source contracts are API_FOR_FE's GW-SR-REC-02 recipient invitation APIs, GW-SR-REC-03 personal verification APIs, and `docs/backend/employer-onboarding.md`. Owner registration, role changes and departure/removal management are outside this slice. The subsequent Owner invitation integration connects creation and failed-delivery resend to the backend.

## Routes and delivery configuration

- `/company-invitations#secret=...`: configure the backend's `COMPANY_INVITATION_BASE_URL` to the deployed HTTPS frontend route and its origin in `COMPANY_INVITATION_ALLOWED_ORIGINS`.
- `/employer-onboarding#memberEmailSecret=...`: configure `ONBOARDING_CONFIRMATION_URL` to this HTTPS frontend route and its origin in `ONBOARDING_ALLOWED_ORIGINS`. This route handles member email proof; it does not implement new-owner registration proof.
- Existing `VITE_API_BASE_URL` / Vite proxy configuration connects these routes to API_FOR_FE. Configure the backend's existing sender credentials separately; never put them in frontend environment variables.

The initial HTML removes private fragments before shared assets. Fragment-only navigation is handled as well. The raw fragment stays in memory until the user explicitly continues or confirms. After that action, private proof is kept in tab-scoped sessionStorage across sign-in/registration and retries, never placed in a query/path or analytics payload. Completion clears the corresponding proof. The onboarding documents send `Referrer-Policy: no-referrer` and `Cache-Control: no-store`; the onboarding HTML also sets the no-referrer meta policy. This uses the existing sessionStorage authentication architecture without adding dependencies.

## Recipient behavior

1. Continue from the neutral invitation page. Sign in or register with the invited email; `next` accepts only the two internal onboarding destinations.
2. Preview the company, Recruiter role and Vietnam-time expiry. Viewing never accepts. Explicit acceptance uses `confirm: true`; decline creates no membership.
3. Refresh `/auth/me` after acceptance, then proceed to personal proof. A retained, account-bound acceptance intent allows an uncertain response to be retried after reload. Historical LEFT/REMOVED receipts never reactivate membership or grant entry.
4. Explicitly enter personal verification. `/me/employer-onboarding` enrolls existing members, so the UI explains its access consequence before invoking it. Invitation proof does not replace personal email proof.
5. Send/confirm the member email. Email delivery acceptance is distinguished from mailbox arrival; email resend uses a 60-second cooldown. SMS delivery and phone OTP entry/verification belong to a separate ticket and are excluded from this branch. If the backend still requires phone proof, show a pending state without delivery controls or phone API calls. Refresh reads phone proof completed by the separate workflow.
6. Enable workspace entry only with current Recruiter membership, both personal proofs and backend stage VERIFIED. Known invited sessions recheck personal proof when entering recruiter routes; no global legacy-member rollout is introduced. Backend checks remain the authorization boundary across devices and sessions.

Recruiters no longer request the Owner-only private dossier merely to enter the shell. Their navigation and overview point to personal verification rather than Company legal submission. Existing job/talent panels still contain illustrative data and are not new backend integrations.

## Recovery and verification

Unavailable invitations retain the backend's generic response; the UI does not distinguish expired, revoked, invalid or wrong-email secrets. Conflicting membership errors disclose no other Company identity. Session-expired paths retain proof for explicit sign-in. Network uncertainty retains the original invitation for retry. A removed membership or ineligible Company cannot use a historical acceptance receipt for workspace entry.

Browser tests use isolated mock responses for invitation and personal-proof APIs; they do not contact external mail/SMS services or write real Company data. Real delivery and deployment link configuration require environment-backed verification.

### Validation before SMS scope removal — 2026-10-20

- 34 browser checks passed across desktop and mobile: 22 invitation/personal-verification checks and 12 existing public, Candidate, Owner and Admin regressions.
- 29 unit/API tests, production build, TypeScript, changed-file ESLint, formatting and whitespace checks passed.
- Rendered desktop/mobile invitation, completion and SMS-unavailable screens were reviewed. Existing GuardianWork typography, quiet panels and visible primary actions are preserved.
- One Impeccable detector pass found only existing shared-source font/ramp findings: AuthLayout's 46px heading, RecruiterOverview's 11px metadata, and the root's existing Geist Mono and Material Symbols declarations. No new onboarding-source finding was reported; unrelated typography was preserved.
- Provider-backed email/SMS delivery and real deployed API integration were not exercised; browser coverage uses isolated contract fixtures. Deployment must configure the email link destinations. SMS delivery belongs to a separate ticket.

### Scope update — 2026-10-21

Removed the phone delivery/OTP controls, client API functions and delivery test fixtures. Email confirmation, invitation acceptance and backend phone-proof eligibility checks remain. This branch does not bypass phone verification or change API_FOR_FE; phone verification is owned by the other ticket.

Validation after scope removal: all 22 invitation/email browser checks passed on desktop and mobile, including no phone requests or delivery controls while backend phone proof is pending. Production build, TypeScript, changed-file ESLint and whitespace checks passed. The mobile pending-state rendering was reviewed.


### Owner invitation creation

On `/recruiter/members`, “Tạo lời mời” now calls `POST /api/companies/me/invitations` with Bearer authentication and only the normalized recipient email. Eligibility uses current backend Owner membership and the loaded Company verification status; the backend rechecks authorization and Company eligibility. The action does not add a local member or call the browser-local invitation simulation.

The response displays the recipient, expiry, and backend delivery state. `PROVIDER_ACCEPTED` means the email service accepted the request, not mailbox delivery. `FAILED` and `UNKNOWN` preserve the returned invitation ID and offer explicit resend via `POST /api/companies/me/invitations/{id}/resend`. Resend rotates the private link according to the backend contract. Network/duplicate failures preserve the entered email and do not claim success.

Only creation and delivery recovery are integrated here. The existing membership table and other management controls still use their prior browser-local model; backend invitation listing and broader membership management are separate work. The local pending-invitation count is omitted because it cannot represent backend invitation totals. SMS remains excluded.

Owner invitation validation: six desktop/mobile browser checks and all 33 unit/API tests passed, alongside production build, TypeScript, changed-file lint and whitespace checks. Browser checks intercept isolated contract fixtures; no real invitation email was sent during verification.

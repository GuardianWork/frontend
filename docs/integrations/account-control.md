# GW-95 account-control integration

This guide records the frontend contract for shared account settings, Candidate identity edits, email proof, password changes, account lifecycle requests, public recovery, and the persistent Candidate/recruiter workspace frame. The implementation uses the existing `/api` proxy and `sessionStorage` access/refresh-token session.

## Routes and role boundaries

| Route | Purpose |
| --- | --- |
| `/can/account` | Shared `AccountPage` in the Candidate shell. |
| `/rec/account` | The same `AccountPage` in the recruiter shell, including before Company setup or email verification is complete. |
| `/account-recovery` | Public, unauthenticated reactivation or cancellation of a pending deletion request. |
| `/login` | Shared ordinary sign-in after password change or successful recovery. |

Self-service is restricted to portal `USER` accounts, including Company `OWNER`, `ADMIN`, and `RECRUITER` memberships. `STAFF` is excluded. The account role and active membership returned by `/auth/me` are authoritative; do not infer purpose or permissions from username, email, or display name. Recruiter context is carried by `/rec/*`; the shared account component does not switch the user to Candidate context.

Legacy `/candidate/*` and `/recruiter/*` deep links redirect to `/can/*` and `/rec/*`, preserving query and hash. `/account` is a legacy redirect to `/rec/account` when `/auth/me` has an active membership, otherwise `/can/account`. Public `/jobs` stays guest-facing; `/can/jobs` presents the same discovery inside the Candidate shell.

The Candidate and recruiter shells stay mounted during navigation within each role; only the main view changes. Their inset light sidebar is 244px expanded and 76px collapsed, with 44px navigation targets, simple 20px icons, and a 44×44 toggle in the persistent header. The grid moves over 240ms and labels fade briefly only after an explicit toggle. Restoring the saved preference or changing viewport size does not animate; reduced motion disables the transition. On phones, navigation opens as a full drawer. Both USER footers contain exactly three destinations, in order: **Cài đặt tài khoản**, **Chuyển phân hệ**, **Trang chủ**. The Staff sidebar remains unchanged.

## Proxy, envelope, and identity APIs

Frontend service functions use paths relative to the configured API base. The existing `/api` proxy routes requests and owns `X-Guardian-Portal`; account services do not set that header. Successful responses use HTTP 200 and the envelope `{status, message, data}`. `api.ts` unwraps `data`; do not treat a successful request-code response as completion of the protected account action. Nullable or omitted phone and timestamp fields are equivalent where specified.

| Backend endpoint | Authentication | Frontend behavior and request shape |
| --- | --- | --- |
| `GET /api/me/account` | Bearer | Reads shared `firstName`, `lastName`, response-only `fullName`, optional/null `phoneNumber`, immutable username/email, verification state, lifecycle state, eligibility, and blockers. |
| `PUT /api/me/account` | Bearer | Sends only `{firstName, lastName, phoneNumber}`. Names are trimmed, required, Unicode-safe, and at most 100 characters each. Send `phoneNumber: null` to clear it. Username and email are immutable; do not split `fullName` to reconstruct names. Phone uniqueness/normalization is backend-owned. |
| `GET /api/v1/candidates/profile` | Bearer | Reads the Candidate profile used by the profile editor. |
| `PUT /api/v1/candidates/profile` | Bearer | Sends `firstName` and `lastName`, never `fullName`; read `fullName` only as a response field and do not split it to infer names. Preserve `phoneNumber`, `avatarUrl`, `skills`, `experienceSummary`, `educationSummary`, and `isPublic` in the full update. |
| `POST /api/me/email-verification/request` | Bearer | No body and no destination address. Read `deliveryAccepted`, `alreadyVerified`, `nextRequestAt`, and `expiresAt`. A false delivery result is not verification. |
| `POST /api/me/email-verification/confirm` | Bearer | Sends `{emailSecret}` as a string, preserving leading zeroes. On success refresh account and `/auth/me` identity. Email proof does not authorize closure or recovery. |
| `PUT /api/auth/change-password` | Bearer | Sends `{currentPassword, newPassword}`. Require verified email and 8–128 characters with uppercase, lowercase, and digit. On success clear both tokens, private query cache, and sensitive form state; return to sign-in without refreshing old sessions. |
| `POST /api/me/account/deactivation/request-code` or `/deletion/request-code` | Bearer | Sends `{currentPassword}`. Read `deliveryAccepted`, `nextRequestAt`, and `expiresAt`. Requesting a code alone never changes account state. |
| `POST /api/me/account/deactivation/confirm` or `/deletion/confirm` | Bearer | Sends `{currentPassword, emailSecret, acknowledgeConsequences: true}`. Require the expected `DEACTIVATED` or `DELETION_PENDING` result before showing success; clear tokens and private cache, then exit. |
| `POST /api/auth/account-recovery/request-code` | **No Bearer** | Sends `{usernameOrEmail, password, action}` where action is `REACTIVATE` or `CANCEL_DELETION`. Do not echo or disclose the registered destination email. |
| `POST /api/auth/account-recovery/confirm` | **No Bearer** | Sends the same recovery fields plus `emailSecret` and `acknowledgeConsequences: true`. Success must return `ACTIVE`, return no tokens, clear the form/session cache, and require ordinary sign-in. |

Recovery requests must use the unauthenticated `apiRequest` path directly: never attach or restore a Bearer token. A successful recovery does not restore prior sessions, Company memberships already left, or assignments. Banned accounts cannot use recovery. A `40304` alone does not prove voluntary closure or trigger an automatic email request.

The email proof lasts 10 minutes, locks after five incorrect attempts, and has a 60-second request cooldown. Honor `Retry-After` and `nextRequestAt`; a resend replaces the action-bound proof. Validate six decimal digits as text so leading zeroes survive. Format times with `vi-VN` and `Asia/Ho_Chi_Minh`.

## Eligibility, results, and failure handling

- `EMAIL_VERIFICATION_REQUIRED` directs the signed-in user to verify the fixed registered email.
- `COMPANY_OWNERSHIP_EXISTS` blocks an owner. There is no ownership-transfer or Company-closure flow.
- `ACTIVE_COMPANY_MEMBERSHIP_EXISTS` permits only the existing leave flow for a `RECRUITER`. An `OWNER` is blocked; `ADMIN` has no supported leave/removal flow. Use the active membership role from `/auth/me`.
- A successful deactivation means access stops and the state becomes `DEACTIVATED`; a successful deletion confirmation means access stops and state becomes `DELETION_PENDING`. Both preserve prior records and hide Candidate visibility. Deletion is pending, not immediate erasure; no erasure date is promised. Permanent erasure and Staff deletion are deferred.
- The server rechecks eligibility during confirmation to handle concurrent membership or account changes. On uncertain network/5xx confirmation, do not announce success or retry automatically; block repeat submission and offer an authorized state reload.
- Map account-control errors to Vietnamese UI text; never render the backend's English `message`. `40001` uses the operation-specific Vietnamese validation/current-password/acknowledgement fallback; `40002` explains the password policy; `40030` and `40094` explain invalid, expired, or exhausted email proofs. `401` on protected account calls clears the session without a failed-request replay or refresh loop; recovery `401` reports invalid credentials without identifying which field failed.
- `40300`, `40304`, and `40335` explain portal/eligibility/email-proof restrictions. `40930` reports an unavailable phone without identifying another account; `40994` and `40910` explain owner and membership blockers; `40995` requires reloading current state. `42994` and `42930` use cooldown timing and `Retry-After`. Other `4xx`, network, and `5xx` errors use a Vietnamese fallback and never imply success.

Account and Candidate profile edits invalidate the account, Candidate profile, and current-user identity caches. Candidate detailed experience and education continue through the existing illustrative/local-record flow; there is no new server record schema for those items. Keep those records visibly distinguished from the API-backed name, phone, and profile summary.

Passwords and email codes stay in component memory only: do not put them in URLs, persistent storage, analytics, or logs. The auth service keeps access and refresh tokens in `sessionStorage`; account operations clear both tokens and private caches on password/lifecycle success and protected 401. The sidebar collapse preference is a non-sensitive display setting and must remain separate from authentication state.

## Rollout gate

1. Deploy backend migration `V2026.10.31.94` before the frontend. It must support separate first/last names and the account, verification, password, lifecycle, and recovery contracts above.
2. Stop all older writers that send `fullName` before enabling the new frontend. Candidate profile reads may contain `fullName`, but writes use `firstName` and `lastName`; never retain a split/join compatibility writer.
3. Confirm proxy routing and the `{status, message, data}` envelope, nullable fields, access control for `USER` versus `STAFF`, membership blockers, server-side rechecks, cooldown/attempt behavior, and expected lifecycle states.
4. Verify request-code delivery and confirmation with real email in the deployed environment. The browser/mock suite is not evidence of backend deployment, production mail delivery, or permanent-erasure processing.

## Mock and verification evidence

`scripts/mock-api.mjs` accepts the fixed code `012345` for mock verification, closure, and recovery flows. Mock responses intentionally do not expose the code; the fixture value is test-only. Production uses delivery to the registered email and must never use or disclose this fixed mock value.

The final review evidence recorded 79 passing service/mock tests and 27 unique passing browser cases across the account, role-routing, layout, recovery, profile, collapse, and final-fix runs. The final route suite and final-fix checks were targeted runs; the latest build, TypeScript, and targeted lint checks passed. Browser tests intercept the API and establish frontend behavior only. Live backend deployment, real mail delivery, and permanent erasure were not verified.

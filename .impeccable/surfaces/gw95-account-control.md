---
version: 1
slug: "gw95-account-control"
primary_target: "src/components/account/AccountPage.tsx"
related_targets:
  [
    "src/components/account/account.css",
    "src/components/account/ClosureDialog.tsx",
    "src/components/account/CodeChallenge.tsx",
    "src/routes/account-recovery.tsx",
    "src/routes/can/account.tsx",
    "src/routes/rec/account.tsx",
    "src/routes/can/profile.tsx",
    "src/services/accountControl.ts",
    "src/services/candidateProfile.ts",
    "src/hooks/useAccountIdentity.ts",
    "src/context/WorkspaceLayoutContext.tsx",
    "src/components/AdminShell.tsx",
    "src/components/RecruiterShell.tsx",
    "src/components/workspace.css",
  ]
---

# GW-95 shared account control

Scope: `/can/account`, `/rec/account`, `/account-recovery`, and the shared identity fields on the Candidate profile. The account screen is one shared component inside the proper persistent Candidate or recruiter shell. Mode: Operate. Self-service is for authenticated `USER` accounts, including Company OWNER, ADMIN, and RECRUITER memberships; STAFF is excluded.

## Direction contract

THESIS: One shared account identity supports both job seeking and recruiting. Users can manage their name and phone, email proof, password, and eligible account lifecycle in one familiar place while each workspace retains its correct role context.

OWN-WORLD: Keep Guardian Blue, Hanken Grotesk, light surfaces, dark blue ink, quiet borders, and the existing shield mark. Use the shared palette and ordinary account-form patterns; this is an extension of the incumbent system, not a new theme.

STORY: A signed-in USER checks shared identity details, proves the registered email, changes the password, or starts a separately explained deactivation or deletion request. Public recovery serves only eligible self-deactivated or deletion-pending accounts, then returns the user to ordinary sign-in. Candidate and recruiter navigation preserve their route context and keep the shell mounted while only the main view changes.

FIRST VIEWPORT: At 1440×1000 the account page sits inside the role shell with its title and first identity fields visible; remaining account sections continue in the scrolling main area. Deletion confirmation uses a viewport-bounded dialog. Review expanded and collapsed desktop rails only.

FORM: Inherit the incumbent Guardian Blue form seed `299ce1db6bceb58e`; this precisely specified extension needs no new concept seed. Candidate and recruiter rails use compact light inset panels, 244px expanded and 76px collapsed, with 44px links and simple 20px icons. Put the 44×44 collapse control in the persistent header. Animate only a user-invoked toggle: 240ms decelerating grid movement with brief label fades; preference restoration and viewport changes stay still, and reduced-motion removes the transition. Keep exactly three footer links, in order: **Cài đặt tài khoản**, **Chuyển phân hệ**, **Trang chủ**. Staff navigation is unchanged.

FINISH: Final captures were independently inspected at 1440px and 390px. The supplied review evidence records 79 service/mock tests passing, 27 unique browser cases passing across the main, route, and final-fix runs, and successful build, TypeScript, and targeted lint checks. Browser tests use mocked API responses and do not establish live backend deployment or email delivery.

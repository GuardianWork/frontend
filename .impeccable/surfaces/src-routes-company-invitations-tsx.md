---
version: 1
slug: "src-routes-company-invitations-tsx"
primary_target: "src/routes/company-invitations.tsx"
related_targets: ["src/routes/employer-onboarding.tsx", "src/components/onboarding/OnboardingLayout.tsx", "src/services/recruiterOnboarding.ts", "src/routes/login.tsx", "src/routes/register.tsx"]
---

# Invited recruiter onboarding

Mode: Operate. User confirmed the recipient-first brief: neutral private-link entry, authentication with the invited email, explicit preview/accept/decline, personal email proof, then workspace entry when backend eligibility permits. SMS delivery and phone OTP UI belong to a separate ticket; show pending backend phone proof without offering delivery controls. Preserve Guardian Blue, Hanken Grotesk, white panels and cool grounds. Use a focused single-column composition with one primary action; progress appears only after invitation validation.

Company identity and role lead the preview. Personal proof is distinct from Company verification: invited Recruiters never submit legal documents. Show unavailable invitations generically; distinguish delivery acceptance from actual arrival and keep phone proof pending until completed by its owning workflow. Retain recovery through authentication and uncertain acceptance. Use current backend state for eligibility; a historical acceptance receipt grants no authority.

Scope excludes new Owner onboarding, Owner invitation management, membership departure/removal tools, and legacy rollout policy. Reuse the existing authentication and API architecture. API contracts and deployment details are recorded in docs/invited-recruiter-onboarding.md.

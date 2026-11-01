---
version: 1
slug: "src-components-guardian-landingview-tsx"
primary_target: "src/components/guardian/LandingView.tsx"
related_targets: ["src/styles.css","src/components/guardian/Header.tsx","src/components/AdminShell.tsx","src/components/RecruiterShell.tsx","src/routes/can/jobs.tsx","src/components/auth/AuthLayout.tsx"]
---

# GuardianWork recruitment redesign

Scope: public `/vn` and job routes, shared navigation, Candidate `/can`, Recruiter `/rec`, Staff, account settings, authentication and recovery, and the existing candidate job browser. Visitor mode: Persuade on `/vn`; Operate in workspaces.

## Direction contract

THESIS: A familiar Vietnamese recruitment platform, explicitly selected by the user with VietnamWorks as the quality reference. Familiar search, listings, and workspace navigation are the commitment, not an experimental metaphor.

OWN-WORLD: A shared monochrome system frames every site: white page surfaces, black and charcoal chrome, gray supporting tones, Hanken Grotesk typography, 12px listing corners, quiet rules, and compact status labels. Blue highlights actionable and selected content in public discovery and the main content areas of Candidate, Recruiter, and Staff workspaces. Headers, footers, sidebars, authentication, and standalone recovery stay monochrome. Attention notices use a pale-pink surface and red exclamation icon with dark title and body; there is no theme selector or role-specific palette.

STORY: Understand GuardianWork, search existing jobs by skill and location, inspect the selected job, and continue the existing application flow. Recruiters enter posting and company-verification flows directly.

FIRST VIEWPORT: The monochrome palette styles the white navigation band, product headline and concise existing description on the left beside compact multi-industry artwork on wide screens. Blue highlights the working keyword/location search, popular skill links, and actual job listings beneath it. Below 1100px the artwork is absent and the established centered introduction remains. Signature interaction: submitting the landing search transfers its filters to the candidate workspace and opening a preview selects that exact listing. Motion uses short color transitions with visible content and reduced-motion support.

FORM: VietnamWorks remains the public recruitment quality reference; the user approved the `/rec` Indeed-inspired monochrome frame with blue main-content emphasis across public discovery and all workspaces. Keep each existing page composition and task flow, and reuse shared shells, `Button`, account/recovery controls, navigation, forms, icons, and illustrations. The candidate/recruiter frame remains 244px/76px with its single saved header toggle and exact footer links; Staff retains its 280px/80px frame and local toggle. Preserve content and role boundaries. Direct VietnamWorks reference access returned 403, so no pixel-for-pixel fidelity claim is made.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

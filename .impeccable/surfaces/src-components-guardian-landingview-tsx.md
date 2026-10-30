---
version: 1
slug: "src-components-guardian-landingview-tsx"
primary_target: "src/components/guardian/LandingView.tsx"
related_targets: ["src/styles.css","src/components/guardian/Header.tsx","src/components/AdminShell.tsx","src/components/RecruiterShell.tsx","src/routes/candidate/jobs.tsx","src/components/auth/AuthLayout.tsx"]
---

# GuardianWork recruitment redesign

Scope: `/vn`, shared navigation, candidate/recruiter/admin shells, authentication, and the existing candidate job browser. Visitor mode: Persuade on `/vn`; Operate in workspaces.

## Direction contract

THESIS: A familiar Vietnamese recruitment platform, explicitly selected by the user with VietnamWorks as the quality reference. Familiar search, listings, and workspace navigation are the commitment, not an experimental metaphor.

OWN-WORLD: White and cool blue-gray grounds, deep blue actions, restrained orange supporting emphasis, Hanken Grotesk typography, 12px listing corners, quiet rules, and compact status labels. People browse in ordinary daytime office and phone settings, so light surfaces lead; Guardian Blue is the only theme, with no theme selector or alternate saved palette.

STORY: Understand GuardianWork, search existing jobs by skill and location, inspect the selected job, and continue the existing application flow. Recruiters enter posting and company-verification flows directly.

FIRST VIEWPORT: A white navigation band, product headline and concise existing description on the left beside compact multi-industry artwork on wide screens, and a full-width working keyword/location search beneath. Below 1100px the artwork is absent and the established centered introduction remains. Popular skill links sit beneath it; the next section starts with actual existing job listings. Signature interaction: submitting the landing search transfers its filters to the candidate workspace and opening a preview selects that exact listing. Motion uses short color transitions with visible content and reduced-motion support.

FORM: User-selected category standard, reference VietnamWorks; selected sketch `.impeccable/mocks/decision/canon.html`; seed:299ce1db6bceb58e. Preserve content and role boundaries. Direct reference access returned 403, so no pixel-for-pixel fidelity claim is made.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

---
version: 1
slug: "src-routes-can-jobs-apply-tsx"
primary_target: "src/routes/can/jobs_.apply.tsx"
related_targets:
  [
    "src/components/candidate/JobApplyPage.tsx",
    "src/routes/can/jobs.tsx",
    "src/lib/candidate-jobs.ts",
    "src/lib/cv-file.ts",
    "src/context/CandidateContext.tsx",
    "src/services/companyMembers.ts",
  ]
---

# GuardianWork job application

Scope: `/can/jobs/apply`, the single screen a candidate lands on from the Apply action in `/can/jobs`. Visitor mode: Operate. The candidate is signed in, has chosen one listing, and is confirming an application they already intend to send.

## Direction contract

THESIS: One focused sheet that finishes a decision the candidate already made. The form arrives pre-answered from their profile and default CV, so the screen's job is confirmation and a clean receipt, not data entry. It refuses the two-pane list-plus-detail density of the job browser: no second listing, no recommendation rail, no workspace sidebar.

OWN-WORLD: Guardian Blue actions on white paper over the cool blue-gray ground, Hanken Grotesk throughout, one 12px white sheet on the ground, 1px quiet rules between sections, compact option cards with an accent wash when chosen, deep-navy inverse slim bar framing the page, semantic red only for validation. Deep navy echoes the reference's dark top band without importing its red brand.

STORY: The candidate recognises the job and company, sees which CV the recruiter will receive (the default, or a replacement they pick or upload), corrects name, email or phone if the profile is stale, optionally writes a note, sends, and gets a receipt naming the attached file. A candidate who already applied, opened a dead listing, or lost their CV mid-flow is blocked with a reason and a way forward.

FIRST VIEWPORT: At 1440×1000, a 56px inverse bar with the back link to the listing at left and the GuardianWork mark centred. Below, on the cool ground, one 880px sheet: job title at ~30px, company · location · salary in muted ink, then "Hồ sơ xin việc" with two radio cards — "Dùng hồ sơ hiện có" selected and washed in accent blue, showing the file row with format, size, upload date and a default badge, and "Tải lên hồ sơ mới" unselected with its compact file control. The contact section's first field is visible before the fold. Signature interaction: the CV choice and the contact details persist as one edited unit; switching to manual entry clears the prefilled values without losing the chosen CV, and choosing a file uploads it, adds it to the candidate's CV list, and selects it in place.

FORM: Composition pinned by the user's reference `public/screen/job-application/itviec.png`; fields and validation from UC-CAN-11. No direction roll applies to a pinned composition. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

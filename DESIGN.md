---
name: GuardianWork
description: Monochrome chrome with blue-highlighted content across GuardianWork.
colors:
  primary: "#2d2d2d"
  primary-hover: "#111111"
  primary-deep: "#1f1f1f"
  primary-subtle: "#f3f3f2"
  discovery-accent: "#2557a7"
  discovery-hover: "#164081"
  discovery-deep: "#153d75"
  discovery-subtle: "#eef3fb"
  accent-ink: "#ffffff"
  support-gray: "#595959"
  paper: "#ffffff"
  paper-2: "#f7f7f6"
  paper-3: "#eeeeec"
  paper-inverse: "#2d2d2d"
  ink: "#2d2d2d"
  ink-2: "#595959"
  ink-3: "#666666"
  rule: "#e4e2e0"
  rule-2: "#949494"
  rail: "#2d2d2d"
  rail-hover: "#424242"
  rail-rule: "#505050"
  on-rail: "#ffffff"
  on-rail-muted: "#d4d2d0"
  on-rail-focus: "#ffffff"
  mint: "#2d2d2d"
  lavender: "#eeeeec"
  error: "#b3261e"
  error-container: "#fdefef"
  on-error-container: "#83231d"
  attention: "#b3261e"
  attention-ground: "#fdefef"
typography:
  display:
    fontFamily: Hanken Grotesk, system-ui, sans-serif
    fontSize: clamp(32px, 3.8vw, 52px)
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: -0.035em
  headline:
    fontFamily: Hanken Grotesk, system-ui, sans-serif
    fontSize: clamp(24px, 2.2vw, 30px)
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: -0.025em
  title:
    fontFamily: Hanken Grotesk, system-ui, sans-serif
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.45
  body:
    fontFamily: Hanken Grotesk, system-ui, -apple-system, sans-serif
    lineHeight: 1.5
  label:
    fontFamily: Hanken Grotesk, system-ui, sans-serif
    fontSize: 14px
    fontWeight: 600
rounded:
  sm: 0.25rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  2xl: 1.5rem
  workspace-frame: 14px
  notice: 16px
  pill: 9999px
spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  2xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    padding: 13px 24px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-content-primary:
    backgroundColor: "{colors.discovery-accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    padding: 13px 24px
  button-content-primary-hover:
    backgroundColor: "{colors.discovery-hover}"
  button-content-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.discovery-deep}"
    rounded: "{rounded.md}"
    padding: 13px 24px
  button-content-outline-hover:
    backgroundColor: "{colors.discovery-subtle}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 13px 24px
  button-outline-hover:
    backgroundColor: "{colors.primary-subtle}"
  job-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 22px
  job-card-hover:
    backgroundColor: "{colors.paper-2}"
  popular-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    rounded: 5px
    padding: 4px 12px
  search-input:
    textColor: "{colors.ink}"
    height: 44px
  navigation:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  workspace-rail:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.on-rail}"
    rounded: "{rounded.workspace-frame}"
    width: 244px
  workspace-rail-collapsed:
    width: 76px
  staff-rail:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.on-rail}"
    width: 280px
  staff-rail-collapsed:
    width: 80px
  account-primary-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 10px 18px
  account-primary-button-hover:
    backgroundColor: "{colors.primary-hover}"
  account-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: 48px
  attention-notice:
    backgroundColor: "{colors.attention-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.notice}"
    padding: 20px 24px 20px 58px
---

# Design System: GuardianWork

## Overview

**Creative North Star: "Familiar recruitment, clear next steps"**

GuardianWork uses the `/rec` black, white, charcoal, and gray palette for public chrome, authentication and recovery, and all workspace frames. Blue highlights content inside public discovery and the main content area of Candidate, Recruiter, and Staff workspaces; headers, footers, and sidebars stay monochrome. Pale pink and red remain reserved for attention notices, with dark readable titles and body copy.

GuardianWork remains a multi-industry recruitment platform. Public browsing keeps its familiar search and listing structure, while the three workspaces retain their role-specific navigation and density. The shared palette applies across those different layouts without changing role boundaries, content, or workflows.

**Key Characteristics:**

- Black, white, charcoal, and gray as the main color system; blue marks discovery content and pale pink/red marks attention notices.
- Hanken Grotesk for headings, body copy, labels, and workspace UI.
- Quiet borders, gently rounded controls, and compact information hierarchy.
- The `/rec` monochrome palette for site chrome, with blue accents scoped to public discovery and workspace main content.

## Colors

The approved `/rec` palette uses charcoal for site-wide actions, wayfinding, and text; white and grays carry the page. Blue is a scoped content accent for search and job discovery, while pale pink and red identify attention notices. Frontmatter values are normative; the names below describe their roles.

### Primary

- **Charcoal** (`primary`): the base action and emphasis color, used throughout the monochrome site chrome and in surfaces outside the blue content scopes. Near-black hover and deep-charcoal variants serve interaction states.
- **Content Blue** (`discovery-accent`, `discovery-hover`, `discovery-deep`): search and apply actions, links, focus, selected rows and tabs, section headings, account-overview emphasis, and key figures inside public discovery and Candidate, Recruiter, and Staff workspace main content.
- **Content Blue Wash** (`discovery-subtle`): selected results and supporting states within those content regions.
- **Soft Gray Wash** (`primary-subtle`): selected navigation and supporting monochrome panels.

### Secondary

- **Supporting Gray** (`support-gray`): secondary emphasis for icons and labels, not a second accent color.
- **Charcoal Success** (`mint`): affirmative status keeps the monochrome system.
- **Attention Red / Pale Pink / Dark Attention Text** (`error`, `error-container`, `on-error-container`): the notice icon, notice background, and readable title/body.

### Neutral

- **White Paper / Soft Warm Ground / Warm Inset** (`paper`, `paper-2`, `paper-3`): cards and forms, page grounds, and grouped content.
- **Neutral Lavender** (`lavender`): a further neutral inset surface.
- **Charcoal / Supporting Gray / Quiet Gray** (`ink`, `ink-2`, `ink-3`): primary text, explanatory copy, and metadata.
- **Warm Rule / Strong Gray Rule** (`rule`, `rule-2`): dividers, card borders, and control outlines.
- **Charcoal Rail / Rail Hover / Rail Divider** (`rail`, `rail-hover`, `rail-rule`): shared workspace navigation surfaces and their boundaries.
- **Rail Text / Muted Rail Text / Rail Focus** (`on-rail`, `on-rail-muted`, `on-rail-focus`): navigation labels, supporting states, and visible keyboard focus.
- **Inverse Ground** (`paper-inverse`): the shared charcoal inverse surface.

**The Monochrome Chrome Rule.** Use black, white, charcoal, and gray for public headers and footers, authentication and recovery, and workspace headers and sidebars. Reserve pale pink and red for attention notices. Do not create role-specific themes.

**The Blue Main Content Rule.** Scope blue highlights to `.career-site > #main-content` and `.workspace-content > main`. This covers public discovery plus Candidate, Recruiter, and Staff content, including account pages within those workspace mains. Keep public and workspace chrome, authentication, and standalone recovery monochrome; keep semantic attention notices pink and red.

## Typography

**Display and body font:** Hanken Grotesk with system sans-serif fallbacks. The body stack additionally includes the Apple system fallback. This single-family system keeps Vietnamese recruitment content and compact workspaces coherent.

### Hierarchy

- **Display:** the fluid hero role in frontmatter; mobile uses a fixed size (32px) with slightly looser leading (1.24).
- **Headline:** responsive section headings; strong weight with restrained negative tracking.
- **Title:** job listing titles and step headings. Listing titles use comfortable leading for wrapping.
- **Body:** global leading from frontmatter. Actual surface sizes vary: hero description (17px, leading 1.7), ordinary descriptions (15px), and supporting workspace copy (14px).
- **Label:** compact navigation and information labels. Primary button labels are larger and bolder (15px, weight 700); metadata generally uses smaller type (12–13px).

Authentication headlines and workspace headings retain local responsive type scales. Do not force the public hero scale into dense task views. All sites use Hanken Grotesk for workspace and metadata text; there is no role-specific display face.

## Layout

The public container has a maximum width (1248px), automatic horizontal margins, and side padding (24px), reduced on phones (20px). The desktop header is sticky, bordered, and spacious (80px minimum height); it compresses through tablet (72px) to phone (68px).

Job listings form three columns with an inter-card gap (18px), then two columns below the tablet breakpoint, then one column with a smaller gap (12px) on phones. The same listing card serves the catalogue and the keyword-led two-column view. Search fields and button share a horizontal surface on desktop and stack on phones. Supporting content follows the same progression: desktop columns become a readable vertical sequence. Submitting a keyword switches the catalogue to a two-column reading layout: listing cards stack on the left and the selected listing detail, including its apply action, fills a sticky right pane. The filter panel belongs to that keyword view; without a keyword the catalogue stays a single grid.

A full listing keeps the public container and becomes one job sheet: a header carrying the company mark, verification badge, title, salary, location, mode, and recency joins the description, requirements, and a tinted verification note into a single left column. The apply card and general facts form a sticky right rail aligned with the top of that sheet. Below the tablet breakpoint the sheet separates back into cards and the apply action moves ahead of the description, with the facts panel closing the job content. Similar jobs reuse the listing grid.

Observed public breakpoints are width ceilings (1100px, 950px, 640px). Workspace and authentication components also use Tailwind responsive utilities; these are separate local layout thresholds, not replacements for the public breakpoints. Workspaces use side navigation and compact bordered content; mobile navigation is explicitly opened by a menu control. Authentication forms stack below their introduction on small screens.

The frontmatter spacing values are recurring observed intervals, not a claim that the application exposes a CSS spacing-token API. Public section spacing is generally larger (32–60px); listing interiors use compact padding (22px desktop, 20px phone).

Candidate and recruiter workspaces use a persistent full-height frame: an inset charcoal sidebar sits beside a fixed header and separately scrolling main area. The sidebar is 244px wide when expanded and 76px in its icon-only rail; links are 44px high with 20px icons. One existing 44px header control drives the shared saved `SidebarProvider` preference. Nested navigation keeps the sidebar and header mounted and changes only the main view. At 1100px and below, navigation uses the existing mobile drawer and explicit open/close controls. Staff keeps its charcoal workspace frame at 280px expanded and 80px compact with its existing local toggle.

## Elevation & Depth

Depth comes primarily from light tonal surfaces and quiet borders. Listing cards change their border and ground on hover rather than lifting. Redesigned workspace content suppresses small and medium utility shadows. The public search assembly is the deliberate exception: a soft shadow distinguishes the working search form from the neutral hero ground. Its exact shadow lives in the sidecar.

Workspace frames are flat at rest: charcoal rails, white headers, warm-neutral page grounds, and thin rules create separation without new shadows. Cards and editor sections change their ground or border for interaction and grouping.

**The Quiet Surface Rule.** Use tonal grounds and thin rules for ordinary content; preserve the search form's soft elevation as a functional exception.

## Shapes

Controls use gently curved corners (8px); search assemblies, listings, and upload areas use larger corners (12px). Supporting employer panels use the larger panel radius (16px). The shared radius scale also retains small and pill values for existing controls and status shapes. Popular skill chips have their own compact corners (5px). Borders are generally thin (1px); upload affordances use a dashed rule. Circular step markers and status shapes remain valid exceptions to rectangular containers.

Public search and cards use 12px corners; common controls and account/recovery fields use 8px. Candidate/recruiter inset workspace frames use 14px corners, while Staff retains its own existing frame geometry. Borders stay thin and neutral. Attention notices use the existing rounded container shape with pale pink fill; their red icon remains distinct from dark title and body text.

## Components

### Buttons

Confident and compact: the shared primary button uses the charcoal base face with white text, bold labels, and a minimum public action height (48px). Within public discovery and workspace main content, token-based actions use Content Blue. Outline buttons keep a white face and neutral border; scoped content uses the blue text treatment, while chrome uses charcoal. Shared application buttons also exist with a slightly shorter minimum height (44px). Focus uses a visible outline (3px) and offset (3px), charcoal in chrome and blue inside the two content scopes. Disabled controls retain readable labels and communicate their unavailable state. Color transitions are brief (160ms, ease).

### Chips

Popular skill links use white grounds, supporting ink, and compact padding. Hover turns their text charcoal and adds an underline. Status chips elsewhere communicate semantic states rather than introducing another palette.

### Cards / Containers

Job cards are white, thinly bordered, and softly rectangular. Hover shifts to the warm-neutral ground and charcoal border. A company mark precedes the job title; salary and location follow it, and a divided metadata row closes the card. Supporting panels use neutral gray wash. Authentication preserves its larger rounded form panel (16px), while redesigned workspace content normalizes large card corners to the listing radius.

### Inputs / Fields

Search fields use transparent backgrounds inside a shared white assembly, charcoal text, and muted placeholders. The desktop keyword/location separator becomes a horizontal separator when stacked. Search fields use blue carets and focus; token-based inputs in workspace main content use the same blue focus. Authentication and standalone recovery remain monochrome. Account-security fields in workspace main content keep their 48px controls and may use the scoped blue focus/action treatment. Validation retains semantic error colors; attention notices use a pale pink background, red icon, and dark title/body. Search assemblies are not the universal form field pattern.

### Navigation

Public navigation uses a white sticky band, thin bottom rule, and medium-weight labels. Current and hovered header links use the shared charcoal palette. Public discovery content and each workspace's main area use Content Blue for interactive and selected content emphasis. At narrower widths, inline links give way to an explicit expandable mobile menu. All workspace side navigation uses a charcoal rail with readable light labels and icons; the current destination is a white row with charcoal text. Preserve current-page semantics and mobile menu expanded state.

Candidate and recruiter navigation uses the persistent inset sidebar described above. Keep its single header toggle, saved collapsed state, icon-only rail, and three-link footer inside the role layout. Staff keeps its existing 280px/80px rail and local toggle while sharing the same palette.

### Search Assembly

Keyword, location, and action share a gently rounded, softly elevated white surface. Content Blue marks public search/apply actions, job titles, salaries, focus, and selected results; the public header/footer remain monochrome. Workspace main content uses the same blue hierarchy for actions, links, selected rows/tabs, section headings, account overview, and key figures, while workspace headers and rails stay monochrome. Guests and signed-in candidates share one public job browser: the guest catalogue is the default, a keyword reveals the two-column list and detail layout, and the filter panel appears with that keyword view. Job titles link to the full listing page, while selecting a card updates the detail pane in place. A keyword or location field must remain independently focusable on every device.

Short color and border transitions support state changes. Reduced-motion preference suppresses animation and transition duration. No new motion system is implied by the remaining legacy effects.

### Account and recovery controls

Account settings and `/account-recovery` reuse the shared 48px field and action treatment, with white fields and quiet actions, visible keyboard focus, and semantic states. Account settings within Candidate `/can/account` and Recruiter `/rec/account` receive the blue content treatment; standalone `/account-recovery` remains monochrome. The same `USER` account is available from both workspace routes; the exact quick-link labels and order in those workspace footers are part of the navigation pattern.

### Attention Notices

The shared `Alert` and existing `[role="alert"]` surfaces use a pale-pink rounded panel (16px), a red circle-exclamation mark (20px), and dark title/body text. Desktop padding is 20px 24px 20px 58px; on phones the notice uses 18px 18px 18px 48px and 14px text. The icon supplements the live-region message and does not carry the alert content by itself.

## Do's and Don'ts

### Do:

- Do use the shared monochrome palette for public and workspace chrome, authentication, and standalone recovery.
- Do use Content Blue for public discovery and the main content area of Candidate, Recruiter, and Staff workspaces, including account settings within those workspaces.
- Do reserve the pale-pink/red treatment for attention notices and keep their title and body dark.
- Do keep muted text on light surfaces and preserve visible field labels and focus outlines.
- Do adapt grids and search controls to a single column on small phones.
- Do preserve role-specific routes, existing content, and the distinction between simulated and integrated capabilities.
- Do keep the Candidate and Recruiter sidebars mounted and restore their shared saved collapse preference; nested routes change only the main view.
- Do keep the exact Candidate and Recruiter footer links, in order: **Cài đặt tài khoản**, **Chuyển phân hệ**, **Trang chủ**.
- Do retain the existing single header collapse control for Candidate/Recruiter and Staff's 280px/80px frame with its local toggle.
- Do preserve the shared 48px account and recovery form controls.

### Don't:

- Don't expose a theme selector or restore a saved palette preference.
- Don't introduce role-specific brand palettes. Use the shared semantic status colors for explicit state labels.
- Don't extend Content Blue to public headers/footers, authentication, standalone recovery, or workspace headers/sidebars.
- Don't strengthen unverified product claims or document simulated actions as production integrations.
- Don't inherit legacy icon-font or decorative eyebrow treatments as new component patterns.
- Don't add a second collapse toggle to the Candidate or Recruiter frame.

This record is extracted from `src/styles.css`, `src/site-polish.css`, `src/career.css`, shared shells, account forms, authentication layout, and the Guardian landing implementation. Existing Material Symbols usage in some workspace components and uppercase workspace eyebrows are legacy exceptions, not patterns for new UI. The fixed theme provider keeps the monochrome root palette and clears legacy saved-theme preferences; scoped main-content tokens supply the blue emphasis.

## Semantic icons and supporting illustrations

Use `@/components/icons` for the supplied GuardianWork domain glyphs and shared action symbols. The entry point normalizes `size` (default 15), explicit `width`/`height`, `currentColor`, ref forwarding, and decorative defaults across the supplied custom icons and licensed local Radix Icons 1.3.2 sources. Custom icons retain their original 15-unit stroke geometry; Radix paths retain their original fill geometry. Do not apply blanket stroke-width overrides. Keep the incumbent shield/check brand mark. Keep Lucide and Material Symbols while consumers remain.

Use distinct symbols for jobs/applications, talent/members, dossier review/company outcome, history/refresh, pending/loading, rejection/dismissal, and evidence unavailable/rejected dossier. Location uses the existing geographic map pin; Radix PinLeft means pin-to-edge. Generic confirmation uses CheckIcon; a company review outcome uses CompanyIcon with explicit outcome text. Icons supplement visible labels. Icon-only buttons carry their own accessible names, hit areas and focus behavior. For a larger icon inside the shared Button, override its descendant sizing locally (for example `[&_svg]:size-5`); the shared default stays 16px.

Use `GuardianIllustration` for approved decorative art: empty alt, accurate intrinsic dimensions, proportional containment, and lazy loading. Desktop introductions and workspace accents use a `<picture>` media source at 1100px, with a transparent fallback, to avoid downloading hidden artwork on phones. The public hero uses a grid with copy left, art right (400px maximum), and the search on its own full-width row. Below 1100px the artwork disappears and the established centered hero remains. Workspace welcome actions sit with the introduction; art stays on the right at 180px. Authentication art sits beneath introductory copy on the left at 200px, with the form on the right. Empty-state art is centered and compact (132px phone / 148px desktop), and only appears for genuine empty data, never loading, errors, or keyword/status-filter misses.

Illustrations are supporting content, not evidence of verification, safety, or legal compliance. Tables, forms, evidence, and decisions stay primary. Do not enlarge the supplied small cutouts into full-width hero artwork. Approved production derivatives live in `public/images/guardianwork/`; edited masters, provenance, licenses, and placement decisions live in `docs/design/assets/` and [the integration handoff](docs/design/asset-integration.md).

### Shared workspace navigation

The GW-95 sidebar update applies to Candidate and Recruiter workspaces; Staff keeps its existing 280px/80px layout and local toggle. Candidate and Recruiter use a charcoal inset panel with 44px navigation targets, standalone 20px icons, light labels, and a white selected row. Do not add the old large icon wells to these two rails. All workspace sidebar icons keep a transparent background through hover, press, selection and keyboard focus; inherit the row foreground and use the row highlight and focus outline for feedback. Locked Recruiter rows remain non-interactive and keep their permission explanation.

The sidebar expands to 244px and collapses to a 76px icon rail. A 44×44 header control toggles it; only an explicit toggle animates the grid for 240ms with short label fades (90–140ms). Restoring the saved display preference or changing viewport size does not animate; reduced-motion preference disables the transition. Labels stay accessible through their names and tooltips while collapsed. On mobile, use the full drawer, explicit open/close controls, Escape dismissal, and focus handling.

Both Candidate and recruiter footers contain exactly these three destinations, in this order: **Cài đặt tài khoản**, **Chuyển phân hệ**, **Trang chủ**. Account and workspace destinations remain role-aware. Overview routes use exact matching; only the current destination receives `aria-current="page"`. Keep these route and role boundaries when extending navigation.

Local size exceptions retained for existing compact metadata and sidebar footers are 12px and 13px. The illustrated desktop landing heading uses a 32–48px fluid range to keep the full-width search comfortably beneath the copy/art grid; the existing phone headline remains 32px.

The recruiter authentication illustration is `recruiter-login-illustration.webp` (640 × 463) with a newly rendered transparent PNG master (1475 × 1067). It remains 200px wide in the left introduction and hidden below 1100px; the candidate illustration and form behavior are unchanged. Its reference, prompt and export provenance are recorded with the design assets.

## Task-oriented workspace refinement

Recruiter access is derived from the shared account session and Company membership/verification responses. Recruiter sign-up uses the same `/auth/register` contract as candidate sign-up; Company details are entered later in the Company setup route. Do not reintroduce `/employer-registrations` or `/me/employer-onboarding`; the backend marks those flows `41030 ONBOARDING_RETIRED`.

Mounted candidate/recruiter pages use explicit patterns in `src/components/workspace.css`, imported by the real shells. This is a small set of repeated layout rules, not a universal page component. Avoid styling a heading through its accidental ancestry; `.workspace-heading` owns the page introduction, `.workspace-detail-header` owns a selected record, and `.workspace-prose` owns sustained text.

- Workspace headings are fixed 28px on wide screens and 25px on phones, with a 1.3 line height. Ordinary interface text uses Hanken Grotesk at 14–15px; legal answers use 16px with 1.85 leading. Compact metadata uses 12–13px only where it remains secondary. Ordinary labels and values do not use uppercase transforms or monospace. Genuine technical values/identifiers may use the existing mono font.
- Numeric summaries use a divided strip with 22px values. They support the task instead of acting as independent promotional cards. Introductions stay open; workspace art remains a small accent.
- Search and filters sit immediately beside their result collection. Selection collections use a single surface with divided rows, an explicit selected wash, keyboard activation, and visible focus. The selected detail is a separate quiet surface. At widths below 1100px these compose in one column; candidate selection scrolls to the detail at that same threshold.
- Prose uses spacing, section headings, and rules rather than a stack of nested tinted boxes. Legal reference text remains unchanged; capability/sample context is visible in a concise disclosure. No legal or verification claim is strengthened by visual emphasis.
- Applications use a comparison table with an accessible horizontal-scroll region. Member and job tables likewise expose their overflow regions to keyboard users. Independent profile and experience records can still use cards where grouping carries meaning.
- Source disclosures distinguish API-backed identity/Company verification, browser-local records/actions, and illustrative records. Sample CV controls without a file or handler show an explicit unavailable state. Do not imply a real download, message delivery, AI connection, or legal certification from a simulated control.
- Page actions outrank global shortcuts. Recruiter job creation in the shared header is a quiet outline action; the current page's primary task retains the strongest action treatment.
- Dialogs have a viewport-bounded height, scrollable content, readable titles, a 44px close target with a Vietnamese accessible name, and a restrained overlay. Preserve Radix focus trapping, Escape behavior, and existing decision validation.

The comprehensive route/data coverage matrix is [docs/design/surface-coverage.md](docs/design/surface-coverage.md). Source truth and any pending copy approvals are recorded in the handoff rather than silently rewritten. Legacy view components that are not mounted are outside the implementation surface.


### Status tags and staff contrast

Status labels share semantic colors across public listings, recruiter publishing/history, verification, membership and staff operations. Use dark green on #e7f5eb for verified/approved/active states, dark red on #fde9e7 for rejected/blocked states, dark blue on #e8f0ff for information, amber on #fff1d2 for pending/paused states, and slate on #edf0f3 for drafts/inactive/closed states. Keep explicit text, a current-color border and bold labels; color supplements the status wording. Tokens and shared selectors live in `src/site-polish.css`. Neutral drafts never imply failure.

Staff content follows an open white layout with charcoal headings, white table headers, thin neutral dividers, and blue primary/retry actions. Avoid enclosing each section in a bordered card or tinted header; retain distinct colored status tags and pale pink error notices. The overview account summary uses spaced label/value rows. `staff-colors.css` is scoped by the staff portal body attribute, including portalled dialogs. Staff error notifications use a full-width pale pink banner, a red exclamation icon and dark, left-aligned text. Destructive confirmation actions retain red.


Staff lists distinguish each category within the same collection rather than collapsing unrelated states into one positive/negative hue. Audit actions use green verification, red rejection, orange hiding, blue restoration, purple locking and teal unlocking. Review queues use amber pending, green approved, red rejected and purple withdrawn. Reports use blue received, amber reviewing and teal recorded. Account access and company verification retain separate status labels. Staff-only supplementary badge tones live in `staff-colors.css` and reuse `StaffStatusBadge`.


### GuardianWork logo blue

The GuardianWork wordmark and shield use dedicated brand blue (#2557a7) on light surfaces across public headers/footer wordmark, authentication, invitation pages and workspace headers. On charcoal workspace sidebars use #91baff for legibility. These logo-only blue tokens do not remap action blue, semantic statuses, supporting taglines, or the monochrome shell. Keep the existing brand name and shield geometry.


Staff jobs displays API-backed revision approval and the existing `JobManagementPanel` for “Rà soát AI theo pháp luật” together on one scrollable screen, with in-page section links and no switching tabs. The latter uses illustrative records and local actions, with a visible source disclosure; it is not a live scan service. Findings show excerpts, explanations and links to the official Labour Code record for deposits, original documents, discriminatory conditions, overtime and probation. Approval decisions remain in the real review queue. Desktop-only verification applies.


Each API-backed job detail includes `JobLegalReview` beside its decision controls. With no backend AI contract available, it displays an explicit AI-unavailable state plus a deterministic, local keyword screen of the current revision title, description and screening prompts. Findings include exact excerpts and official Labour Code links. Matching is advisory, includes negations and cannot certify compliance; no-match output says so explicitly. Recompute from fresh revision content on reload; never attach sample findings or inferred AI output to real reviews. Backend approval eligibility and version-checked decisions remain authoritative.

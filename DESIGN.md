---
name: GuardianWork
description: Guardian Blue recruitment with a scoped employer workspace palette.
colors:
  primary: "#0868c9"
  primary-hover: "#0755a3"
  primary-deep: "#064887"
  primary-subtle: "#e9f3ff"
  paper: "#ffffff"
  paper-2: "#f3f6fb"
  paper-3: "#e8eff8"
  paper-inverse: "#152a46"
  ink: "#172d49"
  ink-2: "#435771"
  ink-3: "#5a6d84"
  rule: "#dde5ef"
  rule-2: "#afbed0"
  support-orange: "#df650d"
  success: "#147953"
  error: "#b42318"
  error-container: "#fee4e2"
  on-error-container: "#912018"
  recruiter-accent: "#2557a7"
  recruiter-accent-hover: "#164081"
  recruiter-accent-deep: "#153d75"
  recruiter-accent-subtle: "#eef3fb"
  recruiter-paper: "#ffffff"
  recruiter-ground: "#f7f7f6"
  recruiter-inset: "#eeeeec"
  recruiter-ink: "#2d2d2d"
  recruiter-muted: "#595959"
  recruiter-muted-2: "#666666"
  recruiter-border: "#e4e2e0"
  recruiter-border-strong: "#949494"
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
  recruiter-control: 6px
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
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: 13px 24px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
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
  recruiter-primary-action:
    backgroundColor: "{colors.recruiter-accent}"
    textColor: "{colors.recruiter-paper}"
    rounded: "{rounded.recruiter-control}"
    padding: 10.4px 16px
  recruiter-primary-action-hover:
    backgroundColor: "{colors.recruiter-muted}"
  recruiter-job-action:
    backgroundColor: "{colors.recruiter-accent}"
    textColor: "{colors.recruiter-paper}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 10px 20px
  recruiter-job-action-hover:
    backgroundColor: "{colors.recruiter-accent-hover}"
  recruiter-job-field:
    backgroundColor: "{colors.recruiter-paper}"
    textColor: "{colors.recruiter-ink}"
    rounded: "{rounded.md}"
    height: 48px
  recruiter-overview-shortcut:
    backgroundColor: "{colors.recruiter-paper}"
    textColor: "{colors.recruiter-ink}"
    rounded: "{rounded.xl}"
    padding: 28px 24px
---

# Design System: GuardianWork

## Overview

**Creative North Star: "Familiar recruitment, clear next steps"**

Guardian Blue is a familiar, clear recruitment interface: white surfaces, cool blue-gray supporting grounds, dark blue text, and decisive blue actions. The user selected the category-standard direction with VietnamWorks as the craft reference. The VietnamWorks reference was not accessible for direct visual comparison; supplied Indeed employer screens guide the scoped recruiter extension.

GuardianWork is a multi-industry recruitment platform. Public browsing uses generous search and listing areas, with business, marketing, finance, HR, operations and technology as peer categories. Public, candidate, staff, and authentication surfaces keep the shared Guardian Blue system. The recruiter workspace has a user-requested, Indeed-inspired local palette and denser employer-console layout; this is a scoped surface extension, not a product-wide identity change. Existing role boundaries and workflows remain the source of product behavior.

**Key Characteristics:**

- White and cool blue-gray surfaces with Guardian Blue actions.
- Hanken Grotesk for headings, body copy, labels, and workspace UI.
- Quiet borders, gently curved controls, and compact information hierarchy.
- An Indeed-inspired blue and warm-neutral palette scoped to recruiter surfaces.

## Colors

The palette is light, cool, and practical. Frontmatter values are normative; the names below describe their roles.

### Primary

- **Guardian Blue** (`primary`): primary actions, active links, salaries, search icons, and brand emphasis. Hover and deep variants serve interaction states.
- **Clear Blue Wash** (`primary-subtle`): hero backgrounds, selected navigation, and supporting panels.

### Secondary

- **Supporting Orange** (`support-orange`): existing secondary emphasis, used sparingly; it does not replace Guardian Blue actions.
- **Success Green** (`success`): affirmative status. Error tokens belong to validation and failure states.

### Neutral

- **White Paper** (`paper`): navigation, cards, and form surfaces.
- **Cool Ground / Cool Inset** (`paper-2`, `paper-3`): page grounds, grouped content, and company marks.
- **Deep Ink / Supporting Ink / Muted Ink** (`ink`, `ink-2`, `ink-3`): primary text, explanatory copy, and metadata.
- **Quiet Rule / Strong Rule** (`rule`, `rule-2`): dividers, borders, and dashed upload boundaries.
- **Inverse Ground** (`paper-inverse`): available shared inverse surface token; ordinary application surfaces remain light.

**The Guardian Blue Rule.** Keep Guardian Blue primary actions and focus consistent on public, candidate, staff, and authentication surfaces. The recruiter workspace alone uses its documented local blue and neutral palette; do not propagate that surface treatment elsewhere.

### Recruiter workspace extension

The recruiter workspace uses a restrained, Indeed-inspired blue with warm-neutral grounds. The named recruiter tokens in the frontmatter are scoped to `/recruiter` surfaces, including the workspace shell, overview, verification and membership pages, and job creation. The white brand header and existing GuardianWork identity remain visible within that local treatment.

- **Recruiter Blue** (`recruiter-accent`, `recruiter-accent-hover`, `recruiter-accent-deep`): recruiter actions, active text links, form focus, and selected steps.
- **Recruiter Blue Wash** (`recruiter-accent-subtle`): selected or supporting recruiter surfaces.
- **Warm White / Soft Warm Ground / Warm Inset** (`recruiter-paper`, `recruiter-ground`, `recruiter-inset`): cards and main content, page grounds, and grouped rows.
- **Recruiter Charcoal / Supporting Gray / Quiet Gray** (`recruiter-ink`, `recruiter-muted`, `recruiter-muted-2`): primary content, supporting copy, and secondary metadata.
- **Warm Rule / Strong Gray Rule** (`recruiter-border`, `recruiter-border-strong`): separators, control borders, and hover boundaries.

**The Scoped Recruiter Palette Rule.** Apply these local tokens only inside the recruiter workspace. Other GuardianWork roles keep their existing palette.

## Typography

**Display and body font:** Hanken Grotesk with system sans-serif fallbacks. The body stack additionally includes the Apple system fallback. This single-family system keeps Vietnamese recruitment content and compact workspaces coherent.

### Hierarchy

- **Display:** the fluid hero role in frontmatter; mobile uses a fixed size (32px) with slightly looser leading (1.24).
- **Headline:** responsive section headings; strong weight with restrained negative tracking.
- **Title:** job listing titles and step headings. Listing titles use comfortable leading for wrapping.
- **Body:** global leading from frontmatter. Actual surface sizes vary: hero description (17px, leading 1.7), ordinary descriptions (15px), and supporting workspace copy (14px).
- **Label:** compact navigation and information labels. Primary button labels are larger and bolder (15px, weight 700); metadata generally uses smaller type (12–13px).

Authentication headlines and workspace headings retain local responsive type scales. Do not force the public hero scale into dense task views. The repository includes Geist Mono for legacy metadata; the redesigned public footer and workspace metadata use the body family.

The recruiter workspace keeps Hanken Grotesk while using a compact employer-console hierarchy: page headings range from 28px to 38px on wide screens and reduce to 25px on narrow phones; ordinary job-editor text is 16px and labels are 16px. Recruiter metadata stays secondary and readable in the existing body family.

## Layout

The public container has a maximum width (1248px), automatic horizontal margins, and side padding (24px), reduced on phones (20px). The desktop header is sticky, bordered, and spacious (80px minimum height); it compresses through tablet (72px) to phone (68px).

Job listings form three columns with an inter-card gap (18px), then two columns below the tablet breakpoint, then one column with a smaller gap (12px) on phones. The same listing card serves the catalogue and the keyword-led two-column view. Search fields and button share a horizontal surface on desktop and stack on phones. Supporting content follows the same progression: desktop columns become a readable vertical sequence. Submitting a keyword switches the catalogue to a two-column reading layout: listing cards stack on the left and the selected listing detail, including its apply action, fills a sticky right pane. The filter panel belongs to that keyword view; without a keyword the catalogue stays a single grid.

A full listing keeps the public container and becomes one job sheet: a header carrying the company mark, verification badge, title, salary, location, mode, and recency joins the description, requirements, and a tinted verification note into a single left column. The apply card and general facts form a sticky right rail aligned with the top of that sheet. Below the tablet breakpoint the sheet separates back into cards and the apply action moves ahead of the description, with the facts panel closing the job content. Similar jobs reuse the listing grid.

Observed public breakpoints are width ceilings (1100px, 950px, 640px). Workspace and authentication components also use Tailwind responsive utilities; these are separate local layout thresholds, not replacements for the public breakpoints. Workspaces use side navigation and compact bordered content; mobile navigation is explicitly opened by a menu control. Authentication forms stack below their introduction on small screens.

The frontmatter spacing values are recurring observed intervals, not a claim that the application exposes a CSS spacing-token API. Public section spacing is generally larger (32–60px); listing interiors use compact padding (22px desktop, 20px phone).

Candidate and recruiter workspaces use a persistent full-height frame: a light inset sidebar sits beside a fixed header and a separately scrolling main area. The sidebar panel is 244px wide when expanded and 76px in its icon-only rail; links are 44px high with simple 20px icons. Nested navigation keeps the sidebar and header mounted and changes only the main view. Below the desktop rail breakpoint, navigation opens as a full mobile drawer.

## Elevation & Depth

Depth comes primarily from light tonal surfaces and quiet borders. Listing cards change their border and ground on hover rather than lifting. Redesigned workspace content suppresses small and medium utility shadows. The public search assembly is the deliberate exception: a soft shadow distinguishes the working search form from the blue hero ground. Its exact shadow lives in the sidecar.

The recruiter workspace is flat at rest: the dark rail, white top bar, warm page ground, and thin rules create separation without new shadows. Recruiter cards and editor sections change their ground or border for interaction and grouping.

**The Quiet Surface Rule.** Use tonal grounds and thin rules for ordinary content; preserve the search form's soft elevation as a functional exception.

## Shapes

Controls use gently curved corners (8px); search assemblies, listings, and upload areas use larger corners (12px). Supporting employer panels use the larger panel radius (16px). The shared radius scale also retains small and pill values for existing controls and status shapes. Popular skill chips have their own compact corners (5px). Borders are generally thin (1px); upload affordances use a dashed rule. Circular step markers and status shapes remain valid exceptions to rectangular containers.

Recruiter controls use 6px corners where the existing employer action specifies them, while job-editor controls use 8px and list/editor surfaces use 12px. Overview shortcuts are softly rectangular (16px), with a thin warm-gray border. Keep the overall recruiter surface square-edged and information-led; use radius only to group a card or control.

## Components

### Buttons

Confident and compact: a blue face with white text, bold labels, and a minimum public action height (48px). Outline buttons keep a white face, blue text, and blue border; hover adds the blue wash. Shared application buttons also exist with a slightly shorter minimum height (44px). Focus uses a visible blue outline (3px) and offset (3px). Disabled controls reduce opacity and change the cursor. Color transitions are brief (160ms, ease).

Recruiter actions are an existing local variant with smaller label text (13px), smaller corners (6px), and a muted-ink hover face. Record this as a local implementation exception; use the common public button pattern when creating a new general-purpose action.

### Chips

Popular skill links use white grounds, supporting ink, and compact padding. Hover turns their text blue and adds an underline. Status chips elsewhere communicate semantic states rather than acting as theme accents.

### Cards / Containers

Job cards are white, thinly bordered, and softly rectangular. Hover shifts to the cool ground and blue border. A company mark precedes the job title; salary and location follow it, and a divided metadata row closes the card. Supporting panels use cool ground or blue wash. Authentication preserves its larger rounded form panel (16px), while redesigned workspace content normalizes large card corners to the listing radius.

### Inputs / Fields

Search fields use transparent backgrounds inside a shared white assembly, dark text, and muted placeholders. The desktop keyword/location separator becomes a horizontal separator when stacked. Inputs retain a usable minimum height (44px), visible keyboard focus, and blue carets. Validation uses semantic error colors. Ordinary authentication fields retain their local bordered form styling; search assemblies are not the universal form field pattern.

### Navigation

Public navigation uses a white sticky band, thin bottom rule, and medium-weight labels. Current and hovered links become blue with a bottom indicator. At narrower widths, the inline links give way to an explicit expandable mobile menu. Workspace side navigation highlights the current destination with a blue wash and blue text. Preserve current-page semantics and mobile menu expanded state.

Candidate and recruiter navigation uses the compact inset sidebar described above. Keep its header toggle, icon-only collapsed rail, and three-link footer inside the persistent role layout; Staff navigation remains unchanged.

### Search Assembly

Keyword, location, and action share a gently rounded, softly elevated white surface. This is the recurring public-to-workspace discovery pattern. Guests and signed-in candidates share one public job browser: the guest catalogue is the default, a keyword reveals the two-column list and detail layout, and the filter panel appears with that keyword view. Job titles link to the full listing page, while selecting a card updates the detail pane in place. A keyword or location field must remain independently focusable on every device.

Short color and border transitions support state changes. Reduced-motion preference suppresses animation and transition duration. No new motion system is implied by the remaining legacy effects.

### Recruiter workspace extension (scoped)

The employer console reuses the shared workspace shell, semantic icon set, `Button`, job forms, and `GuardianIllustration`; recruiter styling is applied locally around those pieces.

- **Navigation:** a charcoal desktop rail with light labels and icons. The current destination reverses to a white row with charcoal text. Hover stays on the rail and does not imply current-page state. At widths up to 1100px, use the existing explicit drawer controls and Escape dismissal. Desktop rail widths are 280px expanded and 80px compact.
- **Primary actions:** recruiter actions use Recruiter Blue with white text; supporting job-editor actions use a white face and warm border. Keep page actions stronger than header shortcuts. Job-editor buttons and fields have 48px minimum height; navigation and icon controls retain usable hit areas from the shared components.
- **Overview shortcuts:** white bordered cards with centered existing Guardian illustrations (180px by 120px), generous internal spacing (28px 24px), and a soft-warm hover ground. They remain links to actual recruiter tasks.
- **Job editor:** a white bordered surface with divided form sections (32px padding on desktop, 24px by 20px on phones), labeled fields, and visible focus and validation states. Inputs use a warm-gray border, white background, and 8px corners. The current step uses a blue marker; unavailable steps keep readable supporting-gray labels. Error treatment continues to use the established semantic error tokens.

The overview's candidate counts are visibly disclosed as illustrative data. Keep that disclosure and existing service-backed company and job workflows intact when changing presentation.

## Do's and Don'ts

### Do:

- Do use Guardian Blue for primary actions, active navigation, and keyboard focus on public, candidate, staff, and authentication surfaces.
- Do keep muted text on light surfaces and preserve visible field labels and focus outlines.
- Do adapt grids and search controls to a single column on small phones.
- Do preserve role-specific routes, existing content, and the distinction between simulated and integrated capabilities.
- Do keep the Candidate/recruiter sidebar and header mounted while nested navigation changes only the main view.
- Do keep the exact three role-aware quick links at the bottom of both Candidate and recruiter sidebars.
- Do keep the compact collapsible rail scoped to Candidate and recruiter; preserve the Staff sidebar.

### Don't:

- Don't expose a theme selector or restore a saved palette preference.
- Don't introduce a different visual identity beyond the recruiter workspace exception documented here.
- Don't strengthen unverified product claims or document simulated actions as production integrations.
- Don't inherit legacy icon-font or decorative eyebrow treatments as new component patterns.
- Don't restore large icon wells or oversized sidebar icons to the Candidate/recruiter rail.

This record is extracted from `src/styles.css`, `src/career.css`, shared shells, authentication layout, the fixed theme provider, and the Guardian landing implementation. Existing Material Symbols usage in some workspace components and uppercase workspace eyebrows are legacy exceptions, not patterns for new UI. The stale stylesheet comment about saved themes does not represent runtime behavior: the theme provider fixes Guardian Blue and clears the legacy preference.

## Semantic icons and supporting illustrations

Use `@/components/icons` for the supplied GuardianWork domain glyphs and shared action symbols. The entry point normalizes `size` (default 15), explicit `width`/`height`, `currentColor`, ref forwarding, and decorative defaults across the supplied custom icons and licensed local Radix Icons 1.3.2 sources. Custom icons retain their original 15-unit stroke geometry; Radix paths retain their original fill geometry. Do not apply blanket stroke-width overrides. Keep the incumbent shield/check brand mark. Keep Lucide and Material Symbols while consumers remain.

Use distinct symbols for jobs/applications, talent/members, dossier review/company outcome, history/refresh, pending/loading, rejection/dismissal, and evidence unavailable/rejected dossier. Location uses the existing geographic map pin; Radix PinLeft means pin-to-edge. Generic confirmation uses CheckIcon; a company review outcome uses CompanyIcon with explicit outcome text. Icons supplement visible labels. Icon-only buttons carry their own accessible names, hit areas and focus behavior. For a larger icon inside the shared Button, override its descendant sizing locally (for example `[&_svg]:size-5`); the shared default stays 16px.

Use `GuardianIllustration` for approved decorative art: empty alt, accurate intrinsic dimensions, proportional containment, and lazy loading. Desktop introductions and workspace accents use a `<picture>` media source at 1100px, with a transparent fallback, to avoid downloading hidden artwork on phones. The public hero uses a grid with copy left, art right (400px maximum), and the search on its own full-width row. Below 1100px the artwork disappears and the established centered hero remains. Workspace welcome actions sit with the introduction; art stays on the right at 180px. Authentication art sits beneath introductory copy on the left at 200px, with the form on the right. Empty-state art is centered and compact (132px phone / 148px desktop), and only appears for genuine empty data, never loading, errors, or keyword/status-filter misses.

Illustrations are supporting content, not evidence of verification, safety, or legal compliance. Tables, forms, evidence, and decisions stay primary. Do not enlarge the supplied small cutouts into full-width hero artwork. Approved production derivatives live in `public/images/guardianwork/`; edited masters, provenance, licenses, and placement decisions live in `docs/design/assets/` and [the integration handoff](docs/design/asset-integration.md).

### Shared workspace navigation

The GW-95 sidebar update applies to Candidate and recruiter workspaces; Staff navigation keeps its existing layout. Candidate and recruiter use a light inset panel with 44px navigation targets, standalone 20px icons, muted ink, and a quiet blue selected ground. Do not add the old large icon wells to these two rails. Locked recruiter rows remain non-interactive and keep their permission explanation.

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

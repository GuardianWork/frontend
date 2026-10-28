---
name: GuardianWork
description: A familiar Vietnamese recruitment platform in Guardian Blue.
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
---

# Design System: GuardianWork

## Overview

**Creative North Star: "Familiar recruitment, clear next steps"**

Guardian Blue is a familiar, clear recruitment interface: white surfaces, cool blue-gray supporting grounds, dark blue text, and decisive blue actions. The user selected the category-standard direction with VietnamWorks as the craft reference. The implementation is code-first; the reference was not accessible for direct visual comparison.

GuardianWork is a multi-industry recruitment platform. Public browsing uses generous search and listing areas, with business, marketing, finance, HR, operations and technology as peer categories. Candidate, recruiter, administrator, and authentication surfaces use the same tokens with task-appropriate density. Existing role boundaries and workflows remain the source of product behavior.

**Key Characteristics:**

- White and cool blue-gray surfaces with Guardian Blue actions.
- Hanken Grotesk for headings, body copy, labels, and workspace UI.
- Quiet borders, gently curved controls, and compact information hierarchy.

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

**The Guardian Blue Rule.** Guardian Blue is the only product theme. Keep primary actions and focus consistent across public pages, authentication, and workspaces.

## Typography

**Display and body font:** Hanken Grotesk with system sans-serif fallbacks. The body stack additionally includes the Apple system fallback. This single-family system keeps Vietnamese recruitment content and compact workspaces coherent.

### Hierarchy

- **Display:** the fluid hero role in frontmatter; mobile uses a fixed size (32px) with slightly looser leading (1.24).
- **Headline:** responsive section headings; strong weight with restrained negative tracking.
- **Title:** job listing titles and step headings. Listing titles use comfortable leading for wrapping.
- **Body:** global leading from frontmatter. Actual surface sizes vary: hero description (17px, leading 1.7), ordinary descriptions (15px), and supporting workspace copy (14px).
- **Label:** compact navigation and information labels. Primary button labels are larger and bolder (15px, weight 700); metadata generally uses smaller type (12–13px).

Authentication headlines and workspace headings retain local responsive type scales. Do not force the public hero scale into dense task views. The repository includes Geist Mono for legacy metadata; the redesigned public footer and workspace metadata use the body family.

## Layout

The public container has a maximum width (1248px), automatic horizontal margins, and side padding (24px), reduced on phones (20px). The desktop header is sticky, bordered, and spacious (80px minimum height); it compresses through tablet (72px) to phone (68px).

Job listings form three columns with an inter-card gap (18px), then two columns below the tablet breakpoint, then one column with a smaller gap (12px) on phones. The same listing card serves the catalogue and the keyword-led two-column view. Search fields and button share a horizontal surface on desktop and stack on phones. Supporting content follows the same progression: desktop columns become a readable vertical sequence. Submitting a keyword switches the catalogue to a two-column reading layout: listing cards stack on the left and the selected listing detail, including its apply action, fills a sticky right pane. The filter panel belongs to that keyword view; without a keyword the catalogue stays a single grid.

A full listing keeps the public container and becomes one job sheet: a header carrying the company mark, verification badge, title, salary, location, mode, and recency joins the description, requirements, and a tinted verification note into a single left column. The apply card and general facts form a sticky right rail aligned with the top of that sheet. Below the tablet breakpoint the sheet separates back into cards and the apply action moves ahead of the description, with the facts panel closing the job content. Similar jobs reuse the listing grid.

Observed public breakpoints are width ceilings (1100px, 950px, 640px). Workspace and authentication components also use Tailwind responsive utilities; these are separate local layout thresholds, not replacements for the public breakpoints. Workspaces use side navigation and compact bordered content; mobile navigation is explicitly opened by a menu control. Authentication forms stack below their introduction on small screens.

The frontmatter spacing values are recurring observed intervals, not a claim that the application exposes a CSS spacing-token API. Public section spacing is generally larger (32–60px); listing interiors use compact padding (22px desktop, 20px phone).

## Elevation & Depth

Depth comes primarily from light tonal surfaces and quiet borders. Listing cards change their border and ground on hover rather than lifting. Redesigned workspace content suppresses small and medium utility shadows. The public search assembly is the deliberate exception: a soft shadow distinguishes the working search form from the blue hero ground. Its exact shadow lives in the sidecar.

**The Quiet Surface Rule.** Use tonal grounds and thin rules for ordinary content; preserve the search form's soft elevation as a functional exception.

## Shapes

Controls use gently curved corners (8px); search assemblies, listings, and upload areas use larger corners (12px). Supporting employer panels use the larger panel radius (16px). The shared radius scale also retains small and pill values for existing controls and status shapes. Popular skill chips have their own compact corners (5px). Borders are generally thin (1px); upload affordances use a dashed rule. Circular step markers and status shapes remain valid exceptions to rectangular containers.

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

### Search Assembly

Keyword, location, and action share a gently rounded, softly elevated white surface. This is the recurring public-to-workspace discovery pattern. Guests and signed-in candidates share one public job browser: the guest catalogue is the default, a keyword reveals the two-column list and detail layout, and the filter panel appears with that keyword view. Job titles link to the full listing page, while selecting a card updates the detail pane in place. A keyword or location field must remain independently focusable on every device.

Short color and border transitions support state changes. Reduced-motion preference suppresses animation and transition duration. No new motion system is implied by the remaining legacy effects.

## Do's and Don'ts

### Do:

- Do use Guardian Blue for primary actions, active navigation, and keyboard focus.
- Do keep muted text on light surfaces and preserve visible field labels and focus outlines.
- Do adapt grids and search controls to a single column on small phones.
- Do preserve role-specific routes, existing content, and the distinction between simulated and integrated capabilities.

### Don't:

- Don't expose a theme selector or restore a saved palette preference.
- Don't introduce a different visual identity for a workspace or authentication page.
- Don't strengthen unverified product claims or document simulated actions as production integrations.
- Don't inherit legacy icon-font or decorative eyebrow treatments as new component patterns.

This record is extracted from `src/styles.css`, `src/career.css`, shared shells, authentication layout, the fixed theme provider, and the Guardian landing implementation. Existing Material Symbols usage in some workspace components and uppercase workspace eyebrows are legacy exceptions, not patterns for new UI. The stale stylesheet comment about saved themes does not represent runtime behavior: the theme provider fixes Guardian Blue and clears the legacy preference.

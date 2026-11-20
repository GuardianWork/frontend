# Staff job revision detail

Mode: Operate. Desktop only, review at 1440×1000. Scope: the detail selected from /staff/jobs; preserve queue, role boundaries and version-checked decisions.

## Direction contract

THESIS: A revision review desk brings submitted content and AI evidence together while keeping publication status separate from the revision decision.

OWN-WORLD: Extend GuardianWork's established Hanken Grotesk, white sheets, neutral ground and blue content accents. Framed sheet, seed 2048302028; preserve the existing workspace shell. Quiet borders and no resting shadows.

STORY: Identify the revision, read its content, inspect shared AI evidence, check company eligibility, then approve or reject. Revision history stays inline below the working sheet.

FIRST VIEWPORT: Compact object heading and publication status above a two-column desk. A wide white sheet combines the saved revision and a compact version-bound AI analysis toolbar, readable job facts and description. Current findings mark the text inline and the full report expands in place, without separate tabs. A 320px decision rail carries approval, company eligibility and publication controls. AI evidence stays alongside the submitted content. The workspace clips positioned accessible captions and contains scroll chaining.

FORM: seed: none (unavailable). Code-led extension of the existing recruiter detail pattern. The signature is evidence in context: current real AI findings highlight matching passages, with legal citations disclosed beside each finding. No charts, invented metrics, generated imagery or new palette. Staff automatically reads the selected revision’s associated analysis; no manual scan ID and no staff scan creation. The proposed latest read endpoints require the pending sibling-backend integration.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Data inventory

- Selected review ID, job ID, company ID and revision number identify the object.
- Revision version and job version govern decisions; never infer them from local counters.
- Submitted title, description, location, employment type and work arrangement remain authoritative.
- Compensation is disclosed or missing; preserve currency and pay period.
- Deadline, headcount and screening questions come from submitted content.
- Company verification and suspension control eligibility.
- Revision approval and public visibility are independent statuses.
- Analysis is resolved automatically for the selected revision and viewed locking version, with internal scan-ID polling while processing.
- Stale, stub and failed scans must not annotate current content.
- History supports sorting, paging and selecting a revision.

Question: Can this submitted revision be approved, and what evidence needs review?
Face: GuardianWork blue on actions and key job facts, with Hanken Grotesk and the existing brand mark.

## Shipped constraints

- The desktop detail combines submitted content and AI in one white reading sheet, with version history directly below it. The 320px right rail stays sticky and groups revision eligibility, the version-checked decision, and separate publication controls.
- Staff analysis loads by JD revision; no scan identifier is entered or shared by the user. The frontend expects the proposed latest-analysis read endpoint, whose backend implementation is pending its required branch/API approval. Scan results and polling stay with the revision. Inline findings and expandable full reports share the content view.
- Only a completed, non-stub, non-outdated scan retrieved for the exact viewed revision and locking version annotates submitted content. Matching content can reuse an association created before a lifecycle-only locking-version increment. Other scan states remain readable with their status and analyzed-text disclosure, but do not highlight the current submission. The local keyword review remains a separate preliminary check, not an AI result or legal clearance.
- Revision approval and public posting status are independent. The posting controls keep suspension/restoration separate from the revision decision.


## Concrete routes and scrolling

Staff job detail is `/staff/jobs/$revisionId`; the revision ID is the URL identity. Back returns to validated list status/page search. Account and verification details use `/staff/accounts/$accountType/$accountId` and `/staff/verifications/$companyId`; report quick views remain modal. Browser refresh and history restore the selected record from the route and API. The detail's “Tải lại bản tin” action re-fetches the revision, history, posting status, and queue data. Expired staff sessions retain a validated staff return destination. The workspace main is positioned relatively to contain off-screen accessible table captions and uses overscroll containment. At 1440×1000, long-content checks assert a viewport-sized document with no outer scrolling, inner workspace scrolling, and a stationary header.

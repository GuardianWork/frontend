# Candidate JD analysis

Candidates and anonymous readers can read the persisted AI analysis alongside the
published job description at `/can/jobs?job=<id>` and `/jobs?job=<id>`. This extends
the existing recruiter/staff presentation without granting scan creation or private
revision access. The requesting user authorized this feature on the current branch
on 2026-11-22.

## Backend contract

`GET /api/jobs/{id}` includes nullable `aiAnalysis` with `mode`, `outdated`,
`asOfDate`, `completedAt`, `analysisText`, and an allowlisted `report` containing
`schemaVersion`, `outcome`, `findings`, and `warnings`. Report findings retain the
existing source spans, severity, verdict, explanation, and citations. Public reports
do not contain private scan IDs, usage, profile, or queue/attempt metadata.

The backend selects the latest completed scan associated with the exact published
revision in the same Company/job and matching its canonical content hash. It returns
null when none exists; a newer queued/failed scan does not replace a completed report.
Public reads do not invoke the AI adapter. Job suspension and Company visibility
checks continue to apply, with `Cache-Control: no-store`. The sibling backend change
must ship with this frontend to supply reports; an older backend remains readable
and displays the missing-analysis state.

## Presentation and verification

The candidate view reuses recruiter inline highlights and expandable explanations
and legal citations. The summary identifies the report date and advisory scope.
An older date/configuration remains readable with an explicit warning because the
content still matches the published JD. Stub mode explicitly states that no AI
analysis was performed and never renders risk highlights. Missing analysis keeps
the JD and application link available. Malformed optional reports show an explicit
analysis-unavailable notice while retaining the JD and application link. A full-report disclosure retains findings
that cannot be placed in a unique description passage, including findings in other
job fields. Zero findings never certifies legal compliance.

Existing detail polling/focus/reconnect refreshes update reports and remove content
when public retrieval fails or a posting is hidden. No candidate action starts a
scan. No dependency or schema change is required by the frontend.

The desktop regression is `tests/ui/candidate-job-analysis.spec.ts` (1440×1000).
It covers findings/citations, keyboard disclosure, missing/stub/older reports,
unmatched passages, zero findings, and analysis removal after a public 404. Its
HTTP reports are explicit fixtures, not evidence of live provider quality. Service
tests cover the public projection, older-backend compatibility, and malformed output.

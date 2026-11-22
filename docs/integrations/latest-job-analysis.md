# Revision analysis through one POST (proposed backend contract)

Recruiter and Staff analysis panels now use only:

```http
POST /api/jobs/{jobId}/revisions/{revisionId}/scans
Authorization: Bearer <token>
Content-Type: application/json

{"expectedRevisionVersion": 2}
```

**Integration prerequisite:** the backend consolidation has not been implemented.
Existing backend GET/Company/Staff scan routes may still exist. This frontend
requires the proposed shared POST behavior; browser tests simulate that behavior,
and do not establish live backend compatibility. There is no fallback to the old
scan routes. Deploy the matching backend before enabling this frontend flow.

The selected JD supplies jobId, revisionId and revisionVersion. Opening a page or
editing content does not request analysis. Users must save local edits first;
analysis always targets the displayed saved revision. Recruiters can also request
analysis of a retained revision when there is no editable working revision.
Staff requests analysis explicitly from the revision detail.

The backend must return the existing state/result for the same content, including
FAILED, without creating a fresh attempt. The frontend discards scan identifiers
from responses and never stores or uses them. QUEUED/RUNNING schedule the same POST
after two seconds, with the original revision identity and unchanged request body.
COMPLETED and FAILED stop polling. Rechecking a failure is labeled as checking its
status, and the UI explains that the same revision returns the retained failure.

All HTTP failures stop polling. HTTP 400 asks users to check request parameters;
401 uses existing authentication recovery and asks for login if recovery fails;
403/404 explain that the JD cannot be accessed; 409 discards analysis and reloads
the JD and locking version without automatically starting another analysis;
503 explains temporary unavailability. Network and malformed-response failures
also stop polling. Changing JD/revision/version or unmounting aborts pending scan
requests and timers, and late responses are ignored.

COMPLETED exposes analysisText and report in keyboard-operable disclosures. Stub,
outdated and report warnings remain visible in the report; the disclosure summary
also labels stub/outdated results. Findings and quotations render as React text,
never executable HTML. Inline current-JD findings require completed, non-stub,
non-outdated evidence requested for the current displayed revision version. The
response's retained association version can predate a lifecycle-only version bump
when the backend determines that the content is identical.

Candidate public `aiAnalysis` remains the existing read-only publication projection;
it does not use private Company/Staff scan routes. This change does not add a
candidate scan action or change backend authorization, moderation or publication.

Verification: service contract tests in `src/services/jobScans.test.mjs`, and
desktop Recruiter/Staff regressions in `tests/ui/job-publishing.spec.ts` and
`tests/ui/staff-job-detail.spec.ts`.

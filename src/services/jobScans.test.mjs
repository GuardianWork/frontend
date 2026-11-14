import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import { requestJobScan, getJobScan, getStaffJobScan } from "./jobScans.ts";
const originalFetch = globalThis.fetch;
const scan = {
  scanId: 401,
  revisionId: 91,
  revisionVersion: 3,
  status: "QUEUED",
  mode: "crawler",
  outdated: false,
  report: null,
  analysisText: "😀 Mô tả",
  asOfDate: "2026-11-12",
};
beforeEach(() => {
  globalThis.localStorage = {
    getItem: (key) =>
      key === AUTH_SESSION_KEY
        ? JSON.stringify({
            accessToken: "scan-access",
            refreshToken: "refresh",
            expiresAt: Date.now() + 60000,
          })
        : null,
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.localStorage;
});
test("recruiter scan requests use saved revision version and authenticated JSON; known scans use exact endpoints", async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    assert.equal(init.headers.Authorization, "Bearer scan-access");
    return Response.json({ status: 200, message: "OK", data: scan });
  };
  await requestJobScan(83, 91, 3);
  assert.equal(calls[0].url, "/api/companies/me/jobs/83/revisions/91/scans");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].init.body), { expectedRevisionVersion: 3 });
  await getJobScan(83, 91, 401);
  await getStaffJobScan(91, 401);
  assert.equal(calls[1].url, "/api/companies/me/jobs/83/revisions/91/scans/401");
  assert.equal(calls[2].url, "/api/staff/job-revisions/91/scans/401");
});
test("scan reads reject a different snapshot identity and malformed completed findings", async () => {
  for (const data of [
    { ...scan, revisionId: 92 },
    { ...scan, scanId: 402 },
    {
      ...scan,
      status: "COMPLETED",
      report: { schemaVersion: "1", findings: [null], warnings: [], outcome: "NEEDS_REVIEW" },
    },
  ]) {
    globalThis.fetch = async () => Response.json({ status: 200, data });
    await assert.rejects(getJobScan(83, 91, 401), /không hợp lệ/);
  }
});

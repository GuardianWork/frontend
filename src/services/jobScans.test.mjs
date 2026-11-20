import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import {
  requestJobScan,
  getJobScan,
  getStaffJobScan,
  getLatestJobScan,
  getLatestStaffJobScan,
} from "./jobScans.ts";
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

test("latest scans are resolved by the viewed revision and current locking version", async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(url);
    assert.equal(init.headers.Authorization, "Bearer scan-access");
    return Response.json({ data: { ...scan, revisionVersion: 2, outdated: false } });
  };
  const result = await getLatestStaffJobScan(91, 3);
  assert.equal(result.revisionVersion, 2); // Identical content survives a submission-only version bump.
  await getLatestJobScan(83, 91, 3);
  assert.deepEqual(calls, [
    "/api/staff/job-revisions/91/scans/latest?expectedRevisionVersion=3",
    "/api/companies/me/jobs/83/revisions/91/scans/latest?expectedRevisionVersion=3",
  ]);
});

test("a missing analysis is distinct from lookup failure or another revision's result", async () => {
  globalThis.fetch = async () => Response.json({ data: null });
  assert.equal(await getLatestStaffJobScan(91, 3), null);
  globalThis.fetch = async () => Response.json({ data: { ...scan, revisionId: 92 } });
  await assert.rejects(getLatestStaffJobScan(91, 3), /không hợp lệ/);
  globalThis.fetch = async () => Response.json({ message: "Unavailable" }, { status: 503 });
  await assert.rejects(getLatestStaffJobScan(91, 3), (error) => error.status === 503);
});

import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import { requestJobScan, requestSharedJobScan, scanReadError } from "./jobScans.ts";
import { ApiError } from "./api.ts";
const originalFetch = globalThis.fetch;
const scan = {
  revisionId: 91,
  revisionVersion: 3,
  status: "QUEUED",
  mode: "crawler",
  outdated: false,
  report: null,
  analysisText: null,
  asOfDate: "2026-11-12",
};
beforeEach(() => {
  globalThis.localStorage = {
    removeItem() {},
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
test("all audiences initiate and poll with the same authenticated revision POST and unchanged body", async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return Response.json({ data: { ...scan, scanId: 999 } });
  };
  const signal = new AbortController().signal;
  const result = await requestJobScan(83, 91, 3, signal);
  await requestSharedJobScan(83, 91, 3, signal);
  assert.equal("scanId" in result, false);
  assert.equal(result.analysisText, "");
  for (const { url, init } of calls) {
    assert.equal(url, "/api/jobs/83/revisions/91/scans");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization, "Bearer scan-access");
    assert.equal(init.headers["Content-Type"], "application/json");
    assert.equal(init.body, '{"expectedRevisionVersion":3}');
    assert.equal(init.signal, signal);
    assert.equal(init.cache, "no-store");
  }
});
test("accepts a completed shared report with mode and analysis date on the scan", async () => {
  const report = {
    schemaVersion: "1",
    outcome: "NEEDS_REVIEW",
    warnings: ["Review the supporting evidence."],
    findings: [
      {
        spanText: "Example",
        start: 0,
        end: 7,
        riskType: "TEST",
        severity: "high",
        verdict: "NEEDS_REVIEW",
        explanation: "Review the wording.",
        citations: [],
      },
    ],
  };
  const data = { ...scan, status: "COMPLETED", analysisText: "Example", report };
  globalThis.fetch = async () => Response.json({ data });
  assert.deepEqual(await requestSharedJobScan(83, 91, 3), data);
});
test("rejects missing results, wrong revision, malformed snapshots and incomplete reports", async () => {
  for (const data of [
    null,
    { ...scan, revisionId: 92 },
    { ...scan, analysisText: {} },
    { ...scan, status: "COMPLETED", analysisText: "text", report: null },
    { ...scan, status: "COMPLETED", analysisText: null },
    { ...scan, revisionVersion: -1 },
  ]) {
    globalThis.fetch = async () => Response.json({ data });
    await assert.rejects(requestJobScan(83, 91, 3), /không hợp lệ/);
  }
});
test("a retained scan can have an older association version for unchanged content", async () => {
  globalThis.fetch = async () => Response.json({ data: { ...scan, revisionVersion: 2 } });
  assert.equal((await requestJobScan(83, 91, 3)).revisionVersion, 2);
});
test("HTTP failures propagate for terminal polling and JD recovery", async () => {
  for (const status of [400, 401, 403, 404, 409, 503]) {
    globalThis.fetch = async () => Response.json({ message: "Unavailable" }, { status });
    await assert.rejects(requestJobScan(83, 91, 3), (error) => error.status === status);
  }
});
test("messages identify request, login, access, version and availability recovery", () => {
  for (const [status, pattern] of [
    [400, /tham số/],
    [401, /đăng nhập lại/],
    [403, /Không thể truy cập JD/],
    [404, /Không thể truy cập JD/],
    [409, /Phiên bản tin đã thay đổi/],
    [503, /chưa khả dụng/],
  ])
    assert.match(scanReadError(new ApiError("error", status)), pattern);
});

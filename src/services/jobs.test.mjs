import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import { ApiError } from "./api.ts";
import { createJob, previewJob, saveJob, setJobAssignment, submitJob, jobError } from "./jobs.ts";

const originalFetch = globalThis.fetch;
const job = {
  id: 83,
  version: 5,
  status: "DRAFT",
  ownerResponsible: true,
  needsReassignment: false,
  workingRevision: { id: 91, version: 7, state: "DRAFT", content: { title: "Kế toán" } },
  assignments: [],
  availableActions: ["SAVE_DRAFT", "PREVIEW"],
};
beforeEach(() => {
  globalThis.sessionStorage = {
    getItem: (key) =>
      key === AUTH_SESSION_KEY
        ? JSON.stringify({
            accessToken: "job-access",
            refreshToken: "refresh",
            expiresAt: Date.now() + 60000,
          })
        : null,
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.sessionStorage;
});

test("invalid mutation and preview receipts never become confirmed job state", async () => {
  for (const data of [null, {}, { ...job, version: undefined }, { ...job, workingRevision: {} }]) {
    globalThis.fetch = async () => Response.json({ status: 200, data });
    await assert.rejects(createJob({ title: "Kế toán" }), /không hợp lệ/);
    await assert.rejects(saveJob(job, { title: "Bản sửa" }), /không hợp lệ/);
  }
  globalThis.fetch = async () => Response.json({ status: 200, data: { submissionEligible: true } });
  await assert.rejects(previewJob(83), /không hợp lệ/);
});
test("submission confirms the exact server-previewed versions with authenticated API requests", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/companies/me/jobs/83/revisions/91/submit");
    assert.equal(init.headers.Authorization, "Bearer job-access");
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(init.body), {
      expectedJobVersion: 8,
      expectedRevisionVersion: 11,
      confirmed: true,
    });
    return Response.json({ status: 200, data: job });
  };
  await submitJob(job, { jobVersion: 8, revisionVersion: 11 });
});
test("unassignment carries the version in the query; a conflict remains actionable", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/companies/me/jobs/83/assignments/7?expectedJobVersion=5");
    assert.equal(init.method, "DELETE");
    assert.equal(init.body, undefined);
    return Response.json(
      { status: 409, message: "40022 CONCURRENT_MODIFICATION", data: null },
      { status: 409 },
    );
  };
  await assert.rejects(
    setJobAssignment(job, 7, false),
    (error) =>
      error instanceof ApiError &&
      error.status === 409 &&
      jobError(error).includes("đang nhập vẫn được giữ"),
  );
});

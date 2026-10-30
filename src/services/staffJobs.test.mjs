import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import {
  decideStaffJobReview,
  getStaffJobReview,
  listStaffJobReviews,
  staffJobHistory,
} from "./staffJobs.ts";
const originalFetch = globalThis.fetch;
const review = {
  id: 91,
  jobId: 83,
  companyId: 12,
  revisionNumber: 2,
  state: "PENDING_REVIEW",
  jobVersion: 5,
  revisionVersion: 7,
  content: { title: "Kế toán" },
  companyVerified: true,
  companySuspended: false,
  needsReassignment: false,
  approvalEligible: true,
  validationIssues: [],
};
beforeEach(() => {
  globalThis.sessionStorage = {
    getItem: (key) =>
      key === AUTH_SESSION_KEY
        ? JSON.stringify({
            accessToken: "staff-access",
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
test("staff queue, inspection and history use authenticated paginated backend contracts", async () => {
  const paths = [];
  globalThis.fetch = async (url, init) => {
    paths.push(url);
    assert.equal(init.headers.Authorization, "Bearer staff-access");
    assert.equal(init.cache, "no-store");
    return Response.json({
      data: url.endsWith("/91")
        ? review
        : { content: [review], pageNumber: 1, pageSize: 20, totalElements: 21, totalPages: 2 },
    });
  };
  assert.equal((await listStaffJobReviews("REJECTED", 1)).totalElements, 21);
  assert.equal((await getStaffJobReview(91)).id, 91);
  await staffJobHistory(83, 1);
  assert.deepEqual(paths, [
    "/api/staff/job-revisions?status=REJECTED&page=1&size=20",
    "/api/staff/job-revisions/91",
    "/api/staff/jobs/83/revisions?page=1&size=20",
  ]);
});
test("decision sends inspected versions and trimmed rejection reason and validates receipt", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/staff/job-revisions/91/decision");
    assert.equal(init.method, "PUT");
    assert.deepEqual(JSON.parse(init.body), {
      expectedJobVersion: 5,
      expectedRevisionVersion: 7,
      outcome: "REJECTED",
      reason: "Cần bổ sung thông tin lương.",
    });
    return Response.json({
      data: {
        jobId: 83,
        revisionId: 91,
        outcome: "REJECTED",
        publicationStatus: "PUBLISHED",
        jobVersion: 6,
        revisionVersion: 8,
      },
    });
  };
  assert.equal(
    (await decideStaffJobReview(review, "REJECTED", "  Cần bổ sung thông tin lương.  "))
      .publicationStatus,
    "PUBLISHED",
  );
});
test("invalid responses and short rejection reasons cannot confirm a decision", async () => {
  globalThis.fetch = async () => {
    throw new Error("must not send invalid reason");
  };
  await assert.rejects(decideStaffJobReview(review, "REJECTED", "short"), /10/);
  for (const data of [null, {}, { ...review, jobVersion: undefined }]) {
    globalThis.fetch = async () => Response.json({ data });
    await assert.rejects(getStaffJobReview(91), /không hợp lệ/);
    await assert.rejects(decideStaffJobReview(review, "APPROVED", ""), /không hợp lệ/);
  }
  globalThis.fetch = async () => Response.json({ data: { ...review, id: 92 } });
  await assert.rejects(getStaffJobReview(91), /không hợp lệ/);
});
test("server conflicts propagate without pretending to save a decision", async () => {
  globalThis.fetch = async () =>
    Response.json({ message: "40022 CONCURRENT_MODIFICATION" }, { status: 409 });
  await assert.rejects(
    decideStaffJobReview(review, "APPROVED", ""),
    (error) => error.status === 409,
  );
});

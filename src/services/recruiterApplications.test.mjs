import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import { ApiError } from "./api.ts";
import {
  APPLICATION_STATUSES,
  listRecruiterApplications,
  listRecruiterApplicationInbox,
  getRecruiterApplication,
  changeApplicationStatus,
  getApplicationPdf,
} from "./recruiterApplications.ts";
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.localStorage;
});
function mock(handler, jobStatus = "PUBLISHED") {
  globalThis.localStorage = {
    removeItem: () => {},
    getItem: (key) =>
      key === AUTH_SESSION_KEY
        ? JSON.stringify({
            accessToken: "access",
            refreshToken: "refresh",
            expiresAt: Date.now() + 60000,
          })
        : null,
  };
  globalThis.fetch = (url, init) => {
    assert.equal(init.headers.Authorization, "Bearer access");
    assert.equal(init.cache, "no-store");
    const match = url.match(/\/companies\/me\/jobs\/(\d+)$/);
    if (match) return Promise.resolve(response({ id: Number(match[1]), status: jobStatus }));
    return handler(url, init);
  };
}
const detail = {
  id: "a1",
  candidateName: "Nguyễn An",
  jobId: 42,
  jobTitle: "Kinh doanh",
  companyName: "Alpha",
  status: "SUBMITTED",
  version: 0,
  appliedAt: "2026-11-01T08:00:00Z",
  email: "an@example.test",
  phoneNumber: "0901234567",
  coverLetter: "Xin chào",
  cvFileName: "cv.pdf",
  cvContentType: "application/pdf",
  cvFileSize: 123,
  candidateFeedback: null,
  history: [],
};
function response(data) {
  return Response.json({ status: 200, data });
}

test("recruiter list accepts seven statuses and sends combined server filters", async () => {
  mock((url) => {
    const query = new URL(url, "http://localhost").searchParams;
    assert.equal(query.get("search"), "Nguyen");
    assert.equal(query.get("status"), "UNDER_REVIEW");
    assert.equal(query.get("page"), "2");
    return response({
      content: APPLICATION_STATUSES.map((status) => ({ ...detail, status })),
      pageNumber: 2,
      pageSize: 20,
      totalElements: 45,
      totalPages: 3,
      first: false,
      last: true,
    });
  });
  const page = await listRecruiterApplications(42, " Nguyen ", 2, undefined, "UNDER_REVIEW");
  assert.equal(page.content.length, 7);
});

test("malformed recruiter rows fail instead of displaying invented statuses", async () => {
  mock(() =>
    response({
      content: [{ ...detail, status: "UNKNOWN" }],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    }),
  );
  await assert.rejects(listRecruiterApplications(42, "", 0), ApiError);
});

test("final application details discard personal evidence even when server accidentally supplies it", async () => {
  for (const status of ["REJECTED", "WITHDRAWN"]) {
    mock(() => response({ ...detail, status }));
    const result = await getRecruiterApplication(42, "a1");
    assert.equal(result.email, null);
    assert.equal(result.phoneNumber, null);
    assert.equal(result.coverLetter, null);
    assert.equal(result.cvFileName, null);
    assert.equal(result.cvFileSize, 0);
  }
});

test("status change sends version and keeps private and candidate text in separate fields", async () => {
  const change = {
    status: "REJECTED",
    version: 3,
    rejectionReason: "OTHER",
    internalExplanation: "Private",
    candidateFeedback: "Thank you",
  };
  mock((url, init) => {
    assert.equal(url, "/api/companies/me/jobs/42/applications/a1/status");
    assert.equal(init.method, "PATCH");
    assert.deepEqual(JSON.parse(init.body), change);
    return response({ ...detail, status: "REJECTED", version: 4 });
  });
  assert.equal((await changeApplicationStatus(42, "a1", change)).version, 4);
});

test("status conflicts retain 409 for explicit refresh", async () => {
  mock(() => Response.json({ status: 409, message: "Conflict", data: null }, { status: 409 }));
  await assert.rejects(
    changeApplicationStatus(42, "a1", { status: "SHORTLISTED", version: 0 }),
    (error) => error instanceof ApiError && error.status === 409,
  );
});

test("PDF viewing uses bearer authentication, handles unsupported formats, and rejects HTML", async () => {
  mock((url, init) => {
    assert.equal(url, "/api/companies/me/jobs/42/applications/a1/cv");
    assert.equal(new Headers(init.headers).get("Accept"), "application/pdf, application/json");
    return new Response("%PDF-1.4", { headers: { "Content-Type": "application/pdf" } });
  });
  assert.equal((await getApplicationPdf(42, "a1")).type, "application/pdf");
  mock(() => Response.json({ status: 406, message: "Unsupported", data: null }, { status: 406 }));
  await assert.rejects(
    getApplicationPdf(42, "a1"),
    (error) => error instanceof ApiError && error.status === 406,
  );
  mock(() => new Response("<html>Error</html>", { headers: { "Content-Type": "text/html" } }));
  await assert.rejects(getApplicationPdf(42, "a1"), ApiError);
});

test("PDF error envelopes preserve the backend status without refreshing a valid session", async () => {
  for (const status of [403, 404, 406, 503]) {
    let refreshCalls = 0;
    mock((url, init) => {
      const accept = new Headers(init.headers).get("Accept") || "";
      // Reproduces the running Spring endpoint: PDF-only negotiation masks JSON errors as 401.
      const negotiated = accept.includes("application/json") ? status : 401;
      return Response.json(
        { status: negotiated, message: "CV unavailable", data: null },
        { status: negotiated },
      );
    });
    const authenticatedCvFetch = globalThis.fetch;
    globalThis.fetch = (url, init) => {
      if (url === "/api/auth/refresh") {
        refreshCalls++;
        return Response.json(
          { status: 401, message: "Unexpected refresh", data: null },
          { status: 401 },
        );
      }
      return authenticatedCvFetch(url, init);
    };
    await assert.rejects(
      getApplicationPdf(20, "a5255d30-aa53-4868-8c15-d95484488d6c"),
      (error) => error instanceof ApiError && error.status === status,
    );
    assert.equal(refreshCalls, 0);
  }
});

test("company inbox sends filters with optional job scope and validates row routing context", async () => {
  for (const jobId of [undefined, 42]) {
    mock((url, init) => {
      const parsed = new URL(url, "http://localhost");
      assert.equal(parsed.pathname, "/api/companies/me/applications");
      assert.equal(parsed.searchParams.get("jobId"), jobId === undefined ? null : "42");
      assert.equal(parsed.searchParams.get("search"), "Nguyen");
      assert.equal(parsed.searchParams.get("status"), "SUBMITTED");
      assert.equal(parsed.searchParams.get("page"), "1");
      assert.equal(parsed.searchParams.get("size"), "20");
      assert.ok(init.signal);
      return response({
        content: [detail],
        pageNumber: 1,
        pageSize: 20,
        totalElements: 21,
        totalPages: 2,
        first: false,
        last: true,
      });
    });
    const result = await listRecruiterApplicationInbox(
      jobId,
      " Nguyen ",
      1,
      new AbortController().signal,
      "SUBMITTED",
    );
    assert.equal(result.content[0].jobId, 42);
  }
  for (const changes of [{ jobId: undefined }, { jobId: 0 }, { jobId: 1.5 }, { jobTitle: null }]) {
    mock(() =>
      response({
        content: [{ ...detail, ...changes }],
        pageNumber: 0,
        pageSize: 20,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      }),
    );
    await assert.rejects(listRecruiterApplicationInbox(undefined, "", 0), ApiError);
  }
});

test("application history preserves actor display names and rejects malformed names", async () => {
  const event = {
    fromStatus: null,
    toStatus: "SUBMITTED",
    actorUserId: 3,
    occurredAt: detail.appliedAt,
    rejectionReason: null,
    internalExplanation: null,
    candidateFeedback: null,
  };
  for (const actorName of ["Nguyễn Minh Anh", null, undefined]) {
    mock(() => response({ ...detail, history: [{ ...event, actorName }] }));
    const result = await getRecruiterApplication(42, "a1");
    assert.equal(result.history[0].actorName, actorName);
  }
  mock(() => response({ ...detail, history: [{ ...event, actorName: 123 }] }));
  await assert.rejects(getRecruiterApplication(42, "a1"), ApiError);
});

test("suspension blocks every job-scoped application read, mutation and CV request before evidence is fetched", async () => {
  let calls = 0;
  mock(() => {
    calls++;
    throw new Error("Restricted endpoint must not be called");
  }, "SUSPENDED");
  for (const operation of [
    () => listRecruiterApplications(42, "", 0),
    () => listRecruiterApplicationInbox(42, "", 0),
    () => getRecruiterApplication(42, "a1"),
    () => changeApplicationStatus(42, "a1", { status: "UNDER_REVIEW", version: 0 }),
    () => getApplicationPdf(42, "a1"),
  ])
    await assert.rejects(operation, /đã bị đình chỉ/);
  assert.equal(calls, 0);
});

test("inbox omits suspended-job applicants and refuses CV bytes when suspension occurs in flight", async () => {
  mock(() =>
    response({
      content: [
        { ...detail, jobId: 42 },
        { ...detail, id: "a2", jobId: 77 },
      ],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
    }),
  );
  const original = globalThis.fetch;
  globalThis.fetch = (url, init) =>
    url.endsWith("/jobs/42")
      ? Promise.resolve(response({ id: 42, status: "SUSPENDED" }))
      : original(url, init);
  assert.deepEqual(
    (await listRecruiterApplicationInbox(undefined, "", 0)).content.map((row) => row.id),
    ["a2"],
  );
  let checks = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith("/jobs/42"))
      return response({ id: 42, status: ++checks === 1 ? "PUBLISHED" : "SUSPENDED" });
    return new Response("%PDF-1.7", { headers: { "Content-Type": "application/pdf" } });
  };
  await assert.rejects(getApplicationPdf(42, "a1"), /đã bị đình chỉ/);
  assert.equal(checks, 2);
});

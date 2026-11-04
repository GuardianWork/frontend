import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "./api.ts";
import { AUTH_SESSION_KEY } from "./auth.ts";
import {
  listApplicationCounts,
  listApplications,
  listApplicationPage,
  parseApplicationPage,
  parseSubmittedApplication,
  submitApplication,
} from "./candidateApplications.ts";

const originalFetch = globalThis.fetch;

function session() {
  return {
    getItem: (key) =>
      key === AUTH_SESSION_KEY
        ? JSON.stringify({
            accessToken: "candidate-access",
            refreshToken: "refresh",
            expiresAt: Date.now() + 60000,
          })
        : null,
  };
}

const sampleApplication = {
  id: "application-1",
  jobId: 42,
  jobTitle: "Frontend Engineer",
  companyId: 101,
  companyName: "Alpha",
  status: "SUBMITTED",
  appliedAt: "2026-04-01T00:00:00.000Z",
  cvFileName: "resume.pdf",
};

test("listApplications uses the authenticated candidate endpoint and normalizes the response", async () => {
  globalThis.sessionStorage = session();
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "/api/candidate/applications");
      assert.equal(init.method, undefined);
      assert.equal(init.headers.Authorization, "Bearer candidate-access");
      return Response.json({
        status: 200,
        data: [sampleApplication, { ...sampleApplication, id: "application-2" }],
      });
    };

    const applications = await listApplications();
    assert.equal(applications.length, 2);
    assert.equal(applications[0].id, "application-1");
    assert.equal(applications[0].jobId, 42);
    assert.equal(applications[1].cvFileName, "resume.pdf");
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.sessionStorage;
  }
});

test("listApplications tolerates a non-array response", async () => {
  globalThis.sessionStorage = session();
  try {
    globalThis.fetch = async () => Response.json({ status: 200, data: { applications: [] } });
    assert.deepEqual(await listApplications(), []);
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.sessionStorage;
  }
});

test("submitApplication posts a trimmed application payload and returns the parsed result", async () => {
  globalThis.sessionStorage = session();
  try {
    const payload = {
      jobId: 7,
      fullName: "Nguyễn An",
      email: "an@example.test",
      phoneNumber: "0901234567",
      coverLetter: "Xin chào nhà tuyển dụng",
      cvId: "cv-7",
    };

    globalThis.fetch = async (url, init) => {
      assert.equal(url, "/api/candidate/applications");
      assert.equal(init.method, "POST");
      assert.equal(init.headers.Authorization, "Bearer candidate-access");
      assert.deepEqual(JSON.parse(init.body), {
        jobId: payload.jobId,
        fullName: payload.fullName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        cvId: payload.cvId,
        coverLetter: payload.coverLetter,
      });
      return Response.json({
        status: 201,
        data: {
          ...sampleApplication,
          id: "application-created",
          jobId: payload.jobId,
          cvFileName: "an-cv.pdf",
        },
      });
    };

    const application = await submitApplication(payload);
    assert.equal(application.id, "application-created");
    assert.equal(application.jobId, 7);
    assert.equal(application.cvFileName, "an-cv.pdf");
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.sessionStorage;
  }
});

test("submitApplication omits an empty cover letter", async () => {
  globalThis.sessionStorage = session();
  try {
    globalThis.fetch = async (_url, init) => {
      assert.deepEqual(JSON.parse(init.body), {
        jobId: 9,
        fullName: "Tester",
        email: "tester@example.test",
        phoneNumber: "0900000000",
        cvId: "cv-9",
      });
      return Response.json({
        status: 201,
        data: { ...sampleApplication, id: "application-9", jobId: 9 },
      });
    };

    await submitApplication({
      jobId: 9,
      fullName: "Tester",
      email: "tester@example.test",
      phoneNumber: "0900000000",
      coverLetter: null,
      cvId: "cv-9",
    });
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.sessionStorage;
  }
});

test("invalid application responses are rejected instead of being treated as success", async () => {
  globalThis.sessionStorage = session();
  try {
    for (const data of [null, {}, { jobId: 1 }, { id: 123 }]) {
      globalThis.fetch = async () => Response.json({ status: 200, data });
      await assert.rejects(
        submitApplication({
          jobId: 1,
          fullName: "Tester",
          email: "tester@example.test",
          phoneNumber: "0900000000",
          cvId: "cv-1",
        }),
        (error) => error instanceof ApiError && /không hợp lệ/.test(error.message),
      );
    }

    globalThis.fetch = async () =>
      Response.json({ status: 200, data: [sampleApplication, { jobId: 2 }] });
    await assert.rejects(
      listApplications(),
      (error) => error instanceof ApiError && /không hợp lệ/.test(error.message),
    );
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.sessionStorage;
  }
});

test("parseSubmittedApplication validates and normalizes primitive application data", () => {
  assert.throws(
    () => parseSubmittedApplication(null),
    (error) => error instanceof ApiError && /không hợp lệ/.test(error.message),
  );
  assert.throws(
    () => parseSubmittedApplication({}),
    (error) => error instanceof ApiError && /không hợp lệ/.test(error.message),
  );
  assert.throws(
    () => parseSubmittedApplication({ id: 42 }),
    (error) => error instanceof ApiError && /không hợp lệ/.test(error.message),
  );

  const parsed = parseSubmittedApplication({
    id: "app-2",
    jobId: "7",
    companyId: null,
    cvFileName: null,
  });
  assert.equal(parsed.id, "app-2");
  assert.equal(parsed.jobId, 7);
  assert.equal(parsed.companyId, 0);
  assert.equal(parsed.cvFileName, "");
  assert.equal(parsed.status, "SUBMITTED");
  assert.equal(parsed.location, "");
  assert.equal(parsed.workMode, "");
  assert.equal(parsed.deadline, "");
});

test("parseSubmittedApplication reads the optional job snapshot without inventing values", () => {
  const snapshot = parseSubmittedApplication({
    id: "app-3",
    jobId: 12,
    location: "  TP. Hồ Chí Minh ",
    workMode: "ONSITE",
    deadline: "2026-12-01T16:59:59Z",
  });
  assert.equal(snapshot.location, "TP. Hồ Chí Minh");
  assert.equal(snapshot.workMode, "ONSITE");
  assert.equal(snapshot.deadline, "2026-12-01T16:59:59Z");

  const publicJobNames = parseSubmittedApplication({
    id: "app-4",
    jobId: 13,
    workArrangement: "REMOTE",
    applicationDeadline: "2026-11-15",
  });
  assert.equal(publicJobNames.workMode, "REMOTE");
  assert.equal(publicJobNames.deadline, "2026-11-15");
  assert.equal(publicJobNames.location, "");
});

test("listApplications unwraps the paginated candidate response", async () => {
  globalThis.sessionStorage = session();
  try {
    globalThis.fetch = async () =>
      Response.json({
        status: 200,
        data: {
          content: [sampleApplication],
          pageNumber: 0,
          pageSize: 20,
          totalElements: 1,
          totalPages: 1,
        },
      });
    const applications = await listApplications();
    assert.equal(applications.length, 1);
    assert.equal(applications[0].id, "application-1");
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.sessionStorage;
  }
});

test("listApplicationPage sends search, status and paging to the candidate endpoint", async () => {
  globalThis.sessionStorage = session();
  try {
    globalThis.fetch = async (url) => {
      const parsed = new URL(String(url), "http://localhost");
      assert.equal(parsed.pathname, "/api/candidate/applications");
      assert.equal(parsed.searchParams.get("search"), "ky su");
      assert.equal(parsed.searchParams.get("status"), "UNDER_REVIEW");
      assert.equal(parsed.searchParams.get("page"), "2");
      assert.equal(parsed.searchParams.get("size"), "10");
      return Response.json({
        status: 200,
        data: {
          content: [sampleApplication],
          pageNumber: 2,
          pageSize: 10,
          totalElements: 21,
          totalPages: 3,
        },
      });
    };
    const page = await listApplicationPage({
      search: "  ky su  ",
      status: "UNDER_REVIEW",
      page: 2,
      size: 10,
    });
    assert.equal(page.items.length, 1);
    assert.equal(page.pageNumber, 2);
    assert.equal(page.totalElements, 21);
    assert.equal(page.totalPages, 3);
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.sessionStorage;
  }
});

test("listApplicationCounts returns one exact total per status from size-one reads", async () => {
  globalThis.sessionStorage = session();
  try {
    const totals = { "": 11, SUBMITTED: 5, UNDER_REVIEW: 4, REJECTED: 2 };
    const seenStatuses = [];

    globalThis.fetch = async (url) => {
      const parsed = new URL(String(url), "http://localhost");
      assert.equal(parsed.pathname, "/api/candidate/applications");
      assert.equal(parsed.searchParams.get("search"), "ky su");
      assert.equal(parsed.searchParams.get("page"), "0");
      assert.equal(parsed.searchParams.get("size"), "1");
      const status = parsed.searchParams.get("status") ?? "";
      seenStatuses.push(status);
      return Response.json({
        status: 200,
        data: {
          content: [],
          pageNumber: 0,
          pageSize: 1,
          totalElements: totals[status],
          totalPages: totals[status],
        },
      });
    };

    const counts = await listApplicationCounts({ search: "  ky su  " });
    assert.deepEqual(counts, { all: 11, submitted: 5, underReview: 4, rejected: 2 });
    assert.deepEqual(new Set(seenStatuses), new Set(["", "SUBMITTED", "UNDER_REVIEW", "REJECTED"]));
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.sessionStorage;
  }
});

test("parseApplicationPage filters and paginates an older array response locally", () => {
  const applications = [
    { ...sampleApplication, id: "a-1", jobTitle: "Kỹ sư Backend", status: "UNDER_REVIEW" },
    { ...sampleApplication, id: "a-2", jobTitle: "Kế toán", status: "SUBMITTED" },
    { ...sampleApplication, id: "a-3", jobTitle: "Ky su Frontend", status: "UNDER_REVIEW" },
  ];
  const page = parseApplicationPage(applications, {
    search: "ky su",
    status: "UNDER_REVIEW",
    page: 0,
    size: 1,
  });
  assert.deepEqual(
    page.items.map((application) => application.id),
    ["a-1"],
  );
  assert.equal(page.totalElements, 2);
  assert.equal(page.totalPages, 2);
});

test("parseApplicationPage rejects an invalid page envelope", () => {
  assert.throws(
    () => parseApplicationPage({ content: "not-an-array" }),
    (error) => error instanceof ApiError && /không hợp lệ/.test(error.message),
  );
});

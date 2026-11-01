import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "./api.ts";
import { AUTH_SESSION_KEY } from "./auth.ts";
import {
  listApplications,
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
});

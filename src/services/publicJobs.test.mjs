import assert from "node:assert/strict";
import { test } from "node:test";
import { searchPublicJobs, toSalaryRange } from "./publicJobs.ts";
import { AUTH_SESSION_KEY } from "./auth.ts";

test("searchPublicJobs builds the canonical backend query", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(
      url,
      "/api/jobs/search?keyword=kinh+doanh&location=Ha+Noi&employmentType=FULL_TIME&workArrangement=REMOTE&salaryMin=1000000&salaryMax=2000000&page=1&size=10",
    );
    return Response.json({
      status: 200,
      data: {
        content: [],
        pageNumber: 1,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        first: false,
        last: true,
      },
    });
  };
  const result = await searchPublicJobs({
    keyword: "kinh doanh",
    location: "Ha Noi",
    employmentType: "FULL_TIME",
    workArrangement: "REMOTE",
    salaryMin: 1_000_000,
    salaryMax: 2_000_000,
    page: 1,
    size: 10,
  });
  assert.equal(result.totalElements, 0);
  globalThis.fetch = originalFetch;
});

test("toSalaryRange formats disclosed compensation", () => {
  assert.equal(
    toSalaryRange({
      disclosed: true,
      minimum: 1000000,
      maximum: 2000000,
      currency: "VND",
      payPeriod: "MONTH",
    }),
    "1.000.000 - 2.000.000 VND / month",
  );
});

test("signed-in job search sends authentication for company exclusion", async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = {
    getItem: (key) =>
      key === AUTH_SESSION_KEY
        ? JSON.stringify({
            accessToken: "search-access",
            refreshToken: "refresh",
            expiresAt: Date.now() + 60000,
          })
        : null,
  };
  let authorization;
  globalThis.fetch = async (_url, init) => {
    authorization = init.headers.Authorization;
    return Response.json({ status: 200, data: { content: [], totalElements: 0 } });
  };
  try {
    await searchPublicJobs({});
    assert.equal(authorization, "Bearer search-access");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = originalStorage;
  }
});

test("anonymous job search remains public", async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = { getItem: () => null };
  let authorization;
  globalThis.fetch = async (_url, init) => {
    authorization = init.headers.Authorization;
    return Response.json({ status: 200, data: { content: [], totalElements: 0 } });
  };
  try {
    await searchPublicJobs({});
    assert.equal(authorization, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = originalStorage;
  }
});

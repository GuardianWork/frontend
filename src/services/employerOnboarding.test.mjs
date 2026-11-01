import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import { loadEmployerOnboarding } from "./employerOnboarding.ts";

const originalFetch = globalThis.fetch;
const user = {
  id: 1,
  firstName: "An",
  lastName: "Nguyễn",
  username: "an",
  email: "an@example.test",
  role: "USER",
  activeMembership: null,
};
beforeEach(() => {
  const values = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  sessionStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: Date.now() + 60000,
      user,
    }),
  );
  globalThis.localStorage = {
    getItem: () => null,
    setItem() {},
    removeItem() {},
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.sessionStorage;
  delete globalThis.localStorage;
});

test("a shared account without a Company membership is directed to Company setup without a retired request", async () => {
  globalThis.fetch = async () => {
    throw new Error("No Company lookup should run without a membership");
  };
  assert.deepEqual(await loadEmployerOnboarding(), { stage: "COMPANY_ACTION_REQUIRED" });
});

test("Company verification status controls recruiter access for an existing owner", async () => {
  const session = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY));
  session.user.activeMembership = {
    companyId: 12,
    companyName: "Alpha",
    companyRole: "OWNER",
    joinedAt: "2026-10-19T00:00:00Z",
  };
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  for (const [status, stage] of [
    ["PENDING", "PENDING"],
    ["REJECTED", "REJECTED"],
    ["VERIFIED", "VERIFIED"],
  ]) {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "/api/companies/me/verification");
      assert.equal(init.headers.Authorization, "Bearer access");
      return Response.json({
        status: 200,
        data: {
          id: 12,
          name: "Alpha",
          taxCode: "0100000001",
          verificationStatus: status,
          version: 0,
        },
      });
    };
    assert.deepEqual(await loadEmployerOnboarding(), { stage });
  }
});

test("a company lookup failure is retryable and does not unlock recruiter features", async () => {
  const session = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY));
  session.user.activeMembership = {
    companyId: 12,
    companyName: "Alpha",
    companyRole: "OWNER",
    joinedAt: "2026-10-19T00:00:00Z",
  };
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  globalThis.fetch = async (url) => {
    assert.equal(url, "/api/companies/me/verification");
    return Response.json({ status: 503, message: "Company service unavailable" }, { status: 503 });
  };
  await assert.rejects(loadEmployerOnboarding());
});

test("a recruiter checks current membership without requesting owner-only company details", async () => {
  const session = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY));
  session.user.activeMembership = {
    companyId: 12,
    companyName: "Alpha",
    companyRole: "RECRUITER",
    joinedAt: "2026-10-19T00:00:00Z",
  };
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  globalThis.fetch = async (url) => {
    assert.equal(url, "/api/companies/me");
    return Response.json({ status: 200, data: session.user.activeMembership });
  };
  assert.deepEqual(await loadEmployerOnboarding(), { stage: "VERIFIED" });

  globalThis.fetch = async () => Response.json({ status: 200, data: null });
  assert.deepEqual(await loadEmployerOnboarding(), { stage: "COMPANY_ACTION_REQUIRED" });

  globalThis.fetch = async () =>
    Response.json({ status: 404, message: "Company not found" }, { status: 404 });
  await assert.rejects(loadEmployerOnboarding());
});

test("a suspended owner's company remains identifiable without granting recruiting access", async () => {
  const session = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY));
  session.user.activeMembership = {
    companyId: 12,
    companyName: "Alpha",
    companyRole: "OWNER",
    joinedAt: "2026-10-19T00:00:00Z",
  };
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  globalThis.fetch = async () =>
    Response.json({
      status: 200,
      data: {
        id: 12,
        name: "Alpha",
        taxCode: "0100000001",
        verificationStatus: "VERIFIED",
        version: 3,
        companySuspended: true,
      },
    });
  assert.deepEqual(await loadEmployerOnboarding(), { stage: "VERIFIED", companySuspended: true });
});

import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import { listBackendCompanyMembers, removeBackendCompanyMember } from "./backendCompanyMembers.ts";
const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.sessionStorage = {
    getItem: (key) =>
      key === AUTH_SESSION_KEY
        ? JSON.stringify({
            accessToken: "members-access",
            refreshToken: "refresh",
            expiresAt: Date.now() + 60000,
          })
        : null,
  };
  globalThis.localStorage = {
    getItem() {
      throw new Error("Must not read local members");
    },
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.sessionStorage;
  delete globalThis.localStorage;
});
test("member list uses authenticated server pagination without reading localStorage", async () => {
  const data = {
    content: [
      {
        membershipId: 7,
        userId: 9,
        email: "member@example.com",
        companyRole: "RECRUITER",
        status: "ACTIVE",
      },
    ],
    totalElements: 21,
    totalPages: 2,
  };
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/companies/me/members?page=1&size=20");
    assert.equal(init.headers.Authorization, "Bearer members-access");
    assert.equal(init.cache, "no-store");
    return Response.json({ status: 200, data });
  };
  assert.deepEqual(await listBackendCompanyMembers(1), data);
});
test("removal uses membership ID and propagates backend rejection", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/companies/me/members/7");
    assert.equal(init.method, "DELETE");
    return Response.json({ status: 403, message: "Owner required", data: null }, { status: 403 });
  };
  await assert.rejects(removeBackendCompanyMember(7), /Owner required/);
});
test("malformed list responses are rejected", async () => {
  globalThis.fetch = async () =>
    Response.json({ status: 200, data: { content: [{}], totalElements: 1, totalPages: 1 } });
  await assert.rejects(listBackendCompanyMembers(), /không hợp lệ/);
});

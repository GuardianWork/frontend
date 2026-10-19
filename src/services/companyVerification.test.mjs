import assert from "node:assert/strict";
import { beforeEach, afterEach, test } from "node:test";
import {
  getStoredVerificationRecord,
  submitVerification,
  loadCompanyVerification,
  resubmitVerification,
} from "./companyVerification.ts";
import { AUTH_SESSION_KEY } from "./auth.ts";
const originalFetch = globalThis.fetch;
const request = {
  name: " Alpha ",
  taxCode: "0100000001",
  email: " HR@Example.test ",
  registrationCertificateUrl: "https://example.test/license.pdf",
};
const user = {
  id: 1,
  firstName: "An",
  lastName: "Nguyễn",
  username: "an",
  email: "an@example.test",
  role: "USER",
  activeMembership: null,
};
function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
beforeEach(() => {
  globalThis.window = { dispatchEvent() {} };
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  sessionStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: Date.now() + 60000,
      user,
    }),
  );
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  delete globalThis.localStorage;
  delete globalThis.sessionStorage;
});

test("company creation sends exactly the supported fields with Bearer auth and uses server identity", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/companies/verification-request");
    assert.equal(init.headers.Authorization, "Bearer access");
    assert.deepEqual(JSON.parse(init.body), {
      name: "Alpha",
      taxCode: request.taxCode,
      email: "hr@example.test",
      registrationCertificateUrl: request.registrationCertificateUrl,
    });
    return Response.json(
      {
        status: 200,
        data: { ...JSON.parse(init.body), id: 987, verificationStatus: "PENDING", version: 3 },
      },
      { status: 201 },
    );
  };
  const record = await submitVerification({ ...request, phone: "not sent" });
  assert.equal(record.id, 987);
  assert.equal(record.version, 3);
  assert.equal(getStoredVerificationRecord().id, 987);
});
test("network, duplicate and malformed responses never create a local PENDING company", async () => {
  for (const response of [
    () => {
      throw new TypeError("Offline");
    },
    () => Response.json({ status: 409, message: "Duplicate company", data: null }, { status: 409 }),
    () => Response.json({ status: 200, data: { id: 10 } }),
  ]) {
    globalThis.fetch = response;
    await assert.rejects(submitVerification(request));
    assert.equal(getStoredVerificationRecord().verificationStatus, "REGISTERED");
  }
});
test("company drafts are scoped to the signed-in user", async () => {
  globalThis.fetch = async () =>
    Response.json({
      status: 200,
      data: { ...request, id: 5, verificationStatus: "PENDING", version: 0 },
    });
  await submitVerification(request);
  const session = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY));
  session.user = { ...user, id: 2 };
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  assert.equal(getStoredVerificationRecord().verificationStatus, "REGISTERED");
});
test("owner verification reloads server state and resubmission uses companyId and expectedVersion", async () => {
  const session = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY));
  session.user.activeMembership = {
    companyId: 12,
    companyName: "Alpha",
    companyRole: "OWNER",
    joinedAt: "2026-10-19T00:00:00Z",
  };
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  globalThis.fetch = async (url, init) => {
    if (init.method === "PUT") {
      assert.equal(url, "/api/companies/12/resubmit");
      assert.equal(JSON.parse(init.body).expectedVersion, 4);
      return Response.json({
        status: 200,
        data: { ...request, companyId: 12, verificationStatus: "PENDING", version: 5 },
      });
    }
    assert.equal(url, "/api/companies/me/verification");
    return Response.json({
      status: 200,
      data: {
        ...request,
        companyId: 12,
        verificationStatus: "REJECTED",
        version: 4,
        rejectionReason: "Missing page",
      },
    });
  };
  const rejected = await loadCompanyVerification();
  assert.equal(rejected.id, 12);
  assert.equal(rejected.verificationStatus, "REJECTED");
  const result = await resubmitVerification(rejected.id, {
    ...request,
    expectedVersion: rejected.version,
  });
  assert.equal(result.version, 5);
  assert.equal(result.verificationStatus, "PENDING");
});
test("missing sessions and browser-only documents never send company creation requests", async () => {
  globalThis.fetch = async () => {
    throw new Error("must not fetch");
  };
  await assert.rejects(
    submitVerification({
      ...request,
      registrationCertificateUrl: "data:application/pdf;base64,aaa",
    }),
    /URL/,
  );
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  await assert.rejects(submitVerification(request), /đăng nhập/);
});

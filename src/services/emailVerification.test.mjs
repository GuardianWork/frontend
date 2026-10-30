import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import { requestEmailVerification, confirmEmailVerification } from "./emailVerification.ts";
const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.sessionStorage = {
    getItem: (key) =>
      key === AUTH_SESSION_KEY
        ? JSON.stringify({
            accessToken: "access",
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
test("request uses the current account without sending a destination address", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/me/email-verification/request");
    assert.equal(init.method, "POST");
    assert.equal(init.body, undefined);
    assert.equal(init.headers.Authorization, "Bearer access");
    return Response.json({
      status: 200,
      data: {
        deliveryAccepted: true,
        alreadyVerified: false,
        nextRequestAt: "2026-10-30T03:01:00Z",
        expiresAt: "2026-10-30T03:10:00Z",
      },
    });
  };
  assert.equal((await requestEmailVerification()).deliveryAccepted, true);
});
test("confirmation preserves a code's leading zero and sends it only in the authenticated POST body", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/me/email-verification/confirm");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization, "Bearer access");
    assert.deepEqual(JSON.parse(init.body), { emailSecret: "012345" });
    return Response.json({ status: 200, data: { emailVerified: true } });
  };
  await confirmEmailVerification("012345");
});
test("invalid code errors and resend cooldown remain actionable without automatic retries", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ status: 400, message: "40030 INVALID_EMAIL_PROOF" }, { status: 400 });
  };
  await assert.rejects(confirmEmailVerification("012345"), (error) => error.status === 400);
  assert.equal(calls, 1);
  globalThis.fetch = async () =>
    Response.json(
      { status: 429, message: "42930 EMAIL_REQUEST_COOLDOWN" },
      { status: 429, headers: { "Retry-After": "17" } },
    );
  await assert.rejects(
    requestEmailVerification(),
    (error) => error.status === 429 && error.retryAfterSeconds === 17,
  );
});

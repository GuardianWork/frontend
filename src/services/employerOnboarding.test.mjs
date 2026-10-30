import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import {
  registerEmployer,
  loadEmployerOnboarding,
  sendEmployerEmail,
  verifyEmployerEmail,
  employerError,
} from "./employerOnboarding.ts";
import { ApiError } from "./api.ts";
const originalFetch = globalThis.fetch;
const input = {
  fullName: " An Nguyễn ",
  phone: "0901234567",
  companyName: " Alpha ",
  gender: "OTHER",
  workAddress: " Hà Nội ",
  email: " An@Example.test ",
  password: "Guardian123!",
  passwordConfirmation: "Guardian123!",
};
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
test("registration sends exactly eight fields and treats failed delivery as account creation", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/employer-registrations");
    assert.equal(init.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(init.body), {
      ...input,
      fullName: "An Nguyễn",
      companyName: "Alpha",
      workAddress: "Hà Nội",
      email: "an@example.test",
    });
    return Response.json(
      {
        status: 201,
        data: {
          userId: 123,
          emailVerified: false,
          stage: "EMAIL_REQUIRED",
          deliveryAccepted: false,
        },
      },
      { status: 201 },
    );
  };
  assert.equal((await registerEmployer(input)).deliveryAccepted, false);
});
test("onboarding rejects removed and unknown stages rather than opening recruitment", async () => {
  for (const stage of [
    "EMAIL_REQUIRED",
    "COMPANY_ACTION_REQUIRED",
    "PENDING",
    "REJECTED",
    "VERIFIED",
    "PHONE_REQUIRED",
    "LEGAL_REQUIRED",
    "unknown",
  ]) {
    globalThis.fetch = async (_url, init) => {
      assert.equal(init.headers.Authorization, "Bearer access");
      return Response.json({ status: 200, data: { stage } });
    };
    if (["PHONE_REQUIRED", "LEGAL_REQUIRED", "unknown"].includes(stage))
      await assert.rejects(loadEmployerOnboarding());
    else assert.equal((await loadEmployerOnboarding()).stage, stage);
  }
});
test("resend uses Bearer with no body and verify sends only the fragment secret", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(init.headers.Authorization, "Bearer access");
    assert.equal(init.method, "POST");
    if (url.endsWith("/send")) {
      assert.equal(init.body, undefined);
      return Response.json({ status: 200, data: { deliveryAccepted: false } });
    }
    assert.equal(url, "/api/me/employer-onboarding/email/verify");
    assert.equal(init.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(init.body), { emailSecret: "private-test-secret" });
    return Response.json({ status: 200, data: null });
  };
  assert.equal((await sendEmployerEmail()).deliveryAccepted, false);
  await verifyEmployerEmail("private-test-secret");
});
test("actionable errors never expose the backend response or secret", () => {
  for (const status of [400, 403, 409, 429, 500]) {
    const message = employerError(new ApiError("private-test-secret", status));
    assert.ok(message.length > 20);
    assert.ok(!message.includes("private-test-secret"));
  }
});

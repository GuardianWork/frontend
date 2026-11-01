import assert from "node:assert/strict";
import { test, beforeEach, afterEach } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import {
  loadAccount,
  updateAccount,
  requestClosureCode,
  confirmClosure,
  requestRecoveryCode,
  confirmRecovery,
  changePassword,
  accountError,
  validNewPassword,
} from "./accountControl.ts";
import { ApiError } from "./api.ts";
const originalFetch = globalThis.fetch;
let stored;
beforeEach(() => {
  stored = JSON.stringify({
    accessToken: "access",
    refreshToken: "refresh",
    expiresAt: Date.now() + 60000,
    user: { id: 1, role: "USER" },
  });
  globalThis.sessionStorage = {
    getItem: (key) => (key === AUTH_SESSION_KEY ? stored : null),
    removeItem: () => {
      stored = null;
    },
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.sessionStorage;
});
const projection = {
  firstName: "Minh",
  lastName: "Nguyễn",
  fullName: "Minh Nguyễn",
  username: "minh_nguyen",
  email: "minh@example.vn",
  emailVerified: false,
  selfServiceState: "ACTIVE",
  closureEligible: false,
  closureBlockers: ["EMAIL_VERIFICATION_REQUIRED"],
};
test("unverified identity edits send only trimmed names and explicit null; success message is descriptive", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/me/account");
    assert.equal(init.headers.Authorization, "Bearer access");
    assert.deepEqual(JSON.parse(init.body), {
      firstName: "Minh",
      lastName: "Nguyễn",
      phoneNumber: null,
    });
    return Response.json({ status: 200, message: "Account updated", data: projection });
  };
  assert.deepEqual(
    await updateAccount({
      ...projection,
      firstName: " Minh ",
      lastName: " Nguyễn ",
      phoneNumber: null,
    }),
    { ...projection, phoneNumber: null },
  );
});
test("missing optional phone is accepted on load", async () => {
  globalThis.fetch = async () =>
    Response.json({ status: 200, message: "Current account", data: projection });
  assert.equal((await loadAccount()).phoneNumber, null);
});
for (const [action, state] of [
  ["deactivation", "DEACTIVATED"],
  ["deletion", "DELETION_PENDING"],
]) {
  test(`${action} is action bound, preserves leading zeroes and clears tokens only on confirmed transition`, async () => {
    globalThis.fetch = async (url, init) => {
      assert.equal(init.headers.Authorization, "Bearer access");
      if (url.endsWith("request-code")) {
        assert.equal(url, `/api/me/account/${action}/request-code`);
        assert.deepEqual(JSON.parse(init.body), { currentPassword: "Current123" });
        return Response.json({ status: 200, data: { deliveryAccepted: false } });
      }
      assert.equal(url, `/api/me/account/${action}/confirm`);
      assert.deepEqual(JSON.parse(init.body), {
        currentPassword: "Current123",
        emailSecret: "012345",
        acknowledgeConsequences: true,
      });
      return Response.json({ status: 200, data: { selfServiceState: state } });
    };
    assert.equal((await requestClosureCode(action, "Current123")).deliveryAccepted, false);
    assert(stored);
    await confirmClosure(action, "Current123", "012345", true);
    assert.equal(stored, null);
  });
}
for (const action of ["REACTIVATE", "CANCEL_DELETION"]) {
  test(`${action} recovery never sends a stale Bearer or creates an authenticated session`, async () => {
    const previous = stored;
    globalThis.fetch = async (url, init) => {
      assert.equal(init.headers.Authorization, undefined);
      assert.equal(init.headers.authorization, undefined);
      const body = JSON.parse(init.body);
      assert.equal(body.action, action);
      assert.equal(body.usernameOrEmail, "minh@example.vn");
      if (url.endsWith("request-code"))
        return Response.json({ status: 200, data: { deliveryAccepted: true } });
      assert.equal(body.emailSecret, "012345");
      assert.equal(body.acknowledgeConsequences, true);
      return Response.json({ status: 200, data: { selfServiceState: "ACTIVE" } });
    };
    const input = { usernameOrEmail: " minh@example.vn ", password: "Current123", action };
    await requestRecoveryCode(input);
    await confirmRecovery(input, "012345", true);
    assert.equal(stored, previous);
  });
}
test("a protected 401 clears credentials and is never replayed or refreshed", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ status: 401, message: "40101" }, { status: 401 });
  };
  await assert.rejects(loadAccount(), (e) => e.status === 401);
  assert.equal(calls, 1);
  assert.equal(stored, null);
});
test("wrong code and delivery errors do not clear the active session or claim success", async () => {
  globalThis.fetch = async () =>
    Response.json({ status: 400, message: "40094 INVALID_PROOF" }, { status: 400 });
  await assert.rejects(confirmClosure("deletion", "Current123", "012345", true));
  assert(stored);
  globalThis.fetch = async () =>
    Response.json({ status: 200, data: { selfServiceState: "ACTIVE" } });
  await assert.rejects(confirmClosure("deletion", "Current123", "012345", true));
  assert(stored);
});
test("password change uses the existing policy and invalidates local tokens on success", async () => {
  assert(validNewPassword("Password123"));
  assert(!validNewPassword("password123"));
  assert(!validNewPassword("A1a"));
  assert(!validNewPassword("Aa1".repeat(44)));
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/auth/change-password");
    assert.equal(init.method, "PUT");
    assert.deepEqual(JSON.parse(init.body), {
      currentPassword: "Current123",
      newPassword: "NewPassword123",
    });
    return Response.json({ status: 200, data: null });
  };
  await changePassword("Current123", "NewPassword123");
  assert.equal(stored, null);
});
test("Vietnamese errors map lifecycle, phone, enforcement, invalid credentials and cooldown codes", () => {
  for (const [status, message] of [
    [400, "40094 BAD_CODE"],
    [409, "40994 OWNERSHIP"],
    [409, "40910 MEMBERSHIP"],
    [409, "40995 STATE"],
    [403, "40304 BANNED"],
    [403, "40335 VERIFY"],
    [409, "40930 PHONE"],
    [429, "42994 COOLDOWN"],
  ]) {
    const copy = accountError(new ApiError(message, status), "recovery");
    assert(!copy.includes(message));
    assert(copy.length > 20);
  }
  assert.match(accountError(new ApiError("40101", 401), "recovery"), /không chính xác/);
});
test("Retry-After accepts HTTP dates without retrying", async () => {
  globalThis.fetch = async () =>
    Response.json(
      { status: 429, message: "42994 COOLDOWN" },
      { status: 429, headers: { "Retry-After": new Date(Date.now() + 30000).toUTCString() } },
    );
  await assert.rejects(
    requestRecoveryCode({ usernameOrEmail: "minh", password: "Current123", action: "REACTIVATE" }),
    (e) => e.retryAfterSeconds >= 28 && e.retryAfterSeconds <= 30,
  );
});

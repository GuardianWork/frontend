import assert from "node:assert/strict";
import { beforeEach, afterEach, test } from "node:test";
import { issueCompanyInvitation, resendCompanyInvitation } from "./companyInvitations.ts";
import { AUTH_SESSION_KEY } from "./auth.ts";
const originalFetch = globalThis.fetch;
const result = {
  id: 17,
  email: "invitee@example.test",
  companyId: 101,
  companyName: "Alpha",
  companyRole: "RECRUITER",
  status: "PENDING",
  issuedAt: "2026-10-21T00:00:00Z",
  expiresAt: "2026-10-28T00:00:00Z",
  deliveryStatus: "PROVIDER_ACCEPTED",
};
beforeEach(() => {
  globalThis.sessionStorage = {
    getItem: (key) =>
      key === AUTH_SESSION_KEY
        ? JSON.stringify({
            accessToken: "owner-access",
            refreshToken: "owner-refresh",
            expiresAt: Date.now() + 60000,
          })
        : null,
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.sessionStorage;
});
test("create invitation calls the Owner API with Bearer auth and only the normalized email", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/companies/me/invitations");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization, "Bearer owner-access");
    assert.deepEqual(JSON.parse(init.body), { email: "invitee@example.test" });
    return Response.json({ status: 201, data: result }, { status: 201 });
  };
  assert.deepEqual(await issueCompanyInvitation(" Invitee@Example.test "), result);
});
test("failed and unknown delivery retain the persisted invitation for recovery", async () => {
  for (const deliveryStatus of ["FAILED", "UNKNOWN"]) {
    globalThis.fetch = async () =>
      Response.json({ status: 201, data: { ...result, deliveryStatus } });
    const invitation = await issueCompanyInvitation(result.email);
    assert.equal(invitation.id, result.id);
    assert.equal(invitation.deliveryStatus, deliveryStatus);
  }
});
test("resend uses the persisted ID and never creates a second invitation", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/companies/me/invitations/17/resend");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization, "Bearer owner-access");
    assert.equal(init.body, undefined);
    return Response.json({ status: 200, data: result });
  };
  assert.equal((await resendCompanyInvitation(17)).id, 17);
});
test("duplicate, network and malformed responses never report invitation success", async () => {
  globalThis.fetch = async () =>
    Response.json({ status: 409, message: "PENDING_INVITATION_EXISTS" }, { status: 409 });
  await assert.rejects(issueCompanyInvitation(result.email), (error) => error.status === 409);
  globalThis.fetch = async () => {
    throw new Error("Offline");
  };
  await assert.rejects(issueCompanyInvitation(result.email));
  globalThis.fetch = async () => Response.json({ status: 201, data: { id: 17 } });
  await assert.rejects(issueCompanyInvitation(result.email), /không hợp lệ/);
});

test("recipient decisions post the fragment secret to API endpoints, never the email landing URL", async () => {
  const { previewCompanyInvitation, acceptCompanyInvitation, declineCompanyInvitation } =
    await import("./companyInvitations.ts");
  for (const [operation, action, payload] of [
    [previewCompanyInvitation, "preview", { secret: "private-invitation" }],
    [acceptCompanyInvitation, "accept", { secret: "private-invitation", confirm: true }],
    [declineCompanyInvitation, "decline", { secret: "private-invitation" }],
  ]) {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, `/api/company-invitations/${action}`);
      assert.equal(init.method, "POST");
      assert.equal(init.cache, "no-store");
      assert.equal(init.headers.Authorization, "Bearer owner-access");
      assert.deepEqual(JSON.parse(init.body), payload);
      return Response.json({
        status: 200,
        data: {
          invitationId: 17,
          companyId: 101,
          companyName: "Company",
          companyRole: "RECRUITER",
          expiresAt: "2027-01-01T00:00:00Z",
        },
      });
    };
    await operation("private-invitation");
  }
});

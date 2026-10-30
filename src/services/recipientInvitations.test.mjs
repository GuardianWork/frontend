import assert from "node:assert/strict";
import { test } from "node:test";
import { previewInvitation, acceptInvitation } from "./recipientInvitations.ts";
import { AUTH_SESSION_KEY } from "./auth.ts";
test("recipient preview and acceptance use the authenticated secret with explicit confirmation", async () => {
  const originalFetch = globalThis.fetch;
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
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(init.headers.Authorization, "Bearer access");
      assert.equal(init.method, "POST");
      const accepting = url.endsWith("/accept");
      assert.deepEqual(
        JSON.parse(init.body),
        accepting ? { secret: "private-invite", confirm: true } : { secret: "private-invite" },
      );
      return Response.json({
        status: accepting ? 201 : 200,
        data: accepting
          ? { membershipId: 12, companyRole: "RECRUITER", membershipStatus: "ACTIVE" }
          : {
              invitationId: 1,
              companyId: 101,
              companyName: "Alpha",
              companyRole: "RECRUITER",
              expiresAt: "2026-12-01T00:00:00Z",
            },
      });
    };
    assert.equal((await previewInvitation("private-invite")).companyName, "Alpha");
    await acceptInvitation("private-invite");
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.sessionStorage;
  }
});

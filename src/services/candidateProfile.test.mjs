import assert from "node:assert/strict";
import { test } from "node:test";
import { updateCandidatePhone } from "./candidateProfile.ts";
import { AUTH_SESSION_KEY } from "./auth.ts";
test("candidate contact updates preserve profile fields and clearing sends null", async () => {
  const originalFetch = globalThis.fetch;
  const profile = {
    id: "profile",
    userId: 1,
    fullName: "Nguyễn An",
    phoneNumber: "+84901234567",
    avatarUrl: null,
    skills: ["Sales"],
    experienceSummary: "Kinh nghiệm",
    educationSummary: "Đại học",
    isPublic: false,
  };
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
    for (const phone of ["0909876543", ""]) {
      globalThis.fetch = async (url, init) => {
        assert.equal(url, "/api/v1/candidates/profile");
        assert.equal(init.method, "PUT");
        assert.equal(init.headers.Authorization, "Bearer access");
        const { id, userId, ...fields } = profile;
        assert.deepEqual(JSON.parse(init.body), { ...fields, phoneNumber: phone || null });
        return Response.json({
          status: 200,
          data: { ...profile, phoneNumber: phone ? "+84909876543" : null },
        });
      };
      assert.equal(
        (await updateCandidatePhone(profile, phone)).phoneNumber,
        phone ? "+84909876543" : null,
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.sessionStorage;
  }
});

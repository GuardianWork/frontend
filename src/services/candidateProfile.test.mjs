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
    email: "an@example.test",
    phoneNumber: "+84901234567",
    avatarUrl: null,
    skills: ["Sales"],
    experience: [],
    education: [],
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
        assert.equal(url, "/api/candidates/profile");
        assert.equal(init.method, "PUT");
        assert.equal(init.headers.Authorization, "Bearer access");
        const sent = JSON.parse(init.body);
        assert.equal(sent.fullName, profile.fullName);
        assert.equal(sent.phoneNumber, phone ? "+84909876543" : null);
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

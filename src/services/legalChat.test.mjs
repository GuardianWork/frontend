import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import { askLegalQuestion } from "./legalChat.ts";
const originalFetch = globalThis.fetch;
const report = {
  schemaVersion: "1",
  mode: "crawler",
  profile: "jd-local-v1",
  legalSnapshot: "labor-test",
  asOfDate: "2026-11-14",
  model: "test-provider",
  status: "ANSWERED",
  answer: "Grounded answer",
  warnings: ["Verify applicability"],
  citations: [
    {
      nodeId: "doc:139264:art:25",
      label: "Điều 25",
      documentNumber: "45/2019/QH14",
      quote: "Source quote",
      quoteGrounded: true,
      effectiveStatus: "",
      applicability: "UNVERIFIED",
    },
  ],
};
beforeEach(() => {
  globalThis.localStorage = {
    getItem: (key) =>
      key === AUTH_SESSION_KEY
        ? JSON.stringify({
            accessToken: "chat-access",
            refreshToken: "refresh",
            expiresAt: Date.now() + 60000,
          })
        : null,
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.localStorage;
});
test("legal chat uses authenticated backend and only sends the independent question", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/candidates/me/legal-chat");
    assert.equal(init.headers.Authorization, "Bearer chat-access");
    assert.deepEqual(JSON.parse(init.body), { question: "Thử việc?" });
    return Response.json({ status: 200, data: report });
  };
  assert.deepEqual(await askLegalQuestion("Thử việc?"), report);
});
test("stub, malformed citations and empty model answers never become successful AI answers", async () => {
  for (const data of [
    { ...report, mode: "stub" },
    { ...report, answer: "" },
    { ...report, citations: [] },
    { ...report, citations: [{ ...report.citations[0], quoteGrounded: false }] },
  ]) {
    globalThis.fetch = async () => Response.json({ status: 200, data });
    await assert.rejects(askLegalQuestion("Thử việc?"), /không hợp lệ/);
  }
});
test("provider outage is exposed instead of replaced with sample text", async () => {
  globalThis.fetch = async () =>
    Response.json({ status: 503, message: "LEGAL_CHAT_UNAVAILABLE", data: null }, { status: 503 });
  await assert.rejects(askLegalQuestion("Thử việc?"), (error) => error.status === 503);
});

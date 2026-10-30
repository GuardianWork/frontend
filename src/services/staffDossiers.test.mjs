import assert from "node:assert/strict";
import { beforeEach, afterEach, test } from "node:test";
import { saveAuthSession, AUTH_SESSION_KEY, authenticatedFetch, loadCurrentUser } from "./auth.ts";
import { decideAdminVerification, getAdminVerifications } from "./adminCompanies.ts";
import { certificateTarget, fetchEvidence, getVerificationHistory } from "./staffDossiers.ts";
const originalFetch = globalThis.fetch;
const user = { id: 42, email: "staff@example.test", role: "STAFF" };
const pair = {
  accessToken: "access",
  refreshToken: "refresh",
  tokenType: "Bearer",
  expiresIn: 900,
  user,
};
const company = {
  id: 101,
  name: "Alpha",
  taxCode: "1234567890",
  version: 4,
  verificationStatus: "PENDING",
};
beforeEach(() => {
  const values = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  saveAuthSession(pair);
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.sessionStorage;
});

test("queue and history use Staff endpoints and accept empty legacy history", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(init.headers.Authorization, "Bearer access");
    if (url.endsWith("verification-history")) return Response.json({ data: [] });
    assert.equal(url, "/api/staff/companies/verifications?status=PENDING&page=2&size=20");
    return Response.json({
      data: { content: [company], pageNumber: 2, pageSize: 20, totalElements: 41, totalPages: 3 },
    });
  };
  assert.equal((await getAdminVerifications("PENDING", 2)).content[0].version, 4);
  assert.deepEqual(await getVerificationHistory(101), []);
});
test("both decisions use verify and send the current version; rejection is trimmed and validated", async () => {
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    assert.equal(url, "/api/staff/companies/101/verify");
    const body = JSON.parse(init.body);
    assert.equal(body.expectedVersion, 4);
    if (body.status === "REJECTED")
      assert.equal(body.rejectionReason, "Thông tin không trùng khớp.");
    return Response.json({ data: { ...company, verificationStatus: body.status, version: 5 } });
  };
  await assert.rejects(decideAdminVerification(company, "REJECTED", " short "));
  await assert.rejects(decideAdminVerification(company, "REJECTED", "x".repeat(1001)));
  assert.equal(calls, 0);
  await decideAdminVerification(company, "VERIFIED");
  await decideAdminVerification(company, "REJECTED", "  Thông tin không trùng khớp.  ");
  assert.equal(calls, 2);
});
test("conflicts, already reviewed companies, and lost mutation responses require reload", async () => {
  for (const [status, message] of [
    [409, "40022 CONCURRENT_MODIFICATION"],
    [400, "40010 COMPANY_NOT_PENDING"],
    [503, "unavailable"],
  ]) {
    globalThis.fetch = async () => Response.json({ message, data: null }, { status });
    await assert.rejects(decideAdminVerification(company, "VERIFIED"), (error) => error.conflict);
  }
  globalThis.fetch = async () => {
    throw new TypeError("lost response");
  };
  await assert.rejects(decideAdminVerification(company, "VERIFIED"), (error) => error.conflict);
});
test("simultaneous JSON and binary 401 responses share one refresh and rotate both tokens", async () => {
  let refreshes = 0;
  globalThis.fetch = async (url, init) => {
    if (url.endsWith("/refresh")) {
      refreshes++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return Response.json({
        data: { ...pair, accessToken: "rotated", refreshToken: "rotated-refresh" },
      });
    }
    if (init.headers.Authorization === "Bearer access")
      return Response.json({ data: null }, { status: 401 });
    if (url.includes("company-verification-documents"))
      return new Response("pdf bytes", {
        headers: { "Content-Disposition": "attachment; filename*=UTF-8''giay%20phep.pdf" },
      });
    return Response.json({ data: [] });
  };
  const [history, file] = await Promise.all([getVerificationHistory(101), fetchEvidence("doc-id")]);
  assert.deepEqual(history, []);
  assert.equal(await file.blob.text(), "pdf bytes");
  assert.equal(file.filename, "giay phep.pdf");
  assert.equal(refreshes, 1);
  const stored = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY));
  assert.equal(stored.accessToken, "rotated");
  assert.equal(stored.refreshToken, "rotated-refresh");
});
test("403 never refreshes; failed refresh clears session; retry 401 is final", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ data: null }, { status: 403 });
  };
  await assert.rejects(getVerificationHistory(101), (error) => error.status === 403);
  assert.equal(calls, 1);
  globalThis.fetch = async (url) => {
    if (url.endsWith("/refresh")) throw new TypeError("offline");
    return new Response(null, { status: 401 });
  };
  await assert.rejects(authenticatedFetch("/protected"), (error) => error.status === 401);
  assert.equal(sessionStorage.getItem(AUTH_SESSION_KEY), null);
  saveAuthSession(pair);
  calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    return url.endsWith("/refresh")
      ? Response.json({ data: { ...pair, accessToken: "new" } })
      : new Response(null, { status: 401 });
  };
  assert.equal((await authenticatedFetch("/protected")).status, 401);
  assert.equal(calls, 3);
  assert.equal(sessionStorage.getItem(AUTH_SESSION_KEY), null);
});
test("Staff me does not require company membership; company ADMIN does not grant Staff access", async () => {
  globalThis.fetch = async () => Response.json({ data: user });
  assert.equal((await loadCurrentUser()).role, "STAFF");
  saveAuthSession({
    ...pair,
    user: { ...user, role: "USER", activeMembership: { companyRole: "ADMIN" } },
  });
  globalThis.fetch = async () => {
    throw new Error("must not call");
  };
  await assert.rejects(getAdminVerifications("PENDING", 0), (error) => error.status === 403);
});
test("internal evidence is authenticated; external and unsafe URLs cannot receive API credentials", async () => {
  assert.deepEqual(certificateTarget("/api/company-verification-documents/abc"), {
    documentId: "abc",
  });
  assert.deepEqual(
    certificateTarget("https://external.test/api/company-verification-documents/abc"),
    { href: "https://external.test/api/company-verification-documents/abc" },
  );
  assert.deepEqual(certificateTarget("javascript:alert(1)"), {});
  await assert.rejects(authenticatedFetch("https://external.test/document"));
  globalThis.fetch = async () =>
    Response.json({ message: "40430 DOCUMENT_UNAVAILABLE" }, { status: 404 });
  await assert.rejects(fetchEvidence("missing"), /không còn khả dụng/);
});

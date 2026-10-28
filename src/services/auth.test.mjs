import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { registerAccount, loginAccount, getLoginDestination } from "./auth.ts";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const user = {
  id: 1,
  firstName: "An",
  lastName: "Nguyễn",
  username: "nguyen_an",
  email: "an@example.com",
  role: "USER",
};
const registration = {
  firstName: " An ",
  lastName: " Nguyễn ",
  username: " nguyen_an ",
  email: " AN@example.com ",
  password: "Password123",
};

test("registration matches the backend schema without assigning a privileged role", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/auth/register");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), {
      ...registration,
      firstName: "An",
      lastName: "Nguyễn",
      username: "nguyen_an",
      email: "an@example.com",
    });
    return Response.json({ status: 200, data: user }, { status: 201 });
  };
  assert.deepEqual(await registerAccount(registration), user);
});

test("login uses usernameOrEmail and retains the server-issued token pair", async () => {
  const session = {
    accessToken: "access",
    refreshToken: "refresh",
    tokenType: "Bearer",
    expiresIn: 3600,
    user,
  };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/auth/login");
    assert.deepEqual(JSON.parse(options.body), {
      usernameOrEmail: "an@example.com",
      password: "Password123",
    });
    return Response.json({ status: 200, data: session });
  };
  assert.deepEqual(await loginAccount(" an@example.com ", "Password123"), session);
});

test("invalid credentials and duplicate accounts return useful errors", async () => {
  globalThis.fetch = async () => Response.json({ message: "Invalid credentials" }, { status: 401 });
  await assert.rejects(loginAccount("an@example.com", "bad"), /không chính xác/);
  globalThis.fetch = async () => Response.json({}, { status: 409 });
  await assert.rejects(registerAccount(registration), /đã được sử dụng/);
});

test("an unavailable API or invalid success response never signs a user in", async () => {
  globalThis.fetch = async () => new Response("<html>Not found</html>", { status: 200 });
  await assert.rejects(loginAccount("an@example.com", "Password123"), /không hợp lệ/);
  globalThis.fetch = async () => {
    throw new TypeError("Network failed");
  };
  await assert.rejects(registerAccount(registration), /Không thể kết nối/);
});

test("portal selection is an onboarding intent; admin destination requires the server role", () => {
  assert.equal(getLoginDestination(user, "candidate"), "/jobs");
  assert.equal(getLoginDestination(user, "recruiter"), "/recruiter/verification");
  assert.equal(getLoginDestination({ ...user, role: "ADMIN" }, "candidate"), "/admin");
  assert.equal(getLoginDestination({ ...user, role: "STAFF" }, "candidate"), "/staff");
});

test("logout clears local tokens and revokes the server refresh token", async () => {
  const { logoutAccount, AUTH_SESSION_KEY } = await import("./auth.ts");
  const values = new Map([
    [AUTH_SESSION_KEY, JSON.stringify({ accessToken: "access", refreshToken: "refresh" })],
  ]);
  globalThis.sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
  };
  globalThis.fetch = async (url, options) => {
    assert.equal(values.has(AUTH_SESSION_KEY), false);
    assert.equal(url, "/api/auth/logout");
    assert.deepEqual(JSON.parse(options.body), { refreshToken: "refresh" });
    assert.equal(options.headers.Authorization, undefined);
    return Response.json({ data: null });
  };
  try {
    await logoutAccount();
    assert.equal(values.size, 0);
  } finally {
    delete globalThis.sessionStorage;
  }
});

test("logout still clears the session when the API is offline", async () => {
  const { logoutAccount, AUTH_SESSION_KEY } = await import("./auth.ts");
  const values = new Map([[AUTH_SESSION_KEY, JSON.stringify({ refreshToken: "refresh" })]]);
  globalThis.sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
  };
  globalThis.fetch = async () => {
    throw new TypeError("Offline");
  };
  try {
    await logoutAccount();
    assert.equal(values.size, 0);
  } finally {
    delete globalThis.sessionStorage;
  }
});

function browserSession(session) {
  const values = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  if (session) values.set("guardianwork_auth_session", JSON.stringify(session));
  return values;
}
const tokenPair = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  tokenType: "Bearer",
  user,
};

test("/me loads authoritative identity and OWNER membership without changing account role", async () => {
  const { saveAuthSession, loadCurrentUser, getCurrentUser } = await import("./auth.ts");
  browserSession();
  saveAuthSession(tokenPair);
  const activeMembership = {
    companyId: 101,
    companyName: "Alpha",
    companyRole: "OWNER",
    joinedAt: "2026-10-19T00:00:00Z",
  };
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/auth/me");
    assert.equal(init.headers.Authorization, "Bearer access");
    return Response.json({ status: 200, data: { ...user, activeMembership } });
  };
  const me = await loadCurrentUser();
  assert.equal(me.role, "USER");
  assert.deepEqual(getCurrentUser().activeMembership, activeMembership);
  assert.equal(getLoginDestination(me, "recruiter"), "/recruiter");
  delete globalThis.sessionStorage;
});

test("expired access tokens refresh once for concurrent requests and persist the rotated pair", async () => {
  const { authenticatedRequest, AUTH_SESSION_KEY } = await import("./auth.ts");
  const values = browserSession({ ...tokenPair, expiresAt: 0 });
  let rotations = 0;
  globalThis.fetch = async (url, init) => {
    if (url === "/api/auth/refresh") {
      rotations++;
      assert.deepEqual(JSON.parse(init.body), { refreshToken: "refresh" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      return Response.json({
        status: 200,
        data: { ...tokenPair, accessToken: "new-access", refreshToken: "new-refresh" },
      });
    }
    assert.equal(init.headers.Authorization, "Bearer new-access");
    return Response.json({ status: 200, data: { ok: true } });
  };
  await Promise.all([authenticatedRequest("/one"), authenticatedRequest("/two")]);
  assert.equal(rotations, 1);
  assert.equal(JSON.parse(values.get(AUTH_SESSION_KEY)).refreshToken, "new-refresh");
  delete globalThis.sessionStorage;
});

test("a server 401 refreshes and retries once; revoked refresh tokens clear both tokens", async () => {
  const { authenticatedRequest, AUTH_SESSION_KEY } = await import("./auth.ts");
  const values = browserSession({ ...tokenPair, expiresAt: Date.now() + 60000 });
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    if (url === "/api/auth/refresh")
      return Response.json({ status: 200, data: { ...tokenPair, accessToken: "new" } });
    calls++;
    return init.headers.Authorization === "Bearer access"
      ? Response.json({ status: 401, data: null }, { status: 401 })
      : Response.json({ status: 200, data: "ok" });
  };
  assert.equal(await authenticatedRequest("/protected"), "ok");
  assert.equal(calls, 2);
  browserSession({ ...tokenPair, expiresAt: 0 });
  globalThis.fetch = async () =>
    Response.json({ status: 401, message: "Revoked", data: null }, { status: 401 });
  await assert.rejects(authenticatedRequest("/protected"), /Revoked/);
  assert.equal(sessionStorage.getItem(AUTH_SESSION_KEY), null);
  assert.ok(values.size);
  delete globalThis.sessionStorage;
});

test("logging out during token refresh never restores the signed-out session", async () => {
  const { refreshAuthSession, logoutAccount, AUTH_SESSION_KEY } = await import("./auth.ts");
  browserSession({ ...tokenPair, expiresAt: 0 });
  let finish;
  globalThis.fetch = async (url) => {
    if (url.endsWith("/refresh"))
      return new Promise((resolve) => {
        finish = resolve;
      });
    return Response.json({ status: 200, data: null });
  };
  const refresh = refreshAuthSession();
  await logoutAccount();
  finish(Response.json({ status: 200, data: { ...tokenPair, accessToken: "rotated" } }));
  await assert.rejects(refresh, /đã thay đổi/);
  assert.equal(sessionStorage.getItem(AUTH_SESSION_KEY), null);
  delete globalThis.sessionStorage;
});

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
  assert.equal(getLoginDestination(user, "candidate"), "/candidate/jobs");
  assert.equal(getLoginDestination(user, "recruiter"), "/recruiter");
  assert.equal(getLoginDestination({ ...user, role: "ADMIN" }, "candidate"), "/admin");
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
    assert.equal(options.headers.Authorization, "Bearer access");
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

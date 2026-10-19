import assert from "node:assert/strict";
import { test } from "node:test";
import { createMockApiServer, MOCK_PASSWORD } from "./mock-api.mjs";

test("mock API supports candidate/recruiter onboarding, rotation, and logout like the backend", async (t) => {
  const server = createMockApiServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (path, method = "GET", body, token) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, ...(await response.json()) };
  };
  const candidate = await call("/auth/login", "POST", {
    usernameOrEmail: "candidate_demo",
    password: MOCK_PASSWORD,
  });
  assert.equal(candidate.data.user.role, "USER");
  assert.equal(
    (await call("/auth/me", "GET", null, candidate.data.accessToken)).data.activeMembership,
    null,
  );
  const registered = await call("/auth/register", "POST", {
    firstName: "An",
    lastName: "Nguyễn",
    username: "new_recruiter",
    email: "new@example.test",
    password: MOCK_PASSWORD,
    role: "RECRUITER",
  });
  assert.equal(registered.status, 201);
  assert.equal(registered.data.role, "USER");
  const login = await call("/auth/login", "POST", {
    usernameOrEmail: "new_recruiter",
    password: MOCK_PASSWORD,
  });
  const company = {
    name: "Beta",
    taxCode: "0100009999",
    email: "beta@example.test",
    registrationCertificateUrl: "http://localhost:5137/api/mock/certificate.pdf",
  };
  assert.equal((await call("/companies/verification-request", "POST", company)).status, 401);
  assert.equal(
    (await call("/companies/verification-request", "POST", company, login.data.accessToken)).status,
    201,
  );
  const me = await call("/auth/me", "GET", null, login.data.accessToken);
  assert.equal(me.data.role, "USER");
  assert.equal(me.data.activeMembership.companyRole, "OWNER");
  assert.equal(
    (await call("/companies/verification-request", "POST", company, login.data.accessToken)).status,
    409,
  );
  const rotated = await call("/auth/refresh", "POST", { refreshToken: login.data.refreshToken });
  assert.equal(rotated.status, 200);
  assert.notEqual(rotated.data.refreshToken, login.data.refreshToken);
  assert.equal(
    (await call("/auth/refresh", "POST", { refreshToken: login.data.refreshToken })).status,
    401,
  );
  await call("/auth/logout", "POST", { refreshToken: rotated.data.refreshToken });
  assert.equal(
    (await call("/auth/refresh", "POST", { refreshToken: rotated.data.refreshToken })).status,
    401,
  );
  assert.equal((await call("/auth/me", "GET", null, rotated.data.accessToken)).status, 200);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { createMockApiServer, MOCK_PASSWORD } from "./mock-api.mjs";

test("mock API supports shared registration, Company setup, rotation, and logout", async (t) => {
  const server = createMockApiServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (path, method = "GET", body, token) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
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
  assert.equal(
    (await call("/me/employer-onboarding", "GET", null, login.data.accessToken)).status,
    410,
  );
  assert.equal((await call("/employer-registrations", "POST", {})).status, 410);
  assert.equal((await call("/companies/verification-request", "POST", company)).status, 401);
  assert.equal(
    (await call("/companies/verification-request", "POST", company, login.data.accessToken)).status,
    410,
  );
  const me = await call("/auth/me", "GET", null, login.data.accessToken);
  assert.equal(me.data.emailVerified, false);
  assert.equal(me.data.recruitingEmailEligible, false);
  assert.equal(me.data.activeMembership, null);
  const dossier = new FormData();
  dossier.append(
    "dossier",
    new Blob(
      [
        JSON.stringify({
          name: "Beta",
          taxCode: "0100009999",
          legal: { workAddress: "Address", submitterPosition: "Owner", declarationAccepted: true },
        }),
      ],
      { type: "application/json" },
    ),
  );
  dossier.append("file", new File(["%PDF-1.4 test"], "license.pdf", { type: "application/pdf" }));
  assert.equal(
    (await call("/companies/verification-request", "POST", dossier, login.data.accessToken)).status,
    403,
  );
  assert.equal(
    (await call("/companies/verification-request", "POST", dossier, candidate.data.accessToken))
      .status,
    201,
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

test("mock API serves the notification inbox contract the client polls with", async (t) => {
  const server = createMockApiServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (path, method = "GET", body, token) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
    });
    return { status: response.status, ...(await response.json()) };
  };
  const candidate = await call("/auth/login", "POST", {
    usernameOrEmail: "candidate_demo",
    password: MOCK_PASSWORD,
  });
  const token = candidate.data.accessToken;

  const list = await call("/me/notifications?page=0&size=20", "GET", null, token);
  assert.equal(list.status, 200);
  assert.equal(list.data.totalElements, 11);
  // Newest first by id: the client polls with an id watermark.
  assert.equal(list.data.content[0].id, "111");

  // Audience isolates the portals.
  assert.equal(
    (await call("/me/notifications?audience=CANDIDATE", "GET", null, token)).data.totalElements,
    11,
  );
  assert.equal(
    (await call("/me/notifications?audience=RECRUITER", "GET", null, token)).data.totalElements,
    0,
  );

  // The delta of a poll carries only rows newer than the watermark.
  const delta = await call("/me/notifications?sinceId=109", "GET", null, token);
  assert.deepEqual(
    delta.data.content.map((item) => item.id),
    ["111", "110"],
  );

  // Read filter.
  const unreadOnly = await call("/me/notifications?read=false", "GET", null, token);
  assert.equal(unreadOnly.data.totalElements, 7);
  const readOnly = await call("/me/notifications?read=true", "GET", null, token);
  assert.equal(readOnly.data.totalElements, 4);

  const unread = await call("/me/notifications/unread-count", "GET", null, token);
  assert.equal(unread.data.unreadCount, 7);

  const detail = await call("/me/notifications/111", "GET", null, token);
  assert.equal(detail.status, 200);
  assert.equal(detail.data.id, "111");
  assert.equal((await call("/me/notifications/999", "GET", null, token)).status, 404);

  const single = await call("/me/notifications/111/read", "PATCH", null, token);
  assert.equal(single.status, 200);
  assert.equal(
    (await call("/me/notifications/unread-count", "GET", null, token)).data.unreadCount,
    6,
  );

  const markAll = await call("/me/notifications/read", "PATCH", null, token);
  assert.equal(markAll.status, 200);
  assert.equal(markAll.data.updatedCount, 6);
  assert.equal(
    (await call("/me/notifications/unread-count", "GET", null, token)).data.unreadCount,
    0,
  );
});

test("mock API serves the recruiter inbox of a recruiter account", async (t) => {
  const server = createMockApiServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (path, method = "GET", body, token) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, ...(await response.json()) };
  };
  const recruiter = await call("/auth/login", "POST", {
    usernameOrEmail: "recruiter_demo",
    password: MOCK_PASSWORD,
  });
  const token = recruiter.data.accessToken;

  const list = await call("/me/notifications?audience=RECRUITER", "GET", null, token);
  assert.equal(list.status, 200);
  assert.equal(list.data.totalElements, 3);
  assert.equal(list.data.content[0].id, "203");
  assert.equal(
    (await call("/me/notifications?audience=CANDIDATE", "GET", null, token)).data.totalElements,
    0,
  );
});

test("mock API answers a polling round with the delta, the counters and a tag", async (t) => {
  const server = createMockApiServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (path, method = "GET", body, token) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: response.status,
      etag: response.headers.get("etag"),
      body: await response.text(),
    };
  };
  const candidate = await call("/auth/login", "POST", {
    usernameOrEmail: "candidate_demo",
    password: MOCK_PASSWORD,
  });
  const token = JSON.parse(candidate.body).data.accessToken;

  const first = await call("/me/notifications/sync", "GET", null, token);
  assert.equal(first.status, 200);
  const payload = JSON.parse(first.body).data;
  assert.equal(payload.items.length, 11);
  assert.equal(payload.unreadCount, 7);
  assert.equal(payload.totalCount, 11);
  assert.equal(payload.latestId, 111);
  assert.equal(payload.hasMore, false);
  assert.ok(first.etag, "the round carries an entity tag");

  // The delta carries only the rows above the watermark.
  const delta = await call("/me/notifications/sync?sinceId=109", "GET", null, token);
  assert.deepEqual(
    JSON.parse(delta.body).data.items.map((item) => item.id),
    ["111", "110"],
  );

  // A conditional request whose tag still matches gets no body.
  const unchanged = await fetch(`${base}/me/notifications/sync`, {
    headers: { Authorization: `Bearer ${token}`, "If-None-Match": first.etag },
  });
  assert.equal(unchanged.status, 304);
  assert.equal(await unchanged.text(), "");

  // A delivered row changes the tag and answers with the new row.
  await call("/mock/notifications", "POST", { title: "Thông báo mới" }, token);
  const changed = await fetch(`${base}/me/notifications/sync`, {
    headers: { Authorization: `Bearer ${token}`, "If-None-Match": first.etag },
  });
  assert.equal(changed.status, 200);
  const changedPayload = JSON.parse(await changed.text()).data;
  assert.equal(changedPayload.items[0].title, "Thông báo mới");
  assert.equal(changedPayload.unreadCount, 8);
  assert.equal(changedPayload.totalCount, 12);
});

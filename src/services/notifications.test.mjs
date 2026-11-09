import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "./api.ts";
import {
  categoryForType,
  countUnread,
  markAllNotificationsRead,
  markNotificationRead,
  parseMarkAllReadResponse,
  parseNotification,
  parseNotificationPage,
  parseUnreadCount,
  resolveNotificationPath,
  sortNewestFirst,
} from "./notifications.ts";

const ISO = "2026-11-06T09:00:00.000Z";

function minimal(id, overrides = {}) {
  return { id, title: `Title ${id}`, body: `Body ${id}`, createdAt: ISO, ...overrides };
}

test("parses a legacy mock row into the canonical model", () => {
  const result = parseNotification({
    id: "1",
    title: "  Story Hub  ",
    message: "Share your story",
    createdAt: ISO,
    read: false,
    category: "reward",
  });

  assert.equal(result.id, "1");
  assert.equal(result.type, "");
  assert.equal(result.category, "reward");
  assert.equal(result.title, "Story Hub");
  assert.equal(result.body, "Share your story");
  assert.equal(result.createdAt, ISO);
  assert.equal(result.read, false);
  assert.equal(result.readAt, null);
  assert.equal(result.action, null);
  assert.equal(result.actor, null);
  assert.deepEqual(result.references, {});
});

test("adapts the GuardianWork notification response", () => {
  const result = parseNotification({
    id: 42,
    eventType: "APPLICATION_STATUS_CHANGED",
    audience: "CANDIDATE",
    companyId: 7,
    companyName: "Alpha",
    createdAt: ISO,
    readAt: null,
    jobId: 3,
    revisionId: null,
    applicationId: "9f6c7f2e-application",
    candidateFeedback: "We would like to schedule an interview.",
  });

  assert.equal(result.id, "42");
  assert.equal(result.type, "APPLICATION_STATUS_CHANGED");
  assert.equal(result.audience, "CANDIDATE");
  assert.equal(result.category, "application");
  assert.equal(result.title, "");
  assert.equal(result.body, "We would like to schedule an interview.");
  assert.equal(result.read, false);
  assert.equal(result.readAt, null);
  assert.deepEqual(result.references, {
    company: "7",
    job: "3",
    application: "9f6c7f2e-application",
  });
});

test("uses body from candidateFeedback when the server omits the body (microsecond timestamps)", () => {
  const result = parseNotification({
    id: 2,
    eventType: "APPLICATION_REJECTED",
    companyId: 1,
    companyName: "Công ty TNHH GuardWork Demo",
    createdAt: "2026-11-05T05:32:23.009889Z",
    readAt: "2026-11-07T04:35:18.666758Z",
    jobId: 11,
    revisionId: 13,
    applicationId: "daaa4ed1-feb0-40a2-be89-4577d0c6005d",
    candidateFeedback: "Cảm ơn bạn đã ứng tuyển và mong gặp lại ở cơ hội sau.",
  });

  assert.equal(result.id, "2");
  assert.equal(result.type, "APPLICATION_REJECTED");
  assert.equal(result.category, "application");
  assert.equal(result.title, "");
  assert.equal(result.body, "Cảm ơn bạn đã ứng tuyển và mong gặp lại ở cơ hội sau.");
  assert.equal(result.createdAt, "2026-11-05T05:32:23.009889Z");
  assert.equal(result.read, true);
  assert.equal(result.readAt, "2026-11-07T04:35:18.666758Z");
  assert.deepEqual(result.references, {
    company: "1",
    job: "11",
    revision: "13",
    application: "daaa4ed1-feb0-40a2-be89-4577d0c6005d",
  });
});

test("normalizes aliases, derived read state, action, actor, and references", () => {
  const result = parseNotification({
    id: "n-1",
    type: "JOB_REVISION_APPROVED",
    title: "Revision approved",
    content: "Your job revision is live.",
    created_at: ISO,
    read_at: "2026-11-06T10:00:00.000Z",
    priority: "urgent",
    action: { href: "/rec/notifications/n-1", label: "View" },
    sender: { id: 9, name: "Recruiter", avatar: "https://cdn/avatar.png" },
    references: { job: 12 },
    metadata: { revisionNumber: 4 },
    target: { type: "JOB", id: 12 },
  });

  assert.equal(result.type, "JOB_REVISION_APPROVED");
  assert.equal(result.category, "job");
  assert.equal(result.body, "Your job revision is live.");
  assert.equal(result.createdAt, ISO);
  assert.equal(result.read, true);
  assert.equal(result.readAt, "2026-11-06T10:00:00.000Z");
  assert.deepEqual(result.action, {
    label: "View",
    href: "/rec/notifications/n-1",
    external: false,
  });
  assert.deepEqual(result.actor, {
    id: "9",
    name: "Recruiter",
    avatarUrl: "https://cdn/avatar.png",
  });
  assert.deepEqual(result.references, { job: "12" });
});

test("falls back to a safe category and keeps the derived read flag consistent", () => {
  const unknown = parseNotification({
    id: "1",
    kind: "SOMETHING_NEW",
    category: "not-a-category",
    createdAt: ISO,
  });
  assert.equal(unknown.category, "system");

  // Legacy rows without an audience derive it from the event kind:
  // status/rejected are candidate-facing, everything else (incl. withdrawn)
  // is recruiter-facing.
  assert.equal(
    parseNotification({ id: "a", eventType: "APPLICATION_REJECTED", createdAt: ISO }).audience,
    "CANDIDATE",
  );
  assert.equal(
    parseNotification({ id: "b", eventType: "APPLICATION_WITHDRAWN", createdAt: ISO }).audience,
    "",
  );

  const explicit = parseNotification({
    id: "2",
    category: "JOB",
    createdAt: ISO,
  });
  assert.equal(explicit.category, "job");

  const readWithoutTimestamp = parseNotification({
    id: "3",
    createdAt: ISO,
    read: true,
  });
  assert.equal(readWithoutTimestamp.read, true);
  assert.equal(readWithoutTimestamp.readAt, null);

  const missingDate = parseNotification({ id: "4" });
  assert.equal(missingDate.createdAt, "");
});

test("rejects a notification without an id", () => {
  assert.throws(() => parseNotification(null), ApiError);
  assert.throws(() => parseNotification({ title: "No id" }), ApiError);
});

test("maps event keys to categories", () => {
  assert.equal(categoryForType("APPLICATION_REJECTED"), "application");
  assert.equal(categoryForType("job_closed"), "job");
  assert.equal(categoryForType("COMPANY_VERIFIED"), "company");
  assert.equal(categoryForType("MEMBERSHIP_REMOVED"), "company");
  assert.equal(categoryForType("ACCOUNT_LOCKED"), "account");
  assert.equal(categoryForType("VERIFICATION_APPROVED"), "verification");
  assert.equal(categoryForType(""), "system");
  assert.equal(categoryForType("UNKNOWN"), "system");
});

test("parses a PageResponse envelope and preserves the server unread count", () => {
  const page = parseNotificationPage({
    content: [minimal("2", { read: false }), minimal("1", { read: true, readAt: ISO })],
    pageNumber: 0,
    pageSize: 20,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
    unreadCount: 1,
  });

  assert.equal(page.items.length, 2);
  assert.equal(page.items[0].id, "2");
  assert.equal(page.pageNumber, 0);
  assert.equal(page.pageSize, 20);
  assert.equal(page.totalElements, 2);
  assert.equal(page.totalPages, 1);
  assert.equal(page.unreadCount, 1);
});

test("parses a bare array and an outer data envelope", () => {
  const bare = parseNotificationPage([minimal("1"), minimal("2")]);
  assert.equal(bare.items.length, 2);
  assert.equal(bare.totalElements, 2);
  assert.equal(bare.unreadCount, null);

  const wrapped = parseNotificationPage({
    status: 200,
    data: { items: [minimal("3")], total: 1, size: 10 },
  });
  assert.equal(wrapped.items.length, 1);
  assert.equal(wrapped.totalElements, 1);
  assert.equal(wrapped.pageSize, 10);
});

test("rejects an invalid page envelope", () => {
  assert.throws(() => parseNotificationPage({ content: "nope" }), ApiError);
  assert.throws(() => parseNotificationPage(null), ApiError);
});

test("counts unread items and sorts without mutating the input", () => {
  const older = parseNotification(minimal("1", { createdAt: "2026-11-01T00:00:00.000Z" }));
  const newer = parseNotification(minimal("2", { createdAt: "2026-11-06T00:00:00.000Z" }));
  const unknownDate = parseNotification(minimal("3", { createdAt: "" }));
  const items = [older, unknownDate, newer];

  assert.equal(countUnread(items), 3);
  const sorted = sortNewestFirst(items);
  assert.deepEqual(
    sorted.map((item) => item.id),
    ["2", "1", "3"],
  );
  assert.deepEqual(
    items.map((item) => item.id),
    ["1", "3", "2"],
  );
});

test("marks one notification read and preserves an existing timestamp", () => {
  const unread = parseNotification(minimal("1", { read: false }));
  const alreadyRead = parseNotification(
    minimal("2", { read: true, readAt: "2026-11-05T00:00:00.000Z" }),
  );
  const marked = markNotificationRead([unread, alreadyRead], "1", "2026-11-06T12:00:00.000Z");
  const untouched = markNotificationRead(marked, "2", "2026-11-06T13:00:00.000Z");

  assert.equal(marked[0].read, true);
  assert.equal(marked[0].readAt, "2026-11-06T12:00:00.000Z");
  assert.equal(untouched[1].readAt, "2026-11-05T00:00:00.000Z");
  assert.equal(countUnread(marked), 0);
});

test("marks all notifications read", () => {
  const items = [
    parseNotification(minimal("1", { read: false })),
    parseNotification(minimal("2", { read: true, readAt: ISO })),
  ];
  const marked = markAllNotificationsRead(items, "2026-11-06T12:00:00.000Z");

  assert.equal(countUnread(marked), 0);
  assert.equal(marked[0].readAt, "2026-11-06T12:00:00.000Z");
  assert.equal(marked[1].readAt, ISO);
  assert.equal(items[0].read, false);
});

test("parses unread-count and mark-all envelopes", () => {
  assert.deepEqual(parseUnreadCount({ unreadCount: 3 }), { unreadCount: 3 });
  assert.deepEqual(parseUnreadCount({ data: { unreadCount: "7" } }), { unreadCount: 7 });
  assert.throws(() => parseUnreadCount({ unreadCount: -1 }), ApiError);
  assert.throws(() => parseUnreadCount(null), ApiError);

  assert.deepEqual(parseMarkAllReadResponse({ updatedCount: 2, readAt: ISO }), {
    updatedCount: 2,
    readAt: ISO,
  });
  assert.deepEqual(parseMarkAllReadResponse({ data: { updatedCount: 0, readAt: ISO } }), {
    updatedCount: 0,
    readAt: ISO,
  });
  assert.throws(() => parseMarkAllReadResponse({ updatedCount: 1, readAt: "bad" }), ApiError);
});

test("resolves backend action hrefs to portal routes", () => {
  const job = parseNotification({
    id: "1",
    type: "JOB_ASSIGNED",
    category: "job",
    createdAt: ISO,
    action: { href: "/jobs/12" },
  });
  assert.deepEqual(resolveNotificationPath(job, "can"), { to: "/jobs", search: { job: "12" } });
  assert.deepEqual(resolveNotificationPath(job, "rec"), { to: "/rec/jobs", search: { jobId: 12 } });
  assert.equal(resolveNotificationPath(job, "staff"), null);

  const application = parseNotification({
    id: "2",
    type: "APPLICATION_REJECTED",
    category: "application",
    createdAt: ISO,
    action: { href: "/applications/app-9" },
    references: { job: "5", application: "app-9" },
  });
  assert.deepEqual(resolveNotificationPath(application, "can"), { to: "/can/applied" });
  assert.deepEqual(resolveNotificationPath(application, "rec"), {
    to: "/rec/applications/$jobId/$applicationId",
    params: { jobId: "5", applicationId: "app-9" },
  });
  assert.equal(resolveNotificationPath(application, "staff"), null);

  const listed = parseNotification({
    id: "3",
    type: "APPLICATION_STATUS_CHANGED",
    category: "application",
    createdAt: ISO,
    action: { href: "/applications/app-9" },
  });
  assert.deepEqual(resolveNotificationPath(listed, "rec"), { to: "/rec/applications" });

  const company = parseNotification({
    id: "4",
    type: "RECRUITER_ACCEPTED",
    category: "company",
    createdAt: ISO,
    action: { href: "/companies/7" },
  });
  assert.deepEqual(resolveNotificationPath(company, "rec"), { to: "/rec/members" });
  assert.equal(resolveNotificationPath(company, "can"), null);

  const none = parseNotification({
    id: "5",
    type: "JOB_UNASSIGNED",
    category: "job",
    createdAt: ISO,
  });
  assert.equal(resolveNotificationPath(none, "can"), null);
  const external = parseNotification({
    id: "6",
    category: "system",
    createdAt: ISO,
    action: { href: "https://example.test/x" },
  });
  assert.equal(resolveNotificationPath(external, "can"), null);
});

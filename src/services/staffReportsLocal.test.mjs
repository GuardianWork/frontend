import assert from "node:assert/strict";
import { beforeEach, afterEach, test } from "node:test";
import { commitReportChange, loadReportWorkspace } from "./staffReportsLocal.ts";
import { companyVerificationPresentation } from "../lib/company-verification-presentation.ts";
let data;
beforeEach(() => {
  data = new Map();
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
});
afterEach(() => {
  delete globalThis.localStorage;
});
const event = {
  id: "activity-1",
  occurredAt: "2026-11-07T03:00:00Z",
  reportId: "report-1",
  reportNumber: 1,
  target: "Tin tuyển dụng",
  subject: "Phản ánh phí hồ sơ",
  action: "REVIEW",
  field: "status",
  before: null,
  after: "Đang xem xét",
};
test("report state and its audit event are saved together and isolated by staff account", () => {
  const reports = { "report-1": { read: true, status: "Đang xem xét" } };
  commitReportChange(4, reports, event);
  assert.deepEqual(loadReportWorkspace(4), { reports, activities: [event] });
  assert.deepEqual(loadReportWorkspace(5), { reports: {}, activities: [] });
  commitReportChange(
    4,
    { "report-1": { read: false, status: "Đang xem xét" } },
    { ...event, id: "activity-2", action: "UNREAD", field: "read", before: true, after: false },
  );
  assert.equal(loadReportWorkspace(4).activities.length, 2);
  assert.equal(loadReportWorkspace(4).reports["report-1"].status, "Đang xem xét");
});
test("legacy read and processing choices migrate without fabricated historical events", () => {
  data.set(
    "guardianwork:staff:4:sample-report-state:v1",
    JSON.stringify({ r: { read: true, status: "Đã xử lý" } }),
  );
  assert.deepEqual(loadReportWorkspace(4), {
    reports: { r: { read: true, status: "Đã xử lý" } },
    activities: [],
  });
});
test("malformed storage is ignored and failed writes do not commit an audit entry", () => {
  data.set("guardianwork:staff:4:sample-report-workspace:v2", "broken");
  assert.deepEqual(loadReportWorkspace(4), { reports: {}, activities: [] });
  globalThis.localStorage.setItem = () => {
    throw new Error("Storage full");
  };
  assert.throws(() => commitReportChange(4, { r: { read: true } }, event), /Storage full/);
  assert.deepEqual(loadReportWorkspace(4), { reports: {}, activities: [] });
});
test("company verification history shares dossier outcome labels and never equates CHECKED with approval", () => {
  assert.deepEqual(companyVerificationPresentation("PENDING"), {
    label: "Chờ duyệt",
    tone: "pending",
  });
  assert.deepEqual(companyVerificationPresentation("VERIFIED"), {
    label: "Đã xác minh",
    tone: "verified",
  });
  assert.deepEqual(companyVerificationPresentation("REJECTED"), {
    label: "Đã từ chối",
    tone: "rejected",
  });
  assert.deepEqual(companyVerificationPresentation("REGISTERED"), {
    label: "Chưa gửi",
    tone: "neutral",
  });
  assert.deepEqual(companyVerificationPresentation("CHECKED"), {
    label: "Chưa rõ kết quả xác minh",
    tone: "neutral",
  });
});

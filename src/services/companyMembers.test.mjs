import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import {
  submitVerification,
  executeAdminDecision,
  getStoredVerificationRecord,
  saveStoredVerificationRecord,
} from "./companyVerification.ts";
import {
  getCompanyWorkspace,
  currentMember,
  updateCompanyMembers,
  canViewMemberData,
  createCompanyJob,
  submitCompanyApplication,
  reviewCompanyJob,
  setCompanyJobVisibility,
  getJobApprovalQueue,
  jobModerationStatus,
} from "./companyMembers.ts";
const originalFetch = globalThis.fetch;
const owner = {
  id: 1,
  firstName: "An",
  lastName: "Nguyễn",
  email: "owner@example.com",
  role: "USER",
  username: "owner",
};
const recruiter = { ...owner, id: 2, email: "hr@example.com" };
const third = { ...owner, id: 3, email: "other@example.com" };
function storage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key: (index) => Array.from(values.keys())[index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
function login(user) {
  const company = getStoredVerificationRecord();
  sessionStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({ user, accessToken: "token", expiresAt: Date.now() + 60000 }),
  );
  // Seed the same local workspace fixture for each test participant. Real UI reloads
  // the signed-in member's company from the backend rather than sharing account caches.
  if (company.verificationStatus === "VERIFIED") saveStoredVerificationRecord(company);
}
async function verifiedCompany() {
  await submitVerification({
    name: "Company",
    taxCode: "0316892341",
    email: "company@example.com",
    registrationCertificateUrl: "https://example.test/license.pdf",
  });
  await executeAdminDecision(101, "VERIFIED");
}
function invite(user) {
  updateCompanyMembers({ type: "invite", email: user.email });
  login(user);
  updateCompanyMembers({ type: "accept" });
  const id = currentMember(getCompanyWorkspace()).id;
  login(owner);
  return id;
}
beforeEach(() => {
  globalThis.window = { dispatchEvent() {} };
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  globalThis.fetch = async (url, init) => {
    if (url.endsWith("/verification-request")) {
      return Response.json(
        {
          status: 201,
          data: {
            ...JSON.parse(init.body),
            id: 101,
            verificationStatus: "PENDING",
            version: 0,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 },
      );
    }
    return new Response(null, { status: 503 });
  };
  login(owner);
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  delete globalThis.localStorage;
  delete globalThis.sessionStorage;
});
test("only the recorded submitter becomes Owner after approval, independent of company contact email", async () => {
  await submitVerification({
    name: "Company",
    taxCode: "0316892341",
    email: "company@example.com",
    registrationCertificateUrl: "https://example.test/license.pdf",
  });
  assert.equal(getStoredVerificationRecord().submittedBy.id, owner.id);
  assert.equal(currentMember(getCompanyWorkspace()), undefined);
  assert.throws(
    () => updateCompanyMembers({ type: "invite", email: recruiter.email }),
    /chưa được xác thực/,
  );
  await executeAdminDecision(101, "VERIFIED");
  login(recruiter);
  assert.equal(currentMember(getCompanyWorkspace()), undefined);
  login(owner);
  assert.equal(currentMember(getCompanyWorkspace()).role, "Owner");
});
test("invitations require the matching email and membership survives reloads", async () => {
  await verifiedCompany();
  updateCompanyMembers({ type: "invite", email: " HR@Example.com " });
  assert.throws(
    () => updateCompanyMembers({ type: "invite", email: recruiter.email }),
    /đang có lời mời/,
  );
  login(third);
  assert.throws(() => updateCompanyMembers({ type: "accept" }), /Không có lời mời/);
  login(recruiter);
  updateCompanyMembers({ type: "accept" });
  assert.equal(currentMember(getCompanyWorkspace()).role, "recruiter");
  assert.equal(currentMember(getCompanyWorkspace()).userId, recruiter.id);
});
test("recruiters cannot invite, remove, promote or assign permissions", async () => {
  await verifiedCompany();
  const id = invite(recruiter);
  login(recruiter);
  for (const action of [
    { type: "invite", email: third.email },
    { type: "remove", memberId: "user-1" },
    { type: "role", memberId: id, role: "Owner" },
    { type: "grant", grant: { viewerId: id, authorId: "user-1", jobs: true, applications: true } },
  ])
    assert.throws(() => updateCompanyMembers(action), /Chỉ Owner/);
});
test("job and application grants are directional, independent and revocable", async () => {
  await verifiedCompany();
  const id = invite(recruiter);
  const otherId = invite(third);
  updateCompanyMembers({
    type: "grant",
    grant: { viewerId: id, authorId: otherId, jobs: true, applications: false },
  });
  login(recruiter);
  assert.equal(canViewMemberData(getCompanyWorkspace(), id, "jobs"), true);
  assert.equal(canViewMemberData(getCompanyWorkspace(), otherId, "jobs"), true);
  assert.equal(canViewMemberData(getCompanyWorkspace(), otherId, "applications"), false);
  login(third);
  assert.equal(canViewMemberData(getCompanyWorkspace(), id, "jobs"), false);
  login(owner);
  updateCompanyMembers({
    type: "grant",
    grant: { viewerId: id, authorId: otherId, jobs: false, applications: true },
  });
  login(recruiter);
  assert.equal(canViewMemberData(getCompanyWorkspace(), otherId, "jobs"), false);
  assert.equal(canViewMemberData(getCompanyWorkspace(), otherId, "applications"), true);
});
test("the last Owner cannot be removed or demoted; another active recruiter can become Owner", async () => {
  await verifiedCompany();
  assert.throws(
    () => updateCompanyMembers({ type: "remove", memberId: "user-1" }),
    /ít nhất một Owner/,
  );
  assert.throws(
    () => updateCompanyMembers({ type: "role", memberId: "user-1", role: "recruiter" }),
    /ít nhất một Owner/,
  );
  const id = invite(recruiter);
  updateCompanyMembers({ type: "role", memberId: id, role: "Owner" });
  updateCompanyMembers({ type: "role", memberId: "user-1", role: "recruiter" });
  assert.equal(currentMember(getCompanyWorkspace()).role, "recruiter");
  login(recruiter);
  assert.equal(currentMember(getCompanyWorkspace()).role, "Owner");
});
test("removal revokes grants and access, retaining authored job history", async () => {
  await verifiedCompany();
  const id = invite(recruiter);
  login(recruiter);
  createCompanyJob({
    title: "Frontend",
    department: "IT",
    location: "HCM",
    salary: "20M",
    status: "Active",
  });
  assert.equal(getCompanyWorkspace().jobs[0].authorId, id);
  login(owner);
  updateCompanyMembers({
    type: "grant",
    grant: { viewerId: id, authorId: "user-1", jobs: true, applications: true },
  });
  updateCompanyMembers({ type: "remove", memberId: id });
  assert.equal(getCompanyWorkspace().jobs.length, 1);
  assert.equal(getCompanyWorkspace().grants.length, 0);
  login(recruiter);
  assert.equal(canViewMemberData(getCompanyWorkspace(), id, "jobs"), false);
  assert.throws(() => createCompanyJob({ title: "Denied" }), /thành viên/);
});
test("legacy verified records never assign ownership to the current visitor", async () => {
  await verifiedCompany();
  const record = getStoredVerificationRecord();
  delete record.submittedBy;
  saveStoredVerificationRecord(record);
  assert.equal(getCompanyWorkspace().members.length, 0);
});
test("expired sessions and changed companies cannot reuse membership", async () => {
  await verifiedCompany();
  sessionStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({ user: owner, accessToken: "token", expiresAt: 0 }),
  );
  assert.equal(canViewMemberData(getCompanyWorkspace(), "user-1", "jobs"), false);
  login(owner);
  invite(recruiter);
  saveStoredVerificationRecord({
    ...getStoredVerificationRecord(),
    taxCode: "different",
    submittedBy: third,
  });
  assert.equal(currentMember(getCompanyWorkspace()), undefined);
});
test("failed persistence throws rather than claiming success", async () => {
  await verifiedCompany();
  localStorage.setItem = () => {
    throw new Error("quota");
  };
  assert.throws(
    () => updateCompanyMembers({ type: "invite", email: recruiter.email }),
    /Không thể lưu/,
  );
});

test("expired or missing identities cannot submit ownerless verification requests", async () => {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  await assert.rejects(
    submitVerification({
      name: "Company",
      taxCode: "0316892341",
      email: "company@example.com",
      registrationCertificateUrl: "https://example.test/license.pdf",
    }),
    /đăng nhập/,
  );
  assert.equal(getStoredVerificationRecord().verificationStatus, "REGISTERED");
  sessionStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({ user: owner, accessToken: "token", expiresAt: 0 }),
  );
  await assert.rejects(
    submitVerification({
      name: "Company",
      taxCode: "0316892341",
      email: "company@example.com",
      registrationCertificateUrl: "https://example.test/license.pdf",
    }),
    /đăng nhập/,
  );
});

test("candidate applications are linked to the posting author and respect application grants", async () => {
  await verifiedCompany();
  const authorId = invite(recruiter);
  const viewerId = invite(third);
  login(recruiter);
  createCompanyJob({
    title: "Frontend",
    department: "IT",
    location: "HCM",
    salary: "20M",
    status: "Active",
  });
  const jobId = getCompanyWorkspace().jobs[0].id;
  login({ ...owner, role: "ADMIN" });
  reviewCompanyJob(jobId, "approved");
  login({ ...owner, id: 4, email: "candidate@example.com" });
  submitCompanyApplication(jobId);
  assert.throws(() => submitCompanyApplication(jobId), /đã ứng tuyển/);
  assert.equal(getCompanyWorkspace().applications[0].jobId, jobId);
  login(third);
  assert.equal(canViewMemberData(getCompanyWorkspace(), authorId, "applications"), false);
  login(owner);
  updateCompanyMembers({
    type: "grant",
    grant: { viewerId, authorId, jobs: false, applications: true },
  });
  login(third);
  const workspace = getCompanyWorkspace();
  const visibleApplications = workspace.applications.filter((a) =>
    canViewMemberData(
      workspace,
      workspace.jobs.find((j) => j.id === a.jobId).authorId,
      "applications",
    ),
  );
  assert.equal(visibleApplications.length, 1);
  assert.equal(visibleApplications[0].email, "candidate@example.com");
  assert.equal(canViewMemberData(workspace, authorId, "jobs"), false);
  login(owner);
  updateCompanyMembers({
    type: "grant",
    grant: { viewerId, authorId, jobs: false, applications: false },
  });
  login(third);
  assert.equal(canViewMemberData(getCompanyWorkspace(), authorId, "applications"), false);
});

test("new jobs require admin review before applications and decisions persist", async () => {
  await verifiedCompany();
  createCompanyJob({
    title: "Kế toán",
    department: "Tài chính",
    location: "HCM",
    salary: "20M",
    status: "Active",
  });
  const id = getCompanyWorkspace().jobs[0].id;
  assert.equal(jobModerationStatus(getCompanyWorkspace().jobs[0]), "pending");
  assert.throws(() => submitCompanyApplication(id), /không còn nhận đơn/);
  assert.throws(() => reviewCompanyJob(id, "approved"), /quản trị viên/);
  login({ ...owner, role: "ADMIN" });
  assert.throws(() => reviewCompanyJob(id, "rejected", "   "), /10 đến/);
  reviewCompanyJob(id, "approved");
  assert.equal(jobModerationStatus(getCompanyWorkspace().jobs[0]), "approved");
  assert.equal(getCompanyWorkspace().jobs[0].reviewedBy, owner.email);
  assert.throws(() => reviewCompanyJob(id, "rejected", "Thông tin chưa đầy đủ"), /đã được xử lý/);
  login(third);
  submitCompanyApplication(id);
  assert.equal(getCompanyWorkspace().applications[0].jobId, id);
});

test("rejection reasons persist, rejected jobs stay unavailable and failed writes are reported", async () => {
  await verifiedCompany();
  createCompanyJob({
    title: "Sales",
    department: "Sales",
    location: "HCM",
    salary: "20M",
    status: "Active",
  });
  const id = getCompanyWorkspace().jobs[0].id;
  login({ ...owner, role: "ADMIN" });
  const setItem = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error("quota");
  };
  assert.throws(() => reviewCompanyJob(id, "approved"), /Không thể lưu/);
  localStorage.setItem = setItem;
  assert.equal(jobModerationStatus(getCompanyWorkspace().jobs[0]), "pending");
  reviewCompanyJob(id, "rejected", "  Vui lòng bổ sung mức lương.  ");
  assert.equal(getCompanyWorkspace().jobs[0].rejectionReason, "Vui lòng bổ sung mức lương.");
  assert.throws(() => submitCompanyApplication(id), /không còn nhận đơn/);
  assert.equal(jobModerationStatus({ status: "Active" }), "approved");
});

test("an admin with a separate identity can review another company's browser-local submissions", async () => {
  await verifiedCompany();
  createCompanyJob({
    title: "HR",
    department: "Nhân sự",
    location: "HCM",
    salary: "20M",
    status: "Active",
  });
  assert.throws(() => getJobApprovalQueue(), /quản trị viên/);
  const id = getCompanyWorkspace().jobs[0].id;
  login({ ...third, id: 999, role: "ADMIN" });
  saveStoredVerificationRecord({
    ...getStoredVerificationRecord(),
    verificationStatus: "REGISTERED",
  });
  assert.equal(getCompanyWorkspace().jobs.length, 0);
  const queue = getJobApprovalQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].id, id);
  assert.equal(queue[0].companyName, "Company");
  reviewCompanyJob(id, "approved", "", queue[0].workspaceKey);
  login(owner);
  assert.equal(jobModerationStatus(getCompanyWorkspace().jobs[0]), "approved");
});

test("visibility controls require admin and approved jobs, persist reasons and prevent applications while hidden", async () => {
  await verifiedCompany();
  createCompanyJob({
    title: "Finance",
    department: "Finance",
    location: "HCM",
    salary: "20M",
    status: "Active",
  });
  const id = getCompanyWorkspace().jobs[0].id;
  login({ ...owner, role: "ADMIN" });
  const key = getJobApprovalQueue()[0].workspaceKey;
  assert.throws(
    () => setCompanyJobVisibility(id, "HIDDEN", "Thông tin cần xem xét", key),
    /Chỉ thay đổi/,
  );
  reviewCompanyJob(id, "approved");
  assert.throws(() => setCompanyJobVisibility(id, "HIDDEN", "   ", key), /10 đến/);
  login(third);
  assert.throws(
    () => setCompanyJobVisibility(id, "HIDDEN", "Thông tin cần xem xét", key),
    /quản trị viên/,
  );
  login({ ...owner, role: "ADMIN" });
  setCompanyJobVisibility(id, "HIDDEN", "Thông tin cần xem xét", key);
  assert.equal(getCompanyWorkspace().jobs[0].visibility, "HIDDEN");
  assert.equal(getCompanyWorkspace().jobs[0].visibilityReason, "Thông tin cần xem xét");
  assert.throws(() => submitCompanyApplication(id), /không còn nhận đơn/);
  assert.throws(
    () => setCompanyJobVisibility(id, "HIDDEN", "Thông tin cần xem xét", key),
    /đã thay đổi/,
  );
  setCompanyJobVisibility(id, "PUBLIC", "Đã kiểm tra thông tin đầy đủ", key);
  assert.equal(getCompanyWorkspace().jobs[0].visibility, "PUBLIC");
  submitCompanyApplication(id);
  assert.equal(getCompanyWorkspace().applications.length, 1);
});

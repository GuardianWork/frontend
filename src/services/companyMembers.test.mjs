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
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
function login(user) {
  sessionStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({ user, accessToken: "token", expiresAt: Date.now() + 60000 }),
  );
}
async function verifiedCompany() {
  await submitVerification({
    name: "Company",
    taxCode: "0316892341",
    email: "company@example.com",
    registrationCertificateUrl: "certificate",
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
  globalThis.fetch = async () => new Response(null, { status: 503 });
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
    registrationCertificateUrl: "certificate",
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
      registrationCertificateUrl: "certificate",
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
      registrationCertificateUrl: "certificate",
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

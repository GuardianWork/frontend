import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  getStoredVerificationRecord,
  saveStoredVerificationRecord,
  submitVerification,
  resubmitVerification,
} from "./companyVerification.ts";

const originalFetch = globalThis.fetch;
const files = {
  registrationCertificateUrl: "data:application/pdf;base64,JVBERi0xLjQ=",
  powerOfAttorneyUrl: "data:image/png;base64,iVBORw0KGgo=",
};
const request = {
  name: "Example Company",
  taxCode: "0316892341",
  email: "HR@example.com",
  ...files,
};

beforeEach(() => {
  const values = new Map();
  globalThis.window = {};
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  globalThis.fetch = async () => new Response(null, { status: 503 });
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  delete globalThis.localStorage;
});

test("a new company starts with an editable application and no sample documents", () => {
  const record = getStoredVerificationRecord();
  assert.equal(record.verificationStatus, "REGISTERED");
  assert.equal(record.registrationCertificateUrl, "");
  assert.equal(record.powerOfAttorneyUrl, "");
  assert.equal(record.taxCode, "");
});

test("submitted documents remain readable after reloading the persisted application", async () => {
  await submitVerification(request);
  const reloaded = getStoredVerificationRecord();
  assert.equal(reloaded.verificationStatus, "PENDING");
  assert.equal(reloaded.email, "hr@example.com");
  assert.equal(reloaded.registrationCertificateUrl, files.registrationCertificateUrl);
  assert.equal(reloaded.powerOfAttorneyUrl, files.powerOfAttorneyUrl);
});

test("a rejected application can be resubmitted while preserving its identity and version", async () => {
  const pending = await submitVerification(request);
  saveStoredVerificationRecord({
    ...pending,
    verificationStatus: "REJECTED",
    rejectionReason: "Please upload a clear scan",
    version: 2,
  });
  const result = await resubmitVerification(pending.id, {
    ...request,
    name: "Updated Company",
    expectedVersion: 2,
  });
  assert.equal(result.id, pending.id);
  assert.equal(result.taxCode, pending.taxCode);
  assert.equal(result.version, 3);
  assert.equal(result.verificationStatus, "PENDING");
  assert.equal(result.rejectionReason, null);
  assert.equal(getStoredVerificationRecord().name, "Updated Company");
});

test("a stale resubmission cannot overwrite a newer review decision", async () => {
  const pending = await submitVerification(request);
  saveStoredVerificationRecord({ ...pending, verificationStatus: "VERIFIED", version: 4 });
  await assert.rejects(
    resubmitVerification(pending.id, { ...request, expectedVersion: 1 }),
    /CONCURRENT_MODIFICATION/,
  );
  assert.equal(getStoredVerificationRecord().verificationStatus, "VERIFIED");
});

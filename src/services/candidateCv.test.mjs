import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { AUTH_SESSION_KEY } from "./auth.ts";
import { ApiError } from "./api.ts";
import {
  listCandidateCvs,
  registerCandidateCv,
  requestCvUploadUrl,
  uploadToCloudinary,
} from "./candidateCv.ts";

const originalFetch = globalThis.fetch;
const originalXhr = globalThis.XMLHttpRequest;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.XMLHttpRequest = originalXhr;
  delete globalThis.localStorage;
});

function session() {
  return {
    removeItem: () => {},
    getItem: (key) =>
      key === AUTH_SESSION_KEY
        ? JSON.stringify({
            accessToken: "candidate-access",
            refreshToken: "refresh",
            expiresAt: Date.now() + 60000,
          })
        : null,
  };
}

test("upload signatures retain authenticated access mode and register it on CV rows", async () => {
  globalThis.localStorage = session();
  globalThis.fetch = async (url, init) => {
    assert.equal(init.headers.Authorization, "Bearer candidate-access");
    if (url.endsWith("/candidate/cvs/upload-url")) {
      assert.equal(init.method, "POST");
      return Response.json({
        status: 200,
        data: {
          url: "https://api.cloudinary.com/v1_1/demo/image/upload",
          apiKey: "key",
          timestamp: "1700000000",
          signature: "signature",
          publicId: "guardwork/cv-1",
          accessMode: "authenticated",
        },
      });
    }
    if (url.endsWith("/candidate/cvs")) {
      return Response.json({
        status: 200,
        data: {
          id: "cv-1",
          candidateId: "candidate-1",
          fileName: "resume.pdf",
          fileSize: 2048,
          contentType: "application/pdf",
          publicId: "guardwork/cv-1",
          accessMode: "authenticated",
          isDefault: true,
          createdAt: "2026-11-01T00:00:00Z",
          updatedAt: "2026-11-01T00:00:00Z",
        },
      });
    }
    if (url.endsWith("/candidate/cvs")) {
      return Response.json({ status: 200, data: [] });
    }
    throw new Error(`Unexpected request ${url}`);
  };

  const signature = await requestCvUploadUrl();
  assert.equal(signature.accessMode, "authenticated");

  const cv = await registerCandidateCv("resume.pdf", signature.publicId);
  assert.equal(cv.accessMode, "authenticated");
  assert.equal(cv.isDefault, true);
});

test("Cloudinary upload forwards access_mode for new authenticated assets", async () => {
  let opened;
  let sent;
  globalThis.XMLHttpRequest = class {
    upload = {};
    status = 200;
    responseText = JSON.stringify({ public_id: "guardwork/cv-1" });
    open(method, url) {
      opened = { method, url };
    }
    send(form) {
      sent = form;
      this.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 });
      this.onload();
    }
  };

  const progress = [];
  const result = await uploadToCloudinary(
    new File(["pdf"], "resume.pdf", { type: "application/pdf" }),
    {
      url: "https://api.cloudinary.com/v1_1/demo/image/upload",
      apiKey: "key",
      timestamp: "1700000000",
      signature: "signature",
      publicId: "guardwork/cv-1",
      accessMode: "authenticated",
    },
    (percent) => progress.push(percent),
  );

  assert.deepEqual(opened, {
    method: "POST",
    url: "https://api.cloudinary.com/v1_1/demo/image/upload",
  });
  assert.equal(sent.get("access_mode"), "authenticated");
  assert.deepEqual(progress, [50]);
  assert.equal(result.public_id, "guardwork/cv-1");
});

test("legacy CV rows without access mode expose an empty value", async () => {
  globalThis.localStorage = session();
  globalThis.fetch = async () =>
    Response.json({
      status: 200,
      data: [
        {
          id: "cv-1",
          fileName: "resume.pdf",
          publicId: "guardwork/cv-1",
        },
      ],
    });
  const [cv] = await listCandidateCvs();
  assert.equal(cv.accessMode, "");
});

test("malformed upload signatures are rejected", async () => {
  globalThis.localStorage = session();
  globalThis.fetch = async () => Response.json({ status: 200, data: { publicId: "x" } });
  await assert.rejects(requestCvUploadUrl(), ApiError);
});

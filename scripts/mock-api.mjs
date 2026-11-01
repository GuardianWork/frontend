import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

export const MOCK_PASSWORD = "Guardian123!";
export const MOCK_ACCOUNTS = [
  {
    id: 1,
    username: "candidate_demo",
    email: "candidate@example.test",
    firstName: "An",
    lastName: "Nguyễn",
    role: "USER",
    phone: "+84987654321",
  },
  {
    id: 2,
    username: "recruiter_demo",
    email: "recruiter@example.test",
    firstName: "Linh",
    lastName: "Trần",
    role: "USER",
  },
  {
    id: 3,
    username: "owner_demo",
    email: "owner@example.test",
    firstName: "Minh",
    lastName: "Lê",
    role: "USER",
  },
  {
    id: 4,
    username: "admin_demo",
    email: "admin@example.test",
    firstName: "Quản trị",
    lastName: "Nguyễn",
    role: "STAFF",
  },
];

/** In-memory fixtures, available only through npm run dev:mock. */
export function createMockApiServer() {
  const users = MOCK_ACCOUNTS.map((user) => ({
    ...user,
    emailVerified: true,
    password: MOCK_PASSWORD,
  }));
  const candidateProfiles = new Map();
  const candidateCvs = new Map();
  const seededSkills = ["Go", "Kubernetes", "TypeScript", "React / Next.js"];
  const seededExperience = [
    {
      role: "Senior Tech Lead & Systems Engineer",
      company: "GuardianWork VN • TP. Hồ Chí Minh",
      startDate: "2023-01",
      endDate: null,
      description: "Dẫn dắt kiến trúc và phát triển sản phẩm web.",
    },
    {
      role: "Lead Frontend Systems Architect",
      company: "Apex Cloud Services • Remote APAC",
      startDate: "2020-01",
      endDate: "2023-01",
      description: "Thiết kế hệ thống giao diện và cải thiện hiệu năng ứng dụng.",
    },
  ];
  const seededEducation = [
    {
      degree: "Cử nhân Khoa học Máy tính",
      institution: "Đại học Quốc gia TP.HCM",
      startYear: "2017-09",
      endYear: "2021-06",
      description: null,
    },
  ];
  const accountProofs = new Map();
  const stateOf = (user) => user.selfServiceState || "ACTIVE";
  function revokeSessions(user) {
    for (const [key, value] of accessTokens) if (value.userId === user.id) accessTokens.delete(key);
    for (const [key, value] of refreshTokens) if (value === user.id) refreshTokens.delete(key);
    for (const [key] of accountProofs) if (key.startsWith(`${user.id}:`)) accountProofs.delete(key);
  }
  function closureBlockers(user) {
    return [
      ...(!user.emailVerified ? ["EMAIL_VERIFICATION_REQUIRED"] : []),
      ...(membership(user)
        ? [
            membership(user).companyRole === "OWNER"
              ? "COMPANY_OWNERSHIP_EXISTS"
              : "ACTIVE_COMPANY_MEMBERSHIP_EXISTS",
          ]
        : []),
    ];
  }
  function accountDto(user) {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      phoneNumber: user.phone || null,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      selfServiceState: stateOf(user),
      closureEligible: closureBlockers(user).length === 0,
      closureBlockers: closureBlockers(user),
    };
  }
  function updateIdentity(user, body) {
    if (
      typeof body.firstName !== "string" ||
      typeof body.lastName !== "string" ||
      !body.firstName.trim() ||
      !body.lastName.trim() ||
      body.firstName.trim().length > 100 ||
      body.lastName.trim().length > 100 ||
      body.phoneNumber === "" ||
      (body.phoneNumber != null && typeof body.phoneNumber !== "string")
    )
      return [400, "40001 INVALID_IDENTITY"];
    const phone = body.phoneNumber?.trim().replace(/^0/, "+84") || null;
    if (phone && !/^\+84\d{9}$/.test(phone)) return [400, "40001 INVALID_PHONE"];
    if (phone && users.some((other) => other.id !== user.id && other.phone === phone))
      return [409, "40930 PHONE_UNAVAILABLE"];
    Object.assign(user, {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      phone,
    });
    return null;
  }
  const accessTokens = new Map();
  const refreshTokens = new Map();
  const companies = [
    {
      id: 101,
      ownerId: 3,
      name: "Công ty TNHH Giải Pháp Alpha",
      taxCode: "0101234567",
      email: "contact@alpha.example.test",
      registrationCertificateUrl: "http://localhost:5137/api/mock/certificate.pdf",
      verificationStatus: "PENDING",
      rejectionReason: null,
      version: 0,
      createdAt: "2026-10-19T02:00:00Z",
      updatedAt: "2026-10-19T02:00:00Z",
      verifiedAt: null,
      verifiedBy: null,
    },
  ];
  function userDto(user) {
    const { password, emailVerified, phone, ...dto } = user;
    return dto;
  }
  function membership(user) {
    const company = companies.find((company) => company.ownerId === user.id);
    return company
      ? {
          companyId: company.id,
          companyName: company.name,
          companyRole: "OWNER",
          joinedAt: company.createdAt,
        }
      : null;
  }
  function tokenPair(user) {
    const accessToken = `mock-access-${randomUUID()}`;
    const refreshToken = `mock-refresh-${randomUUID()}`;
    accessTokens.set(accessToken, { userId: user.id, expiresAt: Date.now() + 900000 });
    refreshTokens.set(refreshToken, user.id);
    return { accessToken, refreshToken, tokenType: "Bearer", expiresIn: 900, user: userDto(user) };
  }
  return createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname.replace(/^\/api\/staff\/companies(?=\/|$)/, "/api/admin/companies");
    const send = (status, message, data = null) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify({ status, message, data }));
    };
    if (req.method === "GET" && path === "/api/mock/certificate.pdf") {
      const stream = "BT /F1 16 Tf 50 760 Td (GUARDIANWORK - MOCK DOCUMENT ONLY) Tj ET";
      const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
      ];
      let pdf = "%PDF-1.4\n";
      const offsets = [0];
      for (const [index, object] of objects.entries()) {
        offsets.push(Buffer.byteLength(pdf));
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
      }
      const start = Buffer.byteLength(pdf);
      pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
        .slice(1)
        .map((offset) => `${String(offset).padStart(10, "0")} 00000 n `)
        .join("\n")}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
      res.writeHead(200, { "Content-Type": "application/pdf" });
      res.end(pdf);
      return;
    }
    let body = {};
    try {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 11 * 1024 * 1024) {
          send(413, "Request too large");
          return;
        }
      }
      if (raw && req.headers["content-type"]?.startsWith("multipart/form-data")) {
        const form = await new Response(raw, {
          headers: { "Content-Type": req.headers["content-type"] },
        }).formData();
        if (form.has("dossier")) {
          try {
            body = JSON.parse(await form.get("dossier").text());
          } catch {
            body = {};
          }
        } else {
          body = {};
        }
        for (const [key, value] of form.entries()) {
          if (key !== "dossier" && key !== "file") body[key] = value;
        }
        if (form.has("file")) body.file = form.get("file");
      } else if (raw) body = JSON.parse(raw);
    } catch {
      send(400, "Invalid JSON");
      return;
    }
    if (path === "/api/employer-registrations" || path.startsWith("/api/me/employer-onboarding")) {
      send(410, "41030 ONBOARDING_RETIRED: Use shared registration and Company setup.");
      return;
    }
    if (req.method === "POST" && path === "/api/auth/register") {
      if (
        typeof body.username !== "string" ||
        !/^[A-Za-z0-9_]{3,50}$/.test(body.username) ||
        typeof body.password !== "string" ||
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(body.password) ||
        typeof body.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ||
        !body.firstName?.trim() ||
        !body.lastName?.trim()
      ) {
        send(400, "Thông tin đăng ký không hợp lệ.");
        return;
      }
      if (
        users.some(
          (user) =>
            user.username.toLowerCase() === body.username.toLowerCase() ||
            user.email === body.email.toLowerCase(),
        )
      ) {
        send(409, "Email hoặc tên đăng nhập đã được sử dụng.");
        return;
      }
      const user = {
        id: users.length + 1,
        firstName: body.firstName,
        lastName: body.lastName,
        username: body.username,
        email: body.email.toLowerCase(),
        password: body.password,
        role: "USER",
        emailVerified: false,
      };
      users.push(user);
      send(201, "User registered successfully", userDto(user));
      return;
    }
    if (req.method === "POST" && path === "/api/auth/login") {
      const user = users.find(
        (user) =>
          [user.username.toLowerCase(), user.email].includes(
            String(body.usernameOrEmail).toLowerCase(),
          ) && user.password === body.password,
      );
      if (!user) {
        send(401, "Invalid credentials");
        return;
      }
      if (stateOf(user) !== "ACTIVE" || user.banned) {
        send(403, "40304 ACCOUNT_SUSPENDED");
        return;
      }
      send(200, "Login successful", tokenPair(user));
      return;
    }
    if (req.method === "POST" && path === "/api/auth/refresh") {
      const user = users.find((user) => user.id === refreshTokens.get(body.refreshToken));
      if (!user) {
        send(401, "Refresh token expired or revoked");
        return;
      }
      refreshTokens.delete(body.refreshToken);
      send(200, "Token refreshed successfully", tokenPair(user));
      return;
    }
    if (req.method === "POST" && path === "/api/auth/logout") {
      refreshTokens.delete(body.refreshToken);
      send(200, "Logged out successfully");
      return;
    }
    if (req.method === "POST" && path.startsWith("/api/auth/account-recovery/")) {
      const recoveryUser = users.find(
        (user) =>
          [user.username.toLowerCase(), user.email].includes(
            String(body.usernameOrEmail).trim().toLowerCase(),
          ) && user.password === body.password,
      );
      if (!recoveryUser) {
        send(401, "40101 INVALID_CREDENTIALS");
        return;
      }
      if (recoveryUser.role !== "USER") {
        send(403, "40300 SELF_SERVICE_EXCLUDED");
        return;
      }
      const expected =
        body.action === "REACTIVATE"
          ? "DEACTIVATED"
          : body.action === "CANCEL_DELETION"
            ? "DELETION_PENDING"
            : null;
      if (recoveryUser.banned) {
        send(403, "40304 ACCOUNT_SUSPENDED");
        return;
      }
      if (!expected || stateOf(recoveryUser) !== expected) {
        send(409, "40995 LIFECYCLE_MISMATCH");
        return;
      }
      const key = `${recoveryUser.id}:${body.action}`;
      if (path.endsWith("/request-code")) {
        const previous = accountProofs.get(key);
        if (previous && Date.now() < previous.nextAt) {
          res.setHeader("Retry-After", "60");
          send(429, "42994 CODE_COOLDOWN");
          return;
        }
        const proof = { nextAt: Date.now() + 60000, expiresAt: Date.now() + 600000, attempts: 0 };
        accountProofs.set(key, proof);
        send(200, "Mock email delivery accepted", {
          deliveryAccepted: true,
          nextRequestAt: new Date(proof.nextAt).toISOString(),
          expiresAt: new Date(proof.expiresAt).toISOString(),
        });
        return;
      }
      if (path.endsWith("/confirm")) {
        if (body.acknowledgeConsequences !== true) {
          send(400, "40001 ACKNOWLEDGEMENT_REQUIRED");
          return;
        }
        const proof = accountProofs.get(key);
        if (
          !proof ||
          proof.expiresAt <= Date.now() ||
          proof.attempts++ >= 5 ||
          body.emailSecret !== "012345"
        ) {
          send(400, "40094 INVALID_LIFECYCLE_PROOF");
          return;
        }
        recoveryUser.selfServiceState = "ACTIVE";
        revokeSessions(recoveryUser);
        send(200, "Recovered; sign in normally", { selfServiceState: "ACTIVE" });
        return;
      }
    }
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    const session = accessTokens.get(token);
    const user =
      session && session.expiresAt > Date.now() && users.find((user) => user.id === session.userId);
    if (!user || stateOf(user) !== "ACTIVE") {
      send(401, "Vui lòng đăng nhập để tiếp tục.");
      return;
    }
    if (req.method === "GET" && path === "/api/auth/me") {
      send(200, "Current user retrieved successfully", {
        ...userDto(user),
        activeMembership: membership(user),
        emailVerified: user.emailVerified,
        recruitingEmailEligible: user.emailVerified,
      });
      return;
    }
    if (
      path === "/api/me/account" ||
      path.startsWith("/api/me/account/") ||
      path.startsWith("/api/me/email-verification/") ||
      path === "/api/auth/change-password"
    ) {
      if (user.role !== "USER") {
        send(403, "40300 SELF_SERVICE_EXCLUDED");
        return;
      }
    }
    if (path === "/api/me/account" && req.method === "GET") {
      send(200, "Current account", accountDto(user));
      return;
    }
    if (path === "/api/me/account" && req.method === "PUT") {
      if (
        Object.keys(body).some((key) => !["firstName", "lastName", "phoneNumber"].includes(key))
      ) {
        send(400, "40001 UNSUPPORTED_FIELD");
        return;
      }
      const invalid = updateIdentity(user, body);
      if (invalid) {
        send(...invalid);
        return;
      }
      send(200, "Updated account", accountDto(user));
      return;
    }
    if (req.method === "PUT" && path === "/api/auth/change-password") {
      if (!user.emailVerified) {
        send(403, "40335 EMAIL_VERIFICATION_REQUIRED");
        return;
      }
      if (body.currentPassword !== user.password) {
        send(400, "40001 INVALID_CURRENT_PASSWORD");
        return;
      }
      if (
        typeof body.newPassword !== "string" ||
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(body.newPassword)
      ) {
        send(400, "40002 PASSWORD_POLICY");
        return;
      }
      user.password = body.newPassword;
      revokeSessions(user);
      send(200, "Password changed");
      return;
    }
    const closure = /^\/api\/me\/account\/(deactivation|deletion)\/(request-code|confirm)$/.exec(
      path,
    );
    if (req.method === "POST" && closure) {
      const blockers = closureBlockers(user);
      if (blockers.length) {
        const code = blockers.includes("EMAIL_VERIFICATION_REQUIRED")
          ? [403, "40335 EMAIL_VERIFICATION_REQUIRED"]
          : blockers.includes("COMPANY_OWNERSHIP_EXISTS")
            ? [409, "40994 COMPANY_OWNERSHIP_EXISTS"]
            : [409, "40910 ACTIVE_COMPANY_MEMBERSHIP_EXISTS"];
        send(...code);
        return;
      }
      if (body.currentPassword !== user.password) {
        send(400, "40001 INVALID_CURRENT_PASSWORD");
        return;
      }
      const key = `${user.id}:${closure[1]}`;
      if (closure[2] === "request-code") {
        const previous = accountProofs.get(key);
        if (previous && Date.now() < previous.nextAt) {
          res.setHeader("Retry-After", "60");
          send(429, "42994 CODE_COOLDOWN");
          return;
        }
        const proof = { nextAt: Date.now() + 60000, expiresAt: Date.now() + 600000, attempts: 0 };
        accountProofs.set(key, proof);
        send(200, "Mock email delivery accepted", {
          deliveryAccepted: true,
          nextRequestAt: new Date(proof.nextAt).toISOString(),
          expiresAt: new Date(proof.expiresAt).toISOString(),
        });
        return;
      }
      if (body.acknowledgeConsequences !== true) {
        send(400, "40001 ACKNOWLEDGEMENT_REQUIRED");
        return;
      }
      const proof = accountProofs.get(key);
      if (
        !proof ||
        proof.expiresAt <= Date.now() ||
        proof.attempts++ >= 5 ||
        body.emailSecret !== "012345"
      ) {
        send(400, "40094 INVALID_LIFECYCLE_PROOF");
        return;
      }
      user.selfServiceState = closure[1] === "deactivation" ? "DEACTIVATED" : "DELETION_PENDING";
      revokeSessions(user);
      send(200, "Account state changed", { selfServiceState: stateOf(user) });
      return;
    }
    if (req.method === "POST" && path === "/api/me/email-verification/request") {
      send(200, "Mock delivery unavailable", {
        deliveryAccepted: false,
        alreadyVerified: user.emailVerified,
        nextRequestAt: new Date(Date.now() + 60000).toISOString(),
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      });
      return;
    }
    if (req.method === "POST" && path === "/api/me/email-verification/confirm") {
      if (body.emailSecret !== "012345") {
        send(400, "40030 INVALID_EMAIL_PROOF");
        return;
      }
      user.emailVerified = true;
      send(200, "Email verified", { emailVerified: true });
      return;
    }
    if (path === "/api/v1/candidates/profile" && ["GET", "PUT"].includes(req.method)) {
      const previous = candidateProfiles.get(user.id) || {
        id: randomUUID(),
        userId: user.id,
        email: user.email,
        fullName: `${user.lastName} ${user.firstName}`.trim() || "Nguyễn An",
        avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Nguyen Van An (Alex)",
        phoneNumber: user.phone || null,
        skills: seededSkills,
        experience: seededExperience,
        education: seededEducation,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (req.method === "PUT") {
        if ("fullName" in body) {
          send(400, "40001 FULL_NAME_READ_ONLY");
          return;
        }
        const invalid = updateIdentity(user, body);
        if (invalid) {
          send(...invalid);
          return;
        }
        Object.assign(previous, {
          avatarUrl: body.avatarUrl,
          skills: body.skills,
          experienceSummary: body.experienceSummary,
          educationSummary: body.educationSummary,
          isPublic: body.isPublic,
        });
        candidateProfiles.set(user.id, previous);
      }
      candidateProfiles.set(user.id, previous);
      send(200, "Candidate profile", {
        ...previous,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        phoneNumber: user.phone || null,
      });
      return;
    }

    const cvMatch = /^\/api\/v1\/candidate\/cvs\/([^/]+)\/download-url$/.exec(path);
    if (req.method === "GET" && path === "/api/candidate/cvs") {
      const profile = candidateProfiles.get(user.id) || {
        id: randomUUID(),
        userId: user.id,
        email: user.email,
        fullName: `${user.lastName} ${user.firstName}`.trim(),
        avatarUrl: null,
        phoneNumber: user.phone || null,
        skills: [],
        experience: [],
        education: [],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      candidateProfiles.set(user.id, profile);
      const cvs = candidateCvs.get(user.id) || [];
      send(200, "CVs", cvs);
      return;
    }

    if (req.method === "POST" && path === "/api/candidate/cvs/upload-url") {
      const profile = candidateProfiles.get(user.id) || {
        id: randomUUID(),
        userId: user.id,
        email: user.email,
        fullName: `${user.lastName} ${user.firstName}`.trim(),
        avatarUrl: null,
        phoneNumber: user.phone || null,
        skills: [],
        experience: [],
        education: [],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      candidateProfiles.set(user.id, profile);
      const cvs = candidateCvs.get(user.id) || [];
      if (cvs.length >= 5) {
        send(400, "40022 CV quota exceeded");
        return;
      }
      if (!body.consentGiven) {
        send(400, "40020 Consent required");
        return;
      }
      const publicId = `candidates/${profile.id}/cvs/${randomUUID()}`;
      send(200, "Upload URL", {
        url: "/api/mock/cloudinary-upload",
        apiKey: "mock-api-key",
        timestamp: "1234567890",
        signature: "mock-signature",
        publicId,
      });
      return;
    }

    if (req.method === "POST" && path === "/api/mock/cloudinary-upload") {
      const file = body.file;
      if (!file) {
        send(400, "40021 Invalid CV file");
        return;
      }
      const publicId = body.public_id || body.publicId;
      if (!publicId) {
        send(400, "40021 Missing public id");
        return;
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const fileName = file.name || "upload.bin";
      const extension = fileName.split(".").pop()?.toLowerCase() || "pdf";
      const contentTypes = {
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
      const contentType =
        file.type && contentTypes[extension] === file.type
          ? file.type
          : contentTypes[extension] || "application/octet-stream";
      cvAssets.set(publicId, {
        publicId,
        fileName,
        bytes,
        size: file.size || bytes.length,
        contentType,
        extension,
      });
      send(200, "uploaded", { public_id: publicId, bytes: file.size || bytes.length });
      return;
    }

    if (req.method === "POST" && path === "/api/candidate/cvs") {
      const profile = candidateProfiles.get(user.id);
      if (!profile) {
        send(404, "40401 Not found");
        return;
      }
      if (!body.fileName || !body.publicId) {
        send(400, "40000 Validation failed");
        return;
      }
      const asset = cvAssets.get(body.publicId);
      if (!asset) {
        send(400, "40023 Cannot verify uploaded file");
        return;
      }
      const expectedFolder = `candidates/${profile.id}/cvs/`;
      if (!body.publicId.startsWith(expectedFolder)) {
        send(400, "40023 Cannot verify uploaded file");
        return;
      }
      const cvs = candidateCvs.get(user.id) || [];
      if (cvs.length >= 5) {
        send(400, "40022 CV quota exceeded");
        return;
      }
      if (cvs.some((cv) => cv.publicId === body.publicId)) {
        send(409, "40902 CV already registered");
        return;
      }
      const format = body.fileName.split(".").pop()?.toLowerCase();
      const contentTypes = {
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
      if (!contentTypes[format]) {
        send(400, "40021 Invalid CV file");
        return;
      }
      const cv = {
        id: randomUUID(),
        candidateId: profile.id,
        fileName: body.fileName,
        fileSize: asset.size,
        contentType: asset.contentType || contentTypes[format],
        publicId: body.publicId,
        isDefault: cvs.length === 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      cvs.unshift(cv);
      candidateCvs.set(user.id, cvs);
      send(201, "CV uploaded successfully", cv);
      return;
    }

    if (req.method === "GET" && cvMatch) {
      const profile = candidateProfiles.get(user.id);
      if (!profile) {
        send(404, "40401 Not found");
        return;
      }
      const cvs = candidateCvs.get(user.id) || [];
      const cv = cvs.find((item) => item.id === cvMatch[1]);
      if (!cv) {
        send(404, "40405 CV not found");
        return;
      }
      const url = `/api/mock/cloudinary-download?publicId=${encodeURIComponent(cv.publicId)}`;
      send(200, "Download URL", {
        url,
        apiKey: null,
        timestamp: null,
        signature: null,
        publicId: cv.publicId,
      });
      return;
    }

    if (req.method === "GET" && path === "/api/mock/cloudinary-download") {
      const publicId = url.searchParams.get("publicId");
      const asset = cvAssets.get(publicId);
      if (!asset) {
        send(404, "File not found");
        return;
      }
      res.writeHead(200, { "Content-Type": asset.contentType });
      res.end(asset.bytes);
      return;
    }

    if (req.method === "POST" && path === "/api/companies/verification-request") {
      if (!body.file) {
        send(410, "41030 ONBOARDING_RETIRED");
        return;
      }
      if (!user.emailVerified) {
        send(403, "40335 EMAIL_VERIFICATION_REQUIRED");
        return;
      }
      if (membership(user)) {
        send(409, "Tài khoản đã là thành viên công ty.");
        return;
      }
      if (
        !body.name?.trim() ||
        !body.taxCode?.trim() ||
        !body.legal?.workAddress?.trim() ||
        !body.legal?.submitterPosition?.trim() ||
        !body.legal?.declarationAccepted ||
        !body.file?.size
      ) {
        send(400, "Thông tin công ty chưa hợp lệ.");
        return;
      }
      if (companies.some((company) => company.taxCode === body.taxCode)) {
        send(409, "Mã số thuế hoặc email công ty đã được đăng ký.");
        return;
      }
      const now = new Date().toISOString();
      const company = {
        id: Math.max(100, ...companies.map((company) => company.id)) + 1,
        ownerId: user.id,
        name: body.name,
        taxCode: body.taxCode,
        email: user.email,
        registrationCertificateUrl: "http://localhost:5137/api/mock/certificate.pdf",
        verificationStatus: "PENDING",
        rejectionReason: null,
        version: 0,
        createdAt: now,
        updatedAt: now,
        verifiedAt: null,
        verifiedBy: null,
      };
      companies.push(company);
      send(201, "Company submitted for verification", company);
      return;
    }
    if (req.method === "GET" && path === "/api/admin/companies/verifications") {
      if (user.role !== "STAFF") {
        send(403, "Admin required");
        return;
      }
      const status = url.searchParams.get("status") || "PENDING";
      const content = companies
        .filter((company) => status === "ALL" || company.verificationStatus === status)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
      const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("size")) || 20));
      const pageNumber = Math.max(0, Number(url.searchParams.get("page")) || 0);
      const totalPages = Math.ceil(content.length / pageSize);
      send(200, "ok", {
        content: content.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize),
        pageNumber,
        pageSize,
        totalElements: content.length,
        totalPages,
        first: pageNumber === 0,
        last: pageNumber >= totalPages - 1,
      });
      return;
    }
    const historyMatch = /^\/api\/admin\/companies\/(\d+)\/verification-history$/.exec(path);
    if (req.method === "GET" && historyMatch) {
      if (user.role !== "STAFF") {
        send(403, "Staff required");
        return;
      }
      if (!companies.some((company) => company.id === Number(historyMatch[1]))) {
        send(404, "COMPANY_NOT_FOUND");
        return;
      }
      send(200, "ok", []);
      return;
    }
    const adminDecision = /^\/api\/admin\/companies\/(\d+)\/(verify|reject)$/.exec(path);
    if (req.method === "PUT" && adminDecision) {
      if (user.role !== "STAFF") {
        send(403, "Admin required");
        return;
      }
      const company = companies.find((company) => company.id === Number(adminDecision[1]));
      if (!company) {
        send(404, "Company not found");
        return;
      }
      if (company.version !== body.expectedVersion || company.verificationStatus !== "PENDING") {
        send(409, "CONCURRENT_MODIFICATION");
        return;
      }
      if (
        (adminDecision[2] === "reject" || body.status === "REJECTED") &&
        (typeof body.rejectionReason !== "string" ||
          body.rejectionReason.trim().length < 10 ||
          body.rejectionReason.trim().length > 1000)
      ) {
        send(400, "INVALID_REJECTION_REASON");
        return;
      }
      Object.assign(company, {
        verificationStatus:
          adminDecision[2] === "reject" || body.status === "REJECTED" ? "REJECTED" : "VERIFIED",
        rejectionReason:
          adminDecision[2] === "reject" || body.status === "REJECTED"
            ? body.rejectionReason.trim()
            : null,
        version: company.version + 1,
        verifiedBy: user.id,
        verifiedAt: new Date().toISOString(),
      });
      send(200, "Company reviewed", company);
      return;
    }
    if (req.method === "GET" && path === "/api/companies/me/verification") {
      const company = companies.find((company) => company.ownerId === user.id);
      if (!company) {
        send(404, "Company not found");
        return;
      }
      send(200, "Company verification retrieved successfully", {
        ...company,
        companyId: company.id,
      });
      return;
    }
    const companyRoute = /^\/api\/companies\/(\d+)(\/resubmit)?$/.exec(path);
    if (companyRoute) {
      const company = companies.find((company) => company.id === Number(companyRoute[1]));
      if (!company || company.ownerId !== user.id) {
        send(403, "Company owner required");
        return;
      }
      if (req.method === "GET" && !companyRoute[2]) {
        send(200, "ok", company);
        return;
      }
      if (req.method === "PUT" && companyRoute[2]) {
        if (!body.file) {
          send(410, "41030 ONBOARDING_RETIRED");
          return;
        }
        if (!user.emailVerified) {
          send(403, "40335 EMAIL_VERIFICATION_REQUIRED");
          return;
        }
        if (company.verificationStatus !== "REJECTED" || company.version !== body.expectedVersion) {
          send(409, "CONCURRENT_MODIFICATION");
          return;
        }
        Object.assign(company, {
          name: body.name,
          email: user.email,
          verificationStatus: "PENDING",
          rejectionReason: null,
          version: company.version + 1,
        });
        send(200, "Company resubmitted", { ...company, companyId: company.id });
        return;
      }
    }
    send(404, "API mock chưa hỗ trợ đường dẫn này.");
  });
}

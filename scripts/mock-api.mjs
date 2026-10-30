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
    const { password, ...dto } = user;
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
        body = JSON.parse(await form.get("dossier").text());
        body.file = form.get("file");
      } else if (raw) body = JSON.parse(raw);
    } catch {
      send(400, "Invalid JSON");
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
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    const session = accessTokens.get(token);
    const user =
      session && session.expiresAt > Date.now() && users.find((user) => user.id === session.userId);
    if (!user) {
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
    if (req.method === "POST" && path === "/api/me/email-verification/request") {
      send(200, "Mock delivery unavailable", {
        deliveryAccepted: false,
        alreadyVerified: user.emailVerified,
        nextRequestAt: new Date(Date.now() + 60000).toISOString(),
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      });
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
      const status = url.searchParams.get("status");
      const content = companies.filter(
        (company) => !status || status === "ALL" || company.verificationStatus === status,
      );
      const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("size")) || 10));
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
        adminDecision[2] === "reject" &&
        (typeof body.rejectionReason !== "string" ||
          body.rejectionReason.trim().length < 10 ||
          body.rejectionReason.trim().length > 1000)
      ) {
        send(400, "INVALID_REJECTION_REASON");
        return;
      }
      Object.assign(company, {
        verificationStatus: adminDecision[2] === "verify" ? "VERIFIED" : "REJECTED",
        rejectionReason: adminDecision[2] === "reject" ? body.rejectionReason.trim() : null,
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

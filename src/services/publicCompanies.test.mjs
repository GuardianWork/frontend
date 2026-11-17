import assert from "node:assert/strict";
import { test } from "node:test";
import { cityOnly, findPublicCompanyInfo } from "./publicCompanies.ts";

function mockFetch(body, status = 200) {
  globalThis.fetch = async () =>
    Response.json(
      { status, message: status >= 400 ? "Không tìm thấy" : "Success", data: body },
      { status },
    );
}

function dossier(profile) {
  return {
    id: 7,
    name: "GuardianWork Demo",
    summary: {
      roleCount: 0,
      locations: [],
      industries: [],
      employmentTypes: [],
      workArrangements: [],
      salaryBands: [],
      disclosedSalaryCount: 0,
      headcountTotal: 0,
      deadlines: [],
    },
    ...(profile === undefined ? {} : { profile }),
  };
}

test("dossier maps the recruiter-authored profile payload", async () => {
  const originalFetch = globalThis.fetch;
  try {
    mockFetch(
      dossier({
        schemaVersion: 1,
        industry: "  Fintech  ",
        introduction: "  Chúng tôi xây dựng hạ tầng thanh toán.\nHai dòng.  ",
        workAddress: " Tầng 12, Quận 1, TP.HCM ",
        workingHours: "Thứ 2 - Thứ 6, 08:30 - 17:30",
        companyScale: { employeeRange: "51-200" },
        expertise: [" Cloud ", "cloud", "Payments", "", "x".repeat(60)],
      }),
    );
    const info = await findPublicCompanyInfo(7);
    assert.deepEqual(info.profile, {
      schemaVersion: 1,
      industry: "Fintech",
      introduction: "Chúng tôi xây dựng hạ tầng thanh toán.\nHai dòng.",
      workAddress: "Tầng 12, Quận 1, TP.HCM",
      workingHours: "Thứ 2 - Thứ 6, 08:30 - 17:30",
      companyScale: { employeeRange: "51-200" },
      expertise: ["Cloud", "Payments"],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("dossier without a profile yields null profile and posts the old shape", async () => {
  const originalFetch = globalThis.fetch;
  try {
    mockFetch(dossier(undefined));
    const info = await findPublicCompanyInfo(7);
    assert.equal(info.profile, null);
    assert.equal(info.name, "GuardianWork Demo");
    assert.equal(info.summary.roleCount, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("whitespace-only or empty profile payload collapses to null", async () => {
  const originalFetch = globalThis.fetch;
  try {
    mockFetch(
      dossier({
        schemaVersion: 1,
        industry: "   ",
        introduction: "",
        workAddress: " ",
        workingHours: null,
        expertise: ["", "   "],
      }),
    );
    const info = await findPublicCompanyInfo(7);
    assert.equal(info.profile, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("malformed profile entries are dropped item by item, not the whole payload", async () => {
  const originalFetch = globalThis.fetch;
  try {
    mockFetch(
      dossier({
        schemaVersion: "1",
        industry: 42,
        introduction: "Giữ lại chúng tôi.",
        expertise: "not-an-array",
        companyScale: { employeeRange: "" },
      }),
    );
    const info = await findPublicCompanyInfo(7);
    assert.equal(info.profile.schemaVersion, null);
    assert.equal(info.profile.industry, null);
    assert.equal(info.profile.introduction, "Giữ lại chúng tôi.");
    assert.deepEqual(info.profile.expertise, []);
    assert.equal(info.profile.companyScale, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("404 still maps to null for unknown or non-listable companies", async () => {
  const originalFetch = globalThis.fetch;
  try {
    mockFetch(null, 404);
    const info = await findPublicCompanyInfo(999_999_999);
    assert.equal(info, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("cityOnly keeps only the trailing city or province segment", () => {
  assert.equal(cityOnly("Tòa nhà Bitexco, tầng 18, Quận 1, TP. Hồ Chí Minh"), "TP. Hồ Chí Minh");
  assert.equal(cityOnly("Hà Nội"), "Hà Nội");
  assert.equal(cityOnly("Số 9 đường Láng, Cầu Giấy, Hà Nội, Việt Nam"), "Hà Nội");
  assert.equal(cityOnly("D7, KĐT Phú Mỹ Hưng, Quận 7, TP. Hồ Chí Minh, VN"), "TP. Hồ Chí Minh");
  assert.equal(cityOnly("Khu công nghiệp Amata, Bình Dương, Vietnam"), "Bình Dương");
  assert.equal(cityOnly("123 Đồng Khởi"), "123 Đồng Khởi");
});

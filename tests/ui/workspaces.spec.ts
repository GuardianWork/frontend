import { test, expect, login, auditInputs } from "./fixtures";

test("guests can search and read job listings without an account", async ({ page }) => {
  await page.goto("/vn", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Chuyển sang tiếng Anh" }).click();
  await expect(page.getByRole("button", { name: "Switch to Vietnamese" })).toBeVisible();
  await page.getByRole("button", { name: "Switch to Vietnamese" }).click();
  await page.getByRole("textbox", { name: "Vị trí, kỹ năng hoặc công ty" }).fill("Kế toán");
  await page.getByRole("combobox", { name: "Địa điểm", exact: true }).selectOption("Hồ Chí Minh");
  await page.getByRole("button", { name: "Tìm việc ngay", exact: true }).click();

  // Search stays public: no login wall between the landing page and results.
  await expect(page).toHaveURL(/\/jobs\?/);
  await expect(page.getByRole("heading", { name: "Tìm việc làm", exact: true })).toBeVisible();

  // Guests can open and read a full listing.
  await page.getByRole("link", { name: /Kế toán tổng hợp/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kế toán tổng hợp" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mô tả công việc" })).toBeVisible();

  // Applying still requires an account, and signing in returns to the candidate flow.
  await page.getByRole("link", { name: "Đăng nhập để ứng tuyển" }).click();
  await expect(page.locator("#login-identifier")).toBeEnabled();
});

test("candidate pages accept search and profile edits", async ({ page }, info) => {
  test.setTimeout(60000);
  await login(page, "candidate_demo");
  const report = await auditInputs(page, [
    "/jobs",
    "/candidate/profile",
    "/candidate/copilot",
  ]);
  await page.goto("/candidate/profile", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Chỉnh sửa hồ sơ" }).click();
  const editor = page.getByRole("dialog");
  await editor.getByLabel("Họ tên").fill("Chuyên viên kế toán");
  await editor.getByRole("button", { name: "Lưu thay đổi" }).click();
  const savedDialog = page.getByRole("dialog");
  await expect(savedDialog).toContainText("Thông tin hồ sơ đã được cập nhật.");
  await savedDialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(page.getByText("Chuyên viên kế toán", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page.locator("#login-identifier")).toBeEnabled();
  expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).toBeNull();
  await info.attach("input-audit", {
    body: JSON.stringify(report),
    contentType: "application/json",
  });
});

test("recruiter pages keep pending company data read-only and other searches editable", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await login(page, "owner_demo", true);
  const report = await auditInputs(page, [
    "/recruiter",
    "/recruiter/jobs",
    "/recruiter/applications",
    "/recruiter/talent",
    "/recruiter/members",
    "/recruiter/verification",
  ]);
  await expect(page.locator('[name="companyName"]')).toBeDisabled();
  await expect(
    page.getByText("Hồ sơ đã được gửi và đang chờ xét duyệt.", { exact: true }),
  ).toBeVisible();
  await info.attach("input-audit", {
    body: JSON.stringify(report),
    contentType: "application/json",
  });
});

test("admin pages accept search, filtering, details, and content review", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await login(page, "admin_demo");
  const report = await auditInputs(page, [
    "/admin",
    "/admin/verifications",
    "/admin/reports",
    "/admin/jobs",
    "/admin/accounts",
    "/admin/monitoring",
    "/admin/tasks",
    "/admin/compliance",
  ]);
  await page.goto("/admin/reports", { waitUntil: "domcontentloaded" });
  await page.getByRole("searchbox").fill("không-có-kết-quả");
  await expect(page.getByRole("heading", { name: "Không tìm thấy kết quả" })).toBeVisible();
  await page.getByRole("button", { name: "Xóa từ khóa tìm kiếm" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.locator(".admin-sample-filter select").selectOption("Mới tiếp nhận");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Xem chi tiết" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/admin/compliance", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "JD bị AI gắn cờ", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Xem JD Kế toán công nợ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nội dung JD đã đăng", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Dấu hiệu AI phát hiện", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(4);
  await info.attach("input-audit", {
    body: JSON.stringify(report),
    contentType: "application/json",
  });
});

test("company onboarding sends entered data and retrieves OWNER membership", async ({ page }) => {
  await login(page, "recruiter_demo", true);
  const values = {
    companyName: "Công ty Beta kiểm thử",
    taxCode: "0317654321",
    companyEmail: "beta@example.test",
    registrationCertificateUrl: "https://example.test/company.pdf",
  };
  for (const [name, value] of Object.entries(values)) {
    const input = page.locator(`[name="${name}"]`);
    await expect(input).toBeEnabled();
    await input.fill(value);
  }
  await page.getByRole("button", { name: "Đăng ký công ty", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã đăng ký công ty thành công");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("guardianwork_auth_session") || "null")?.user
            ?.activeMembership?.companyRole,
      ),
    )
    .toBe("OWNER");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[name="companyName"]')).toHaveValue(values.companyName);
  await expect(page.locator('[name="companyName"]')).toBeDisabled();
});

test("registration API failure preserves data and unlocks retry", async ({ page }) => {
  await page.goto("/register", { waitUntil: "domcontentloaded" });
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({ status: 503, body: "Service unavailable" }),
  );
  const values = {
    "register-last-name": "Nguyễn",
    "register-first-name": "An",
    "register-username": "qa_signup",
    "register-email": "signup@example.test",
    "register-password": "Guardian123!",
    "register-confirmation": "Guardian123!",
  };
  for (const [id, value] of Object.entries(values)) await page.locator(`#${id}`).fill(value);
  await page.getByRole("button", { name: "Đăng ký tìm việc", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  for (const [id, value] of Object.entries(values)) {
    await expect(page.locator(`#${id}`)).toHaveValue(value);
    await expect(page.locator(`#${id}`)).toBeEnabled();
  }
  await page.locator("#register-first-name").fill("Bình");
  await expect(page.locator("#register-first-name")).toHaveValue("Bình");
});

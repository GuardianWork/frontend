import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";

test("staff identity and audit logs support search, dates, details, and pagination", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await login(page, "admin_demo");
  const account = page.getByRole("region", { name: "Thông tin staff đang đăng nhập" });
  await expect(account).toContainText("Nguyễn Quản trị");
  await expect(account).toContainText("admin@example.test");
  await expect(account).toContainText("admin_demo");
  await page
    .getByRole("button", { name: "Thông tin tài khoản Nguyễn Quản trị", exact: true })
    .click();
  await expect(page.locator(".staff-account-popover")).toContainText("admin@example.test");
  await page.keyboard.press("Escape");
  await page.goto("/staff/audit-logs", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Audit logs", exact: true })).toBeVisible();
  const pagination = page.getByRole("navigation", { name: "Phân trang audit logs" });
  await expect(page.locator(".audit-table tbody tr")).toHaveCount(10);
  await expect(pagination.getByRole("status")).toHaveText("1–10 / 14 bản ghi");
  await pagination.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.locator(".audit-table tbody tr")).toHaveCount(4);
  await expect(pagination.getByRole("button", { name: "Trang sau", exact: true })).toBeDisabled();
  await page.getByRole("searchbox").fill("nguyen minh anh");
  await expect(page.locator(".audit-table tbody tr")).toHaveCount(5);
  await expect(pagination.getByRole("button", { name: "Trang trước", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Xóa từ khóa tìm kiếm" }).click();
  await page
    .getByRole("combobox", { name: "Hành động", exact: true })
    .selectOption("VERIFY_COMPANY");
  await page.getByLabel("Từ ngày", { exact: true }).fill("2026-10-23");
  await page.getByLabel("Đến ngày", { exact: true }).fill("2026-10-24");
  await expect(page.locator(".audit-table tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Chi tiết AUD-0014", exact: true }).click();
  await expect(page.locator("#detail-AUD-0014")).toContainText("Chờ xác minh");
  await expect(page.locator("#detail-AUD-0014")).toContainText("Đã xác minh");
  await expect(page.locator("#detail-AUD-0014")).toContainText("Giấy tờ");
  await page.getByRole("button", { name: "Chi tiết AUD-0014", exact: true }).click();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(pagination.getByRole("status")).toHaveText("1–10 / 14 bản ghi");
  await page.getByRole("searchbox").fill("khong-co-nhat-ky");
  await expect(page.getByRole("heading", { name: "Không tìm thấy nhật ký" })).toBeVisible();
  await expect(pagination.getByRole("status")).toHaveText("0–0 / 0 bản ghi");
  await page
    .locator(".admin-sample-empty")
    .getByRole("button", { name: "Xóa bộ lọc", exact: true })
    .click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
  await expect(pagination.getByRole("status")).toHaveText("1–10 / 14 bản ghi");
  await page.locator("main").evaluate((main) => main.scrollTo({ top: 0 }));
  await page.screenshot({ path: info.outputPath("audit-logs.png"), animations: "disabled" });
});

test("legacy admin URLs redirect to the API-backed staff review queue", async ({ page }, info) => {
  test.setTimeout(90000);
  await staffJobApi(page);
  await login(page, "admin_demo");
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/staff\/?$/);
  await expect(
    page.getByRole("heading", { name: "Tổng quan Platform staff", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("staff-overview.png"), animations: "disabled" });
  await page.goto("/admin/verifications?status=VERIFIED&page=0", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/staff\/verifications\?status=VERIFIED&page=0$/);
  await expect(page.getByRole("combobox", { name: "Lọc trạng thái hồ sơ" })).toHaveValue(
    "VERIFIED",
  );
  await page.goto("/admin/compliance", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/staff\/jobs$/);
  await expect(page.getByRole("tab")).toHaveCount(0);
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nội dung gửi duyệt", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Dữ liệu minh họa", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
});

test("staff routes reject a signed-in candidate", async ({ page }) => {
  await login(page, "candidate_demo");
  const session = await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"));
  expect(session).not.toBeNull();
  await page.goto(`${process.env.STAFF_UI_BASE_URL || "http://localhost:5138"}/login`, {
    waitUntil: "domcontentloaded",
  });
  await page.evaluate((savedSession) => {
    sessionStorage.setItem("guardianwork_auth_session", savedSession!);
  }, session);
  await page.goto(`${process.env.STAFF_UI_BASE_URL || "http://localhost:5138"}/staff/jobs`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("alert")).toContainText("không có quyền truy cập Platform staff");
  await expect(
    page.getByRole("heading", { name: "Quản lý tin tuyển dụng", exact: true }),
  ).toHaveCount(0);
});

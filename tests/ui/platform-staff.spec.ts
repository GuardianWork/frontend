import { test, expect, login } from "./fixtures";

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

test("one job list opens full JD details with approval, rejection and hiding actions", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await login(page, "admin_demo");
  await page.goto("/staff/jobs", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("tab")).toHaveCount(0);
  const status = page.getByRole("combobox", { name: "Trạng thái", exact: true });
  await status.selectOption("PENDING");
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Xem chi tiết Chuyên viên chăm sóc khách hàng", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Nội dung JD", exact: true })).toBeVisible();
  await expect(
    page.getByText("Chưa có kết quả quét AI cho tin này.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Ẩn tin đã đăng", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Đồng ý đăng tin", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận đồng ý đăng tin", exact: true }).click();
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Đang công khai");
  await page.getByRole("button", { name: "Ẩn tin đã đăng", exact: true }).click();
  await page.getByLabel("Lý do xử lý", { exact: false }).fill("   ");
  await page.getByRole("button", { name: "Xác nhận ẩn tin", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Nhập lý do");
  await page
    .getByLabel("Lý do xử lý", { exact: false })
    .fill("Tạm ẩn để kiểm tra nội dung theo phản hồi.");
  await page.getByRole("button", { name: "Xác nhận ẩn tin", exact: true }).click();
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Đã ẩn");
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await expect(status).toHaveValue("PENDING");
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Xem chi tiết Chuyên viên marketing", exact: true })
    .click();
  await page.getByRole("button", { name: "Từ chối đăng tin", exact: true }).click();
  await page.getByLabel("Lý do từ chối", { exact: false }).fill("   ");
  await page.getByRole("button", { name: "Xác nhận từ chối đăng tin", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Nhập lý do");
  await page
    .getByLabel("Lý do từ chối", { exact: false })
    .fill("Cần bổ sung thông tin về quyền lợi và thời gian làm việc.");
  await page.screenshot({ path: info.outputPath("reject-job.png"), animations: "disabled" });
  await page.getByRole("button", { name: "Xác nhận từ chối đăng tin", exact: true }).click();
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Đã từ chối");
  await expect(page.locator(".compliance-history")).toContainText(
    "Cần bổ sung thông tin về quyền lợi và thời gian làm việc.",
  );
  await expect(page.getByRole("button", { name: "Đồng ý đăng tin", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await status.selectOption("REJECTED");
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(2);
  await page.locator("main").evaluate((main) => main.scrollTo({ top: 0 }));
  await page.screenshot({ path: info.outputPath("staff-jobs.png"), animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
});

test("legacy admin URLs redirect to staff and AI evidence has high contrast", async ({
  page,
}, info) => {
  test.setTimeout(90000);
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
  await page.getByRole("button", { name: "Xem chi tiết Kế toán công nợ", exact: true }).click();
  const highlights = page.locator(".compliance-jd-content mark");
  await expect(highlights).toHaveCount(2);
  await expect(highlights.first()).toHaveText(
    "Ứng viên nộp khoản đặt cọc 2.000.000 đồng trước khi nhận việc.",
  );
  const contrast = await highlights.first().evaluate((element) => {
    const style = getComputedStyle(element);
    const luminance = (color: string) => {
      const rgb = color
        .match(/\d+/g)!
        .slice(0, 3)
        .map(Number)
        .map((v) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    const values = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(7);
  await highlights.first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("ai-highlighted-jd.png"), animations: "disabled" });
  await page.locator(".compliance-finding-list blockquote").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("ai-findings.png"), animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
});

test("staff routes reject a signed-in candidate", async ({ page }) => {
  await login(page, "candidate_demo");
  await page.goto("/staff/jobs", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("alert")).toContainText(
    "không có quyền truy cập khu vực Platform staff",
  );
  await expect(
    page.getByRole("heading", { name: "Quản lý tin tuyển dụng", exact: true }),
  ).toHaveCount(0);
});

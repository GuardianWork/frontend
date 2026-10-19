import { test, expect, login } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await login(page, "admin_demo");
  await page.goto("/admin/compliance", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Tin tuyển dụng cần kiểm tra" })).toBeVisible();
});

test("lists already-published flagged JDs without a prepublication approval flow", async ({
  page,
}) => {
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(4);
  await expect(page.getByRole("searchbox")).toHaveCount(1);
  await expect(page.locator("textarea")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Phê duyệt|Duyệt tin|Rà soát nội dung|Điền nội dung mẫu/ }),
  ).toHaveCount(0);
  await expect(page.getByText("Dữ liệu minh họa", { exact: true })).toBeVisible();
  await expect(page.getByText("4 JD được gắn cờ · 2 tin công khai chưa xử lý")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
});

test("combines Vietnamese search, priority and handling filters, with empty-state recovery", async ({
  page,
}) => {
  await page.getByRole("searchbox").fill("ke toan");
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Kế toán công nợ", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Xóa từ khóa tìm kiếm" }).click();
  await page.getByRole("combobox", { name: /Mức ưu tiên/ }).selectOption("HIGH");
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(2);
  await page.getByRole("combobox", { name: /^Xử lý/ }).selectOption("OPEN");
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(1);
  await page.getByRole("searchbox").fill("không tồn tại");
  await expect(page.getByRole("heading", { name: "Không có JD phù hợp" })).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(4);
});

test("opens full published JD and findings, then restores filters and keyboard focus", async ({
  page,
}) => {
  await page.getByRole("searchbox").fill("JD-1042");
  await page.getByRole("button", { name: "Kế toán công nợ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kế toán công nợ", exact: true })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Nội dung JD đã đăng" })).toBeVisible();
  await expect(page.getByText("Đã đăng lúc", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dấu hiệu AI phát hiện" })).toBeVisible();
  await expect(page.locator(".compliance-finding-list blockquote")).toHaveCount(2);
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await expect(page.getByRole("searchbox")).toHaveValue("JD-1042");
  await expect(page.getByRole("button", { name: "Kế toán công nợ", exact: true })).toBeFocused();
});

test("hides a published job only after a reason and preserves history when restoring it", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Xem JD Kế toán công nợ", exact: true }).click();
  await page.getByRole("button", { name: "Ẩn tin đã đăng", exact: true }).click();
  await page.locator("#compliance-action-reason").fill("   ");
  await page.getByRole("button", { name: "Xác nhận ẩn tin", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Nhập lý do");
  await page
    .locator("#compliance-action-reason")
    .fill("Cần kiểm tra khoản đặt cọc được ghi trong JD.");
  await page.getByRole("button", { name: "Xác nhận ẩn tin", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Công khai lại tin", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lịch sử xử lý" })).toBeVisible();
  await expect(
    page.getByText("Cần kiểm tra khoản đặt cọc được ghi trong JD.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Công khai lại tin", exact: true }).click();
  await page
    .locator("#compliance-action-reason")
    .fill("Đã kiểm tra nội dung và ghi nhận kết quả xem xét.");
  await page.getByRole("button", { name: "Xác nhận công khai lại", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ẩn tin đã đăng", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đã xem xét", exact: true })).toBeDisabled();
  await expect(page.locator(".compliance-history li")).toHaveCount(2);
});

test("reviewing keeps the published job visible and updates the outstanding queue", async ({
  page,
}) => {
  await page.getByRole("combobox", { name: /^Xử lý/ }).selectOption("OPEN");
  await page.getByRole("button", { name: "Xem JD Kế toán công nợ", exact: true }).click();
  await page.getByRole("button", { name: "Đánh dấu đã xem xét", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đã xem xét", exact: true })).toBeDisabled();
  await expect(page.locator(".compliance-jd .compliance-visibility")).toHaveText("Đang công khai");
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(1);
  await expect(page.getByText("4 JD được gắn cờ · 1 tin công khai chưa xử lý")).toBeVisible();
  await expect(page.locator("#compliance-list-title")).toBeFocused();
});

import { test, expect, login } from "./fixtures";

// Legacy admin URLs now enter the staff queue. Its demonstrated decisions are
// intentionally local to this screen; service-backed publishing is tested separately.
test("legacy approval URL opens the current queue and validates rejection reasons", async ({
  page,
}) => {
  await login(page, "admin_demo");
  await page.goto("/admin/job-approvals");
  await expect(page).toHaveURL(/\/staff\/jobs$/);
  await page.getByRole("combobox", { name: "Trạng thái", exact: true }).selectOption("PENDING");
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Xem chi tiết Chuyên viên marketing", exact: true })
    .click();
  await page.getByRole("button", { name: "Từ chối đăng tin", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill("   ");
  await dialog.getByRole("button", { name: "Xác nhận từ chối đăng tin" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Nhập lý do");
  await dialog.getByRole("textbox").fill("Vui lòng làm rõ mức lương và phụ cấp.");
  await dialog.getByRole("button", { name: "Xác nhận từ chối đăng tin" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Đã từ chối");
  await expect(page.locator(".compliance-history")).toContainText(
    "Vui lòng làm rõ mức lương và phụ cấp.",
  );
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(1);
  await page.reload();
  await page.getByRole("combobox", { name: "Trạng thái", exact: true }).selectOption("PENDING");
  await expect(page.locator(".compliance-table tbody tr")).toHaveCount(2);
});

test("approval and visibility changes require confirmation and preserve local history", async ({
  page,
}) => {
  await login(page, "admin_demo");
  await page.goto("/staff/jobs");
  await page
    .getByRole("button", { name: "Xem chi tiết Chuyên viên chăm sóc khách hàng", exact: true })
    .click();
  await page.getByRole("button", { name: "Đồng ý đăng tin", exact: true }).click();
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Chờ duyệt");
  await page.getByRole("button", { name: "Xác nhận đồng ý đăng tin", exact: true }).click();
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Đang công khai");
  await page.getByRole("button", { name: "Ẩn tin đã đăng", exact: true }).click();
  await page.getByLabel("Lý do xử lý", { exact: false }).fill("Kiểm tra lại thông tin tuyển dụng.");
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Đang công khai");
  await page.getByRole("button", { name: "Ẩn tin đã đăng", exact: true }).click();
  await page.getByLabel("Lý do xử lý", { exact: false }).fill("Kiểm tra lại thông tin tuyển dụng.");
  await page.getByRole("button", { name: "Xác nhận ẩn tin", exact: true }).click();
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Đã ẩn");
  await page.getByRole("button", { name: "Công khai lại tin", exact: true }).click();
  await page.getByLabel("Lý do xử lý", { exact: false }).fill("Đã xác nhận nội dung tuyển dụng.");
  await page.getByRole("button", { name: "Xác nhận công khai lại", exact: true }).click();
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Đang công khai");
  await expect(page.locator(".compliance-history li")).toHaveCount(3);
});

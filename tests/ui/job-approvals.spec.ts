import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";
const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";
async function openReview(page: import("@playwright/test").Page) {
  await page.goto(`${origin}/staff/jobs`);
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nội dung gửi duyệt", exact: true }),
  ).toBeVisible();
}
test("real queue paginates on server and rejection persists after reload", async ({
  page,
}, info) => {
  const api = await staffJobApi(page);
  await login(page, "admin_demo");
  await page.goto(`${origin}/admin/job-approvals`);
  await expect(page).toHaveURL(/\/staff\/jobs$/);
  await expect(page.locator(".staff-jobs-table tbody tr")).toHaveCount(20);
  await page.getByRole("button", { name: "Trang sau" }).click();
  await expect(page.locator(".staff-jobs-table tbody tr")).toHaveCount(1);
  expect(api.listPages).toContain(1);
  await page.getByRole("combobox", { name: "Trạng thái", exact: true }).selectOption("ALL");
  await expect(page.locator(".staff-jobs-table tbody tr")).toHaveCount(20);
  expect(api.filters).toContain("ALL");
  await page.screenshot({ path: info.outputPath("staff-job-queue-desktop.png") });
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  await expect(page.getByText("Kinh nghiệm kế toán của bạn?", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Từ chối phiên bản", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill("short");
  await expect(dialog.getByRole("button", { name: "Xác nhận từ chối" })).toBeDisabled();
  await dialog.getByRole("textbox").fill("  Cần làm rõ quyền lợi và thời gian làm việc.  ");
  await dialog.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect(page.getByText("Đã từ chối phiên bản và lưu lý do.", { exact: true })).toBeVisible();
  await expect(page.locator(".staff-jobs-history")).toContainText(
    "Cần làm rõ quyền lợi và thời gian làm việc.",
  );
  expect(api.decisions).toBe(1);
  await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  await page.getByRole("combobox", { name: "Trạng thái", exact: true }).selectOption("REJECTED");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Không có tin trong mục này" })).toBeVisible();
  await page.getByRole("combobox", { name: "Trạng thái", exact: true }).selectOption("REJECTED");
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Bị từ chối");
});
test("approval uses exact versions and does not claim a paused job is public", async ({
  page,
}, info) => {
  const api = await staffJobApi(page);
  await login(page, "admin_demo");
  await openReview(page);
  await page.getByRole("button", { name: "Phê duyệt phiên bản", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xác nhận phê duyệt" }).click();
  await expect(
    page.getByText("Đã duyệt phiên bản. Trạng thái tin: Đã tạm dừng tuyển.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Đã duyệt");
  await expect(page.getByRole("button", { name: "Ẩn tin đã đăng" })).toHaveCount(0);
  expect(api.detailLoads).toBeGreaterThan(1);
  expect(api.historyLoads).toBeGreaterThan(1);
  await page.screenshot({
    path: info.outputPath("staff-job-detail-desktop.png"),
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: info.outputPath("staff-job-detail-mobile.png"),
    animations: "disabled",
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
});
test("conflict retains reason and requires fresh inspection before another decision", async ({
  page,
}) => {
  const api = await staffJobApi(page);
  api.conflict = true;
  await login(page, "admin_demo");
  await openReview(page);
  await page.getByRole("button", { name: "Từ chối phiên bản", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill("Cần làm rõ quyền lợi và thời gian làm việc.");
  await dialog.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect(dialog.getByRole("alert")).toContainText("đã thay đổi");
  await expect(dialog.getByRole("textbox")).toHaveValue(
    "Cần làm rõ quyền lợi và thời gian làm việc.",
  );
  await expect(dialog.getByRole("button", { name: "Xác nhận từ chối" })).toHaveCount(0);
  api.review.jobVersion = 9;
  api.conflict = false;
  await dialog.getByRole("button", { name: "Tải lại bản tin" }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Từ chối phiên bản", exact: true }).click();
  await expect(dialog.getByRole("textbox")).toHaveValue(
    "Cần làm rõ quyền lợi và thời gian làm việc.",
  );
  await dialog.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect(page.getByText("Đã từ chối phiên bản và lưu lý do.", { exact: true })).toBeVisible();
});
test("queue failure, empty results and history retry stay separate from review eligibility", async ({
  page,
}, info) => {
  const api = await staffJobApi(page);
  api.failList = true;
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/jobs`);
  await expect(page.getByRole("alert")).toContainText("kiểm tra kết nối");
  api.failList = false;
  api.empty = true;
  await page.getByRole("button", { name: "Thử tải lại" }).click();
  await expect(page.getByRole("heading", { name: "Không có tin trong mục này" })).toBeVisible();
  api.empty = false;
  api.failHistory = true;
  api.review.approvalEligible = false;
  api.review.needsReassignment = true;
  await page.getByRole("button", { name: "Tải lại", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".staff-jobs-table tbody tr")).toHaveCount(20);
  await page.screenshot({ path: info.outputPath("staff-job-queue-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Phê duyệt phiên bản", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Từ chối phiên bản", exact: true })).toBeEnabled();
  api.failHistory = false;
  await page.getByRole("button", { name: "Thử tải lại", exact: true }).click();
  await expect(page.locator(".staff-jobs-history")).toContainText("Người gửi: 22");
});

test("revision history is sortable and selectable in the main job review without tabs", async ({
  page,
}, info) => {
  const api = await staffJobApi(page);
  const older = {
    ...api.review,
    id: 90,
    revisionNumber: 1,
    state: "REJECTED",
    approvalEligible: false,
    content: {
      ...api.review.content,
      title: "Chuyên viên kế toán (bản trước)",
      description: "Nội dung riêng của phiên bản đã gửi trước đó.",
    },
    submittedAt: "2026-10-28T08:00:00Z",
    decidedAt: "2026-10-28T09:00:00Z",
    reviewerUserId: 4,
  };
  await page.route("**/api/staff/jobs/83/revisions?**", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          content: [older, api.review],
          pageNumber: 0,
          pageSize: 20,
          totalElements: 2,
          totalPages: 1,
          first: true,
          last: true,
        },
      },
    }),
  );
  await page.route("**/api/staff/job-revisions/90", (route) =>
    route.fulfill({ json: { status: 200, data: older } }),
  );
  await login(page, "admin_demo");
  await openReview(page);
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.locator(".staff-posting-history")).toHaveCount(0);
  const history = page.getByRole("region", { name: "Lịch sử phiên bản của tin #83", exact: true });
  await expect(history).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nội dung gửi duyệt", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Phê duyệt phiên bản", exact: true }),
  ).toBeVisible();
  await expect(history.getByRole("columnheader", { name: /Phiên bản/ })).toHaveAttribute(
    "aria-sort",
    "descending",
  );
  await expect(history.locator("tbody tr").first()).toContainText("Phiên bản 2");
  await history
    .getByRole("button", { name: "Sắp xếp theo phiên bản trong trang hiện tại", exact: true })
    .click();
  await expect(history.getByRole("columnheader", { name: /Phiên bản/ })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await expect(history.locator("tbody tr").first()).toContainText("Phiên bản 1");
  await page.screenshot({ path: info.outputPath("inline-revision-history.png") });
  await history.getByRole("button", { name: "Xem phiên bản 1", exact: true }).click();
  await expect(page.getByRole("heading", { name: older.content.title, exact: true })).toBeFocused();
  await expect(page.getByText(older.content.description, { exact: true })).toBeVisible();
  await expect(page.locator("#workspace-main")).toHaveJSProperty("scrollTop", 0);
  await expect(page.locator(".staff-job-object-heading")).toContainText("Phiên bản 1");
  await expect(page.getByRole("button", { name: "Phê duyệt phiên bản", exact: true })).toHaveCount(
    0,
  );
  await expect(history.locator('tr[aria-current="true"]')).toContainText("Phiên bản 1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
});

import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";
const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";

test("report read and processing changes appear in the separate browser activity source", async ({
  page,
}, info) => {
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/reports`);
  await expect(page.locator('tr[data-unread="true"]')).toHaveCount(4);
  await expect(page.locator("tbody .admin-record-status")).toHaveCount(1);
  await page
    .getByRole("button", { name: /Xem chi tiết/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Đang xem xét", exact: true }).click();
  await dialog.getByRole("button", { name: "Đã xử lý", exact: true }).click();
  await dialog.getByRole("button", { name: "Đánh dấu chưa đọc", exact: true }).click();
  await page.goto(`${origin}/staff/audit-logs`);
  await page.getByRole("button", { name: "Báo cáo vi phạm · Trình duyệt", exact: true }).click();
  const history = page.locator(".report-activity-table");
  await expect(history.locator("tbody tr")).toHaveCount(4);
  await expect(history).toContainText("Đã đọc báo cáo");
  await expect(history).toContainText("Đã chuyển sang đang xem xét");
  await expect(history).toContainText("Đã đánh dấu đã xử lý");
  await expect(history).toContainText("Đã đánh dấu chưa đọc");
  await expect(history).toContainText("Kế toán tổng hợp");
  await page.screenshot({ path: info.outputPath("report-activity.png"), fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Báo cáo vi phạm · Trình duyệt", exact: true }).click();
  await expect(history.locator("tbody tr")).toHaveCount(4);
  await page.locator(".report-activity-toolbar select").selectOption("RESOLVE");
  await expect(history.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("searchbox").fill("Không có đối tượng này");
  await expect(page.getByRole("heading", { name: "Không có hoạt động phù hợp" })).toBeVisible();
});

test("company audit uses the same recorded verification outcomes as the dossier page", async ({
  page,
}, info) => {
  await page.route("**/api/staff/me/activities?*", (route) =>
    route.fulfill({
      json: {
        data: {
          content: [
            { id: 71, action: "APPROVE_COMPANY", after: "VERIFIED" },
            { id: 72, action: "REJECT_COMPANY", after: "REJECTED" },
            { id: 73, action: "REVIEW_COMPANY", after: "CHECKED" },
          ].map((item) => ({
            id: item.id,
            occurredAt: "2026-11-07T03:00:00Z",
            category: "COMPANY_VERIFICATION",
            action: item.action,
            targetType: "COMPANY",
            targetId: "101",
            revisionId: null,
            changes: [{ field: "verificationStatus", before: "PENDING", after: item.after }],
            reason: null,
          })),
          pageNumber: 0,
          pageSize: 20,
          totalElements: 3,
          totalPages: 1,
          first: true,
          last: true,
        },
      },
    }),
  );
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/audit-logs`);
  const rows = page.locator(".activity-table tbody tr");
  await expect(rows).toHaveCount(3);
  const approved = rows.filter({ hasText: "Đã xác minh công ty" });
  const rejected = rows.filter({ hasText: "Đã từ chối xác minh công ty" });
  const unknown = rows.filter({ hasText: "Đã xét duyệt công ty (chưa rõ kết quả)" });
  await expect(approved).toContainText("Chờ duyệt");
  await expect(approved).toContainText("Đã xác minh");
  await expect(rejected).toContainText("Đã từ chối");
  await expect(unknown).toContainText("Chưa rõ kết quả xác minh");
  await expect(unknown.locator(".activity-result-tag")).not.toContainText("Đã xác minh");
  await expect(page.locator(".activity-table")).not.toContainText("Chờ xác minh");
  await page.screenshot({
    path: info.outputPath("company-verification-history.png"),
    fullPage: true,
  });
});

test("staff job action buttons align with the right edge of their section", async ({
  page,
}, info) => {
  await staffJobApi(page);
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/jobs`);
  await expect(page.locator(".staff-jobs-table tbody tr").first()).toBeVisible();
  const refresh = await page.getByRole("button", { name: "Tải lại", exact: true }).boundingBox();
  const section = await page.locator(".staff-jobs.compliance-list").boundingBox();
  const filter = await page.locator(".staff-jobs .admin-sample-filter select").boundingBox();
  expect(Math.abs(refresh!.x + refresh!.width - section!.x - section!.width)).toBeLessThan(2);
  expect(refresh!.x).toBeGreaterThan(filter!.x + filter!.width);
  await page.screenshot({ path: info.outputPath("jobs-actions.png"), fullPage: true });
  await page.locator(".staff-jobs-table tbody button").first().click();
  await expect(page.locator(".staff-job-review-actions")).toBeVisible();
  const buttons = await page.locator(".staff-job-review-actions button").evaluateAll((els) =>
    els.map((el) => {
      const b = el.getBoundingClientRect();
      return b.right;
    }),
  );
  expect(Math.abs(buttons[0] - buttons[1])).toBeLessThan(2);
  await page.screenshot({ path: info.outputPath("job-review-actions.png"), fullPage: true });
});

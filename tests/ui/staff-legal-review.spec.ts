import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";

test("staff jobs keeps legal review in JD details without a separate sample section", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await staffJobApi(page);
  await login(page, "admin_demo");
  await page.goto("http://localhost:5138/staff/jobs");
  await expect(
    page.getByRole("heading", { name: "Hàng đợi duyệt tin", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Rà soát AI theo pháp luật" })).toHaveCount(0);
  await expect(page.locator("#staff-reviews")).toBeVisible();
  await expect(page.locator("#staff-legal-ai")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Mục trong trang quản lý tin" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("heading", { name: "Rà soát AI theo pháp luật" })).toHaveCount(0);
  await page.screenshot({ path: "/tmp/gw-staff-jobs-desktop.png", fullPage: true });
});

test("job detail reviews its own revision and clears previous local findings after reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const api = await staffJobApi(page);
  api.review.content.description =
    "Ứng viên nộp khoản đặt cọc 2.000.000 đồng trước khi nhận việc.\nNộp bản gốc bằng tốt nghiệp cho công ty.";
  await login(page, "admin_demo");
  await page.goto("http://localhost:5138/staff/jobs");
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  const panel = page
    .locator("#staff-reviews")
    .getByRole("region", { name: "Rà soát AI theo pháp luật" });
  await expect(panel).toContainText("Tin #83 · Bản v2 · Phiên bản dữ liệu 7");
  await expect(panel).toContainText("Chưa có kết quả AI");
  await expect(panel.locator("blockquote")).toHaveCount(2);
  await expect(panel.locator("blockquote").first()).toContainText("2.000.000");
  await expect(page.locator(".staff-review-conditions")).toContainText("Không bị đình chỉ");
  await expect(page.locator(".staff-review-conditions")).not.toContainText("Người phụ trách");
  await expect(
    page.getByRole("button", { name: "Phê duyệt phiên bản", exact: true }),
  ).toBeEnabled();
  await page.screenshot({ path: "/tmp/gw-staff-job-detail-legal.png", fullPage: true });
  api.review.content.description = "Kiểm tra chứng từ và lập báo cáo tài chính.";
  api.review.revisionVersion = 8;
  api.review.validationIssues = [{ field: "content.deadline", code: "DEADLINE_PASSED" }];
  api.review.approvalEligible = false;
  await page.getByRole("button", { name: "Tải lại bản tin", exact: true }).click();
  await expect(panel).toContainText("Phiên bản dữ liệu 8");
  await expect(panel.locator("blockquote")).toHaveCount(0);
  await expect(panel).toContainText("không xác nhận tin phù hợp pháp luật");
  await expect(page.getByText("Hạn ứng tuyển đã qua. Công ty cần cập nhật hạn mới.")).toBeVisible();
  await expect(page.locator(".staff-jobs-eligibility")).not.toContainText("DEADLINE_PASSED");
  const approve = page.getByRole("button", { name: "Phê duyệt phiên bản", exact: true });
  await expect(approve).toBeDisabled();
  await approve.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/tmp/gw-staff-review-actions-desktop.png" });
  expect(api.decisions).toBe(0);
});

test("staff reads a known scan without changing approval eligibility", async ({ page }) => {
  await staffJobApi(page);
  const requests: string[] = [];
  await page.route("**/api/staff/job-revisions/91/scans/*", (route) => {
    requests.push(route.request().url());
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    return route.fulfill({
      json: {
        status: 200,
        data: {
          scanId: 401,
          revisionId: 91,
          revisionVersion: 7,
          status: "COMPLETED",
          mode: "stub",
          outdated: false,
          failureCode: null,
          analysisText: "Mô tả: Kiểm tra chứng từ.",
          profile: "recruitment",
          legalSnapshot: "2026-11",
          asOfDate: "2026-11-12",
          createdAt: "2026-11-12T00:00:00Z",
          report: {
            schemaVersion: "1",
            mode: "stub",
            profile: "recruitment",
            legalSnapshot: "2026-11",
            asOfDate: "2026-11-12",
            outcome: "OUT_OF_SCOPE",
            findings: [],
            warnings: [],
            usage: { available: false },
          },
        },
      },
    });
  });
  await login(page, "admin_demo");
  await page.goto("http://localhost:5138/staff/jobs");
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  expect(requests).toHaveLength(0);
  await page.getByLabel("Mã phân tích", { exact: true }).fill("401");
  await page.getByRole("button", { name: "Xem kết quả AI", exact: true }).click();
  await expect(page.getByText("Ngoài phạm vi hỗ trợ", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Chế độ thử nghiệm — chưa thực hiện phân tích AI", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Phê duyệt phiên bản", exact: true }),
  ).toBeEnabled();
  await page.getByText("Xem bản nội dung đã phân tích", { exact: true }).click();
  await page.locator(".staff-known-scan").evaluate((element) => {
    element.scrollIntoView({ block: "start" });
    const main = element.closest("main");
    if (main) main.scrollTop -= 24;
  });
  await page.screenshot({
    path: ".impeccable/review/staff-known-scan-panel-desktop.png",
    fullPage: true,
  });
  await page.locator("main").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: ".impeccable/review/staff-known-scan-desktop.png",
    fullPage: true,
  });
});

import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";

test("staff jobs restores legal AI findings without mixing sample actions with the review API", async ({
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
  await expect(page.locator("#staff-legal-ai")).toBeVisible();
  await page.getByRole("link", { name: "Rà soát AI theo pháp luật", exact: true }).click();
  await expect(page.getByRole("note")).toContainText("Dịch vụ quét AI chưa được kết nối");
  await page.getByRole("button", { name: "Kế toán công nợ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dấu hiệu AI phát hiện" })).toBeVisible();
  const references = page.locator(".staff-legal-reference");
  await expect(references).toHaveCount(2);
  await expect(references.first()).toContainText("Điều 17 khoản 2");
  await expect(references.last()).toContainText("Điều 17 khoản 1");
  await expect(references.first()).toHaveAttribute("href", /vanban.chinhphu.vn/);
  await page.screenshot({ path: "/tmp/gw-staff-legal-ai-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Về hàng đợi duyệt tin", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Hàng đợi duyệt tin", exact: true }),
  ).toBeVisible();
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
  await expect(page.getByRole("button", { name: "Đồng ý đăng tin", exact: true })).toBeEnabled();
  await page.screenshot({ path: "/tmp/gw-staff-job-detail-legal.png", fullPage: true });
  api.review.content.description = "Kiểm tra chứng từ và lập báo cáo tài chính.";
  api.review.revisionVersion = 8;
  await page.getByRole("button", { name: "Tải lại bản tin", exact: true }).click();
  await expect(panel).toContainText("Phiên bản dữ liệu 8");
  await expect(panel.locator("blockquote")).toHaveCount(0);
  await expect(panel).toContainText("không xác nhận tin phù hợp pháp luật");
  expect(api.decisions).toBe(0);
});

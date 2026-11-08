import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";
const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";
test("staff job details omit posting activity and display revision history inline", async ({
  page,
}) => {
  await staffJobApi(page);
  let activityRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/staff/jobs/83/history") activityRequests++;
  });
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/jobs`);
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.locator(".staff-posting-history")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ẩn tin tuyển dụng", exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Lịch sử phiên bản của tin #83", exact: true }),
  ).toBeVisible();
  expect(activityRequests).toBe(0);
});

test("public 404 clears content and does not disclose a suspension", async ({ page }) => {
  await page.route("**/api/jobs/42", (route) =>
    route.fulfill({ status: 404, json: { status: 404, message: "Not found", data: null } }),
  );
  await page.goto("/jobs?job=42");
  await expect(
    page.getByRole("heading", { name: "Tin tuyển dụng không còn khả dụng", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("SUSPENDED", { exact: true })).toHaveCount(0);
});

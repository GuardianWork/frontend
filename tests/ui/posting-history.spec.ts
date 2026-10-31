import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";
const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";
test("hide preserves reason on conflict and refreshes event history", async ({ page }, info) => {
  const api = await staffJobApi(page);
  let suspended = false;
  let attempts = 0;
  await page.route("**/api/staff/jobs/83/history?*", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          content: suspended
            ? [
                {
                  createdAt: "2026-10-31T03:00:00Z",
                  actorUserId: 12,
                  eventType: "JOB_SUSPENDED",
                  previousStatus: "PUBLISHED",
                  status: "SUSPENDED",
                  reason: "Vi phạm quy định",
                },
              ]
            : [],
          pageNumber: 0,
          pageSize: 20,
          totalElements: suspended ? 1 : 0,
          totalPages: suspended ? 1 : 0,
          first: true,
          last: true,
        },
      },
    }),
  );
  await page.route("**/api/staff/job-revisions/91", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          ...api.review,
          publicationStatus: suspended ? "SUSPENDED" : "PUBLISHED",
          jobVersion: attempts ? 8 : 7,
        },
      },
    }),
  );
  await page.route("**/api/staff/jobs/83/hide", async (route) => {
    attempts++;
    expect(route.request().postDataJSON()).toEqual({
      expectedJobVersion: attempts === 1 ? 7 : 8,
      reason: "Vi phạm quy định",
    });
    if (attempts === 1)
      return route.fulfill({ status: 409, json: { status: 409, message: "Conflict", data: null } });
    suspended = true;
    return route.fulfill({
      json: {
        status: 200,
        data: {
          jobId: 83,
          publicationStatus: "SUSPENDED",
          jobVersion: 9,
          actorUserId: 12,
          suspendedAt: "2026-10-31T03:00:00Z",
          reason: "Vi phạm quy định",
        },
      },
    });
  });
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/jobs`);
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  await page.getByRole("tab", { name: "Hoạt động và trạng thái", exact: true }).click();
  await expect(page.getByText("Chưa có lịch sử hoạt động.")).toBeVisible();
  await page.getByRole("button", { name: "Ẩn tin tuyển dụng", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill("  Vi phạm quy định  ");
  await dialog.getByRole("button", { name: "Xác nhận ẩn tin" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Tin đã thay đổi");
  await expect(dialog.getByRole("textbox")).toHaveValue("  Vi phạm quy định  ");
  await expect(dialog.getByRole("button", { name: "Xác nhận ẩn tin" })).toBeEnabled();
  await page.screenshot({ path: info.outputPath("hide-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dialog).toBeInViewport();
  await expect.poll(async () => (await dialog.boundingBox())!.x).toBeGreaterThanOrEqual(0);
  await expect
    .poll(async () => {
      const bounds = (await dialog.boundingBox())!;
      return bounds.x + bounds.width;
    })
    .toBeLessThanOrEqual(390);
  await page.screenshot({ path: info.outputPath("hide-mobile.png") });
  await dialog.getByRole("button", { name: "Xác nhận ẩn tin" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Đã ẩn tin tuyển dụng · JOB_SUSPENDED")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ẩn tin tuyển dụng", exact: true })).toHaveCount(0);
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

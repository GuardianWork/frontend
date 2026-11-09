import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";

const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";

async function setup(page: import("@playwright/test").Page) {
  const api = await staffJobApi(page);
  api.review.state = "APPROVED";
  api.review.approvalEligible = false;
  const state = { status: "SUSPENDED", reads: 0, unavailable: false };
  await page.route("**/api/jobs/83", (route) =>
    route.fulfill({
      status: state.status === "PUBLISHED" ? 200 : 404,
      json:
        state.status === "PUBLISHED"
          ? { data: { id: 83, publicationStatus: "PUBLISHED", content: api.review.content } }
          : { message: "Not found" },
    }),
  );
  await page.route("**/api/staff/jobs/83/history?*", (route) => {
    state.reads++;
    if (state.unavailable) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    return route.fulfill({
      json: {
        data: {
          content: [
            {
              eventType: "JOB_SUSPENDED",
              status: state.status,
              actorUserId: 4,
              createdAt: "2026-11-01T00:00:00Z",
            },
          ],
          pageNumber: 0,
          pageSize: 20,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
      },
    });
  });
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/jobs`);
  await page.getByRole("combobox", { name: "Trạng thái", exact: true }).selectOption("APPROVED");
  return { api, state };
}

test("suspension appears in the list and the detail header independently of revision approval", async ({
  page,
}, info) => {
  await setup(page);
  const table = page.locator(".staff-jobs-table");
  await expect(
    table.getByRole("columnheader", { name: "Trạng thái đăng tin", exact: true }),
  ).toBeVisible();
  const row = table.locator("tbody tr").first();
  await expect(row.locator(".staff-job-posting-status")).toHaveText("Đã đình chỉ");
  await expect(row).toContainText("Đã duyệt");
  await page.screenshot({
    path: info.outputPath("suspended-list-desktop.png"),
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  await expect(page.locator(".staff-job-object-heading .staff-job-posting-status")).toHaveText(
    "Đã đình chỉ",
  );
  await expect(
    page.getByRole("region", { name: "Tin tuyển dụng đã bị đình chỉ", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".staff-jobs-eligibility")).toContainText("Đình chỉ công ty");
  await expect(page.locator(".compliance-jd .admin-record-status")).toHaveText("Đã duyệt");
  await expect(
    page.getByRole("button", { name: "Khôi phục tin tuyển dụng", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("suspended-detail-desktop.png"),
    animations: "disabled",
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("detail reload refreshes posting status and the list shows the resulting state", async ({
  page,
}) => {
  const { state } = await setup(page);
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  await expect(page.locator(".staff-job-object-heading .staff-job-posting-status")).toHaveText(
    "Đã đình chỉ",
  );
  state.status = "PUBLISHED";
  await page.getByRole("button", { name: "Tải lại bản tin", exact: true }).click();
  await expect(page.locator(".staff-job-object-heading .staff-job-posting-status")).toHaveText(
    "Đang công khai",
  );
  await expect(
    page.getByRole("region", { name: "Tin tuyển dụng đã bị đình chỉ", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Khôi phục tin tuyển dụng", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await expect(
    page.locator(".staff-jobs-table tbody tr").first().locator(".staff-job-posting-status"),
  ).toHaveText("Đang công khai");
});

test("an unreadable posting status never falls back to the approved revision label", async ({
  page,
}) => {
  const { state } = await setup(page);
  await expect(
    page.locator(".staff-jobs-table tbody tr").first().locator(".staff-job-posting-status"),
  ).toHaveText("Đã đình chỉ");
  state.unavailable = true;
  await page.getByRole("button", { name: "Tải lại", exact: true }).click();
  await expect(
    page.locator(".staff-jobs-table tbody tr").first().locator(".staff-job-posting-status"),
  ).toContainText("Chưa xác định");
});
